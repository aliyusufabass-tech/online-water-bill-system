import json
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import Http404, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import CustomerProfile, Payment, WaterBill


def _json_body(request):
    try:
        return json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return {}


def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    return None


def _require_admin(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required.'}, status=403)
    return None


def _get_profile(user):
    return getattr(user, 'profile', None)


def _bill_payload(bill):
    latest_payment = bill.payments.first()
    due_date = bill.due_date.isoformat() if hasattr(bill.due_date, 'isoformat') else str(bill.due_date)
    return {
        'id': bill.id,
        'billing_period': bill.billing_period,
        'previous_reading': str(bill.previous_reading),
        'current_reading': str(bill.current_reading),
        'amount_due': str(bill.amount_due),
        'due_date': due_date,
        'is_paid': bill.is_paid,
        'latest_payment_status': latest_payment.status if latest_payment else None,
    }


def _payment_payload(payment):
    return {
        'id': payment.id,
        'bill_id': payment.bill_id,
        'billing_period': payment.bill.billing_period,
        'username': payment.bill.profile.user.username,
        'account_number': payment.bill.profile.account_number,
        'amount_paid': str(payment.amount_paid),
        'payment_method': payment.payment_method,
        'transaction_reference': payment.transaction_reference,
        'status': payment.status,
        'paid_at': payment.paid_at.isoformat(),
    }


def _user_payload(user):
    profile = _get_profile(user)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'account_number': profile.account_number if profile else '',
        'phone_number': profile.phone_number if profile else '',
    }


@csrf_exempt
@require_POST
def register_api(request):
    data = _json_body(request)
    required = ['username', 'email', 'password', 'account_number', 'phone_number']
    missing = [field for field in required if not data.get(field)]
    if missing:
        return JsonResponse({'error': f'Missing fields: {", ".join(missing)}'}, status=400)

    if User.objects.filter(username=data['username']).exists():
        return JsonResponse({'error': 'Username already exists.'}, status=400)
    if User.objects.filter(email=data['email']).exists():
        return JsonResponse({'error': 'Email already exists.'}, status=400)
    if CustomerProfile.objects.filter(account_number=data['account_number']).exists():
        return JsonResponse({'error': 'Account number already exists.'}, status=400)

    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
    )
    CustomerProfile.objects.create(
        user=user,
        account_number=data['account_number'],
        phone_number=data['phone_number'],
        address=data.get('address', ''),
    )
    login(request, user)
    return JsonResponse({'message': 'Registration successful.'}, status=201)


@csrf_exempt
@require_POST
def login_api(request):
    data = _json_body(request)
    user = authenticate(
        request,
        username=data.get('username', ''),
        password=data.get('password', ''),
    )
    if user is None:
        return JsonResponse({'error': 'Invalid username or password.'}, status=400)
    login(request, user)
    return JsonResponse({'message': 'Login successful.'})


@csrf_exempt
@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({'message': 'Logout successful.'})


@require_GET
def me_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False})

    profile = _get_profile(request.user)
    return JsonResponse(
        {
            'authenticated': True,
            'username': request.user.username,
            'email': request.user.email,
            'is_staff': request.user.is_staff,
            'account_number': profile.account_number if profile else '',
        }
    )


@require_GET
def dashboard_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    if request.user.is_staff:
        return JsonResponse({'error': 'Use admin dashboard endpoint.'}, status=400)

    profile = _get_profile(request.user)
    if not profile:
        raise Http404('Customer profile not found.')

    bills = WaterBill.objects.filter(profile=profile)
    total_due = sum((bill.amount_due for bill in bills if not bill.is_paid), Decimal('0.00'))
    return JsonResponse({'total_due': str(total_due), 'bills': [_bill_payload(bill) for bill in bills]})


@require_GET
def bill_history_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    if request.user.is_staff:
        return JsonResponse({'error': 'Not available for admin users.'}, status=400)

    profile = _get_profile(request.user)
    if not profile:
        raise Http404('Customer profile not found.')

    bills = WaterBill.objects.filter(profile=profile)
    return JsonResponse({'history': [_bill_payload(bill) for bill in bills]})


@csrf_exempt
@require_POST
def pay_bill_api(request, bill_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    if request.user.is_staff:
        return JsonResponse({'error': 'Admin users cannot pay bills.'}, status=400)

    profile = _get_profile(request.user)
    if not profile:
        raise Http404('Customer profile not found.')

    bill = WaterBill.objects.filter(id=bill_id, profile=profile).first()
    if bill is None:
        return JsonResponse({'error': 'Bill not found.'}, status=404)
    if bill.is_paid:
        return JsonResponse({'error': 'Bill already paid.'}, status=400)
    if bill.payments.filter(status=Payment.PENDING).exists():
        return JsonResponse({'error': 'This bill has a pending payment.'}, status=400)

    data = _json_body(request)
    payment_method = data.get('payment_method')
    transaction_reference = data.get('transaction_reference')
    amount_raw = str(data.get('amount_paid', '')).strip()

    if payment_method not in [Payment.MOBILE_MONEY, Payment.BANK]:
        return JsonResponse({'error': 'Invalid payment method.'}, status=400)
    if not transaction_reference:
        return JsonResponse({'error': 'Transaction reference is required.'}, status=400)

    try:
        amount_paid = Decimal(amount_raw)
    except InvalidOperation:
        return JsonResponse({'error': 'Invalid payment amount.'}, status=400)

    if amount_paid != bill.amount_due:
        return JsonResponse({'error': 'Payment amount must match bill amount due.'}, status=400)

    payment = Payment.objects.create(
        bill=bill,
        amount_paid=amount_paid,
        payment_method=payment_method,
        transaction_reference=transaction_reference,
        status=Payment.PENDING,
    )
    return JsonResponse(
        {'message': 'Payment submitted. Awaiting admin approval.', 'payment': _payment_payload(payment)},
        status=201,
    )


@require_GET
def payment_history_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    if request.user.is_staff:
        return JsonResponse({'error': 'Use admin payment endpoint.'}, status=400)

    profile = _get_profile(request.user)
    if not profile:
        raise Http404('Customer profile not found.')

    payments = Payment.objects.filter(bill__profile=profile)
    return JsonResponse({'payments': [_payment_payload(payment) for payment in payments]})


@require_GET
def receipt_api(request, payment_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    payment_query = Payment.objects.filter(id=payment_id)
    if not request.user.is_staff:
        profile = _get_profile(request.user)
        if not profile:
            raise Http404('Customer profile not found.')
        payment_query = payment_query.filter(bill__profile=profile)

    payment = payment_query.first()
    if payment is None:
        return JsonResponse({'error': 'Receipt not found.'}, status=404)

    receipt = _payment_payload(payment)
    return JsonResponse({'receipt': receipt})


@require_GET
def receipt_download_api(request, payment_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    payment_query = Payment.objects.filter(id=payment_id)
    if not request.user.is_staff:
        profile = _get_profile(request.user)
        if not profile:
            raise Http404('Customer profile not found.')
        payment_query = payment_query.filter(bill__profile=profile)

    payment = payment_query.first()
    if payment is None:
        return JsonResponse({'error': 'Receipt not found.'}, status=404)

    lines = [
        'Water Bill Receipt',
        f'Customer: {payment.bill.profile.user.username}',
        f'Account Number: {payment.bill.profile.account_number}',
        f'Billing Period: {payment.bill.billing_period}',
        f'Amount Paid: {payment.amount_paid}',
        f'Payment Method: {payment.get_payment_method_display()}',
        f'Transaction Reference: {payment.transaction_reference}',
        f'Status: {payment.get_status_display()}',
        f'Paid At: {timezone.localtime(payment.paid_at):%Y-%m-%d %H:%M:%S}',
    ]
    response = HttpResponse('\n'.join(lines), content_type='text/plain')
    response['Content-Disposition'] = (
        f'attachment; filename="receipt_{payment.transaction_reference}.txt"'
    )
    return response


@require_GET
def admin_dashboard_api(request):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    users_count = User.objects.count()
    pending_payments = Payment.objects.filter(status=Payment.PENDING).count()
    unpaid_bills = WaterBill.objects.filter(is_paid=False).count()
    return JsonResponse(
        {
            'users_count': users_count,
            'pending_payments': pending_payments,
            'unpaid_bills': unpaid_bills,
        }
    )


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def admin_users_api(request):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    if request.method == 'GET':
        users = User.objects.all().order_by('username')
        return JsonResponse({'users': [_user_payload(user) for user in users]})

    data = _json_body(request)
    required = ['username', 'email', 'password', 'account_number', 'phone_number']
    missing = [field for field in required if not data.get(field)]
    if missing:
        return JsonResponse({'error': f'Missing fields: {", ".join(missing)}'}, status=400)

    if User.objects.filter(username=data['username']).exists():
        return JsonResponse({'error': 'Username already exists.'}, status=400)
    if User.objects.filter(email=data['email']).exists():
        return JsonResponse({'error': 'Email already exists.'}, status=400)
    if CustomerProfile.objects.filter(account_number=data['account_number']).exists():
        return JsonResponse({'error': 'Account number already exists.'}, status=400)

    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        is_staff=bool(data.get('is_staff', False)),
    )
    CustomerProfile.objects.create(
        user=user,
        account_number=data['account_number'],
        phone_number=data['phone_number'],
        address=data.get('address', ''),
    )
    return JsonResponse({'message': 'User created successfully.', 'user': _user_payload(user)}, status=201)


@csrf_exempt
@require_http_methods(['DELETE'])
def admin_user_delete_api(request, user_id):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    if request.user.id == user_id:
        return JsonResponse({'error': 'You cannot delete your own admin account.'}, status=400)

    user = User.objects.filter(id=user_id).first()
    if user is None:
        return JsonResponse({'error': 'User not found.'}, status=404)
    user.delete()
    return JsonResponse({'message': 'User deleted successfully.'})


@csrf_exempt
@require_POST
def admin_create_bill_api(request):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    data = _json_body(request)
    required = ['account_number', 'billing_period', 'previous_reading', 'current_reading', 'amount_due', 'due_date']
    missing = [field for field in required if data.get(field) in [None, '']]
    if missing:
        return JsonResponse({'error': f'Missing fields: {", ".join(missing)}'}, status=400)

    profile = CustomerProfile.objects.filter(account_number=data['account_number']).first()
    if profile is None:
        return JsonResponse({'error': 'Account number not found.'}, status=404)

    try:
        previous_reading = Decimal(str(data['previous_reading']))
        current_reading = Decimal(str(data['current_reading']))
        amount_due = Decimal(str(data['amount_due']))
    except InvalidOperation:
        return JsonResponse({'error': 'Reading and amount fields must be valid numbers.'}, status=400)

    bill = WaterBill.objects.create(
        profile=profile,
        billing_period=data['billing_period'],
        previous_reading=previous_reading,
        current_reading=current_reading,
        amount_due=amount_due,
        due_date=data['due_date'],
    )
    return JsonResponse({'message': 'Bill created successfully.', 'bill': _bill_payload(bill)}, status=201)


@require_GET
def admin_payments_api(request):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    status_filter = request.GET.get('status')
    payments = Payment.objects.all()
    if status_filter in [Payment.PENDING, Payment.SUCCESS, Payment.FAILED]:
        payments = payments.filter(status=status_filter)
    return JsonResponse({'payments': [_payment_payload(payment) for payment in payments]})


@csrf_exempt
@require_POST
def admin_payment_decision_api(request, payment_id):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    payment = Payment.objects.filter(id=payment_id).first()
    if payment is None:
        return JsonResponse({'error': 'Payment not found.'}, status=404)
    if payment.status != Payment.PENDING:
        return JsonResponse({'error': 'Only pending payments can be updated.'}, status=400)

    data = _json_body(request)
    action = data.get('action')
    if action not in ['approve', 'reject']:
        return JsonResponse({'error': 'Action must be approve or reject.'}, status=400)

    if action == 'approve':
        payment.status = Payment.SUCCESS
        payment.bill.is_paid = True
        payment.bill.save(update_fields=['is_paid'])
    else:
        payment.status = Payment.FAILED
    payment.save(update_fields=['status'])

    return JsonResponse({'message': f'Payment {action}d successfully.', 'payment': _payment_payload(payment)})


@require_GET
def admin_reports_api(request):
    admin_error = _require_admin(request)
    if admin_error:
        return admin_error

    period = request.GET.get('period', 'weekly')
    now = timezone.now()
    if period == 'weekly':
        start = now - timedelta(days=7)
    elif period == 'monthly':
        start = now - timedelta(days=30)
    elif period == 'yearly':
        start = now - timedelta(days=365)
    else:
        return JsonResponse({'error': 'Period must be weekly, monthly, or yearly.'}, status=400)

    paid_payments = Payment.objects.filter(status=Payment.SUCCESS, paid_at__gte=start)
    pending_payments = Payment.objects.filter(status=Payment.PENDING, paid_at__gte=start)
    rejected_payments = Payment.objects.filter(status=Payment.FAILED, paid_at__gte=start)

    total_revenue = paid_payments.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0.00')
    return JsonResponse(
        {
            'period': period,
            'from': start.isoformat(),
            'to': now.isoformat(),
            'approved_payments': paid_payments.count(),
            'pending_payments': pending_payments.count(),
            'rejected_payments': rejected_payments.count(),
            'total_revenue': str(total_revenue),
        }
    )
