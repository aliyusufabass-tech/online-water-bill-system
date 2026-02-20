from datetime import timedelta
from decimal import Decimal
from io import BytesIO

from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import Http404, HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .jwt_auth import build_tokens, jwt_decode
from .models import Bill, Payment, SystemProfile
from .serializers import (
    AdminCreateBillSerializer,
    AdminCreateUserSerializer,
    AdminUpdateBillSerializer,
    BillSerializer,
    LoginSerializer,
    PayBillSerializer,
    PaymentDecisionSerializer,
    PaymentSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    SystemProfileSerializer,
    UserSerializer,
)


def _profile_or_404(user):
    profile = getattr(user, 'profile', None)
    if not profile:
        raise Http404('System profile not found.')
    return profile


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Registration successful.',
                'tokens': build_tokens(user),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminRegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_staff = True
        user.save(update_fields=['is_staff'])
        return Response(
            {
                'message': 'Admin registration successful.',
                'tokens': build_tokens(user),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        return Response(
            {
                'message': 'Login successful.',
                'tokens': build_tokens(user),
                'user': UserSerializer(user).data,
            }
        )


class AdminLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if not user.is_staff:
            return Response({'error': 'Admin credentials required.'}, status=403)
        return Response(
            {
                'message': 'Admin login successful.',
                'tokens': build_tokens(user),
                'user': UserSerializer(user).data,
            }
        )


class TokenRefreshAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = jwt_decode(serializer.validated_data['refresh'])
        if not payload or payload.get('type') != 'refresh':
            return Response({'error': 'Invalid or expired refresh token.'}, status=401)

        user = User.objects.filter(id=payload.get('sub')).first()
        if not user:
            return Response({'error': 'User not found.'}, status=404)

        return Response({'tokens': build_tokens(user)})


class LogoutAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({'message': 'Logout successful.'})


class MeAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'authenticated': False})

        profile = getattr(request.user, 'profile', None)
        return Response(
            {
                'authenticated': True,
                'username': request.user.username,
                'email': request.user.email,
                'is_staff': request.user.is_staff,
                'profile': SystemProfileSerializer(profile).data if profile else None,
            }
        )


class UserSystemProfileAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            return Response({'error': 'Admin users do not have user profile view.'}, status=400)

        profile = _profile_or_404(request.user)
        return Response({'profile': SystemProfileSerializer(profile).data})


class UserBillsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            return Response({'error': 'Use admin bills endpoint.'}, status=400)

        profile = _profile_or_404(request.user)
        bills = Bill.objects.filter(profile=profile)
        return Response({'bills': BillSerializer(bills, many=True).data})


class UserPayBillAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, bill_id):
        if request.user.is_staff:
            return Response({'error': 'Admin users cannot pay bills.'}, status=400)

        profile = _profile_or_404(request.user)
        bill = Bill.objects.filter(id=bill_id, profile=profile).first()
        if not bill:
            return Response({'error': 'Bill not found.'}, status=404)
        if bill.status in [Bill.STATUS_PENDING, Bill.STATUS_PAID]:
            return Response({'error': 'This bill cannot be paid right now.'}, status=400)

        serializer = PayBillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if payload['amount'] != bill.amount_due:
            return Response({'error': 'Payment amount must match bill amount due.'}, status=400)

        payment = Payment.objects.create(
            bill=bill,
            amount=payload['amount'],
            payment_method=payload['payment_method'],
            transaction_reference=payload['transaction_reference'],
            status=Payment.PENDING,
        )
        bill.status = Bill.STATUS_PENDING
        bill.save(update_fields=['status'])

        return Response(
            {'message': 'Payment submitted. Waiting admin approval.', 'payment': PaymentSerializer(payment).data},
            status=201,
        )


class UserReceiptsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            return Response({'error': 'Use admin payments endpoint.'}, status=400)

        profile = _profile_or_404(request.user)
        payments = Payment.objects.filter(bill__profile=profile, status=Payment.APPROVED)
        return Response({'receipts': PaymentSerializer(payments, many=True).data})


class UserPaymentHistoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            return Response({'error': 'Use admin payments endpoint.'}, status=400)

        profile = _profile_or_404(request.user)
        payments = Payment.objects.filter(bill__profile=profile)
        return Response({'history': PaymentSerializer(payments, many=True).data})


class UserReceiptDownloadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, payment_id):
        if request.user.is_staff:
            return Response({'error': 'Admin cannot download user receipt from this endpoint.'}, status=400)

        profile = _profile_or_404(request.user)
        payment = Payment.objects.filter(id=payment_id, bill__profile=profile, status=Payment.APPROVED).first()
        if not payment:
            return Response({'error': 'Receipt not found.'}, status=404)

        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except ModuleNotFoundError:
            return Response({'error': 'PDF generator not installed. Install reportlab.'}, status=500)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        y = 800
        lines = [
            'Water Bill Payment Receipt',
            f'Customer: {payment.bill.profile.full_name}',
            f'Account Number: {payment.bill.profile.account_number}',
            f'Billing Period: {payment.bill.billing_period}',
            f'Meter Reading: {payment.bill.meter_reading}',
            f'Amount Paid: {payment.amount}',
            f'Payment Method: {payment.get_payment_method_display()}',
            f'Transaction Reference: {payment.transaction_reference}',
            f'Payment Status: {payment.get_status_display()}',
            f'Paid At: {timezone.localtime(payment.paid_at):%Y-%m-%d %H:%M:%S}',
        ]
        pdf.setFont('Helvetica-Bold', 16)
        pdf.drawString(50, y, 'Receipt')
        y -= 30
        pdf.setFont('Helvetica', 11)
        for line in lines:
            pdf.drawString(50, y, line)
            y -= 20
        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{payment.transaction_reference}.pdf"'
        return response


class AdminUsersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('username')
        return Response({'users': UserSerializer(users, many=True).data})

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'message': 'User created successfully.', 'user': UserSerializer(user).data}, status=201)


class AdminUserDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def delete(self, request, user_id):
        if request.user.id == user_id:
            return Response({'error': 'You cannot delete your own admin account.'}, status=400)

        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=404)
        user.delete()
        return Response({'message': 'User deleted successfully.'})


class AdminBillsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        bills = Bill.objects.select_related('profile').all()
        return Response({'bills': BillSerializer(bills, many=True).data})

    def post(self, request):
        serializer = AdminCreateBillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        return Response({'message': 'Bill added successfully.', 'bill': BillSerializer(bill).data}, status=201)


class AdminBillDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def patch(self, request, bill_id):
        bill = Bill.objects.filter(id=bill_id).first()
        if not bill:
            return Response({'error': 'Bill not found.'}, status=404)

        serializer = AdminUpdateBillSerializer(bill, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Bill updated successfully.', 'bill': BillSerializer(bill).data})

    def delete(self, request, bill_id):
        bill = Bill.objects.filter(id=bill_id).first()
        if not bill:
            return Response({'error': 'Bill not found.'}, status=404)
        bill.delete()
        return Response({'message': 'Bill deleted successfully.'})


class AdminPaymentsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        payments = Payment.objects.select_related('bill', 'bill__profile').all()
        return Response({'payments': PaymentSerializer(payments, many=True).data})


class AdminPaymentDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def delete(self, request, payment_id):
        payment = Payment.objects.filter(id=payment_id).first()
        if not payment:
            return Response({'error': 'Payment not found.'}, status=404)
        if payment.bill.status == Bill.STATUS_PENDING:
            payment.bill.status = Bill.STATUS_UNPAID
            payment.bill.save(update_fields=['status'])
        payment.delete()
        return Response({'message': 'Payment request deleted successfully.'})


class AdminPaymentDecisionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request, payment_id):
        payment = Payment.objects.select_related('bill').filter(id=payment_id).first()
        if not payment:
            return Response({'error': 'Payment not found.'}, status=404)
        if payment.status != Payment.PENDING:
            return Response({'error': 'Only pending payments can be reviewed.'}, status=400)

        serializer = PaymentDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        if action == 'approve':
            payment.status = Payment.APPROVED
            payment.bill.status = Bill.STATUS_PAID
        else:
            payment.status = Payment.REJECTED
            payment.bill.status = Bill.STATUS_REJECTED
        payment.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        payment.bill.save(update_fields=['status'])

        return Response({'message': f'Payment {action}d successfully.', 'payment': PaymentSerializer(payment).data})


class AdminReportsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'weekly')
        now = timezone.now()
        if period == 'weekly':
            start = now - timedelta(days=7)
        elif period == 'monthly':
            start = now - timedelta(days=30)
        elif period == 'yearly':
            start = now - timedelta(days=365)
        else:
            return Response({'error': 'Period must be weekly, monthly, or yearly.'}, status=400)

        approved = Payment.objects.filter(status=Payment.APPROVED, paid_at__gte=start)
        pending = Payment.objects.filter(status=Payment.PENDING, paid_at__gte=start)
        rejected = Payment.objects.filter(status=Payment.REJECTED, paid_at__gte=start)
        revenue = approved.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return Response(
            {
                'period': period,
                'from': start.isoformat(),
                'to': now.isoformat(),
                'approved_payments': approved.count(),
                'pending_payments': pending.count(),
                'rejected_payments': rejected.count(),
                'total_revenue': str(revenue),
            }
        )
