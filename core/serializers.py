from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Bill, Payment, SystemProfile


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'profile']

    def get_profile(self, obj):
        profile = getattr(obj, 'profile', None)
        if not profile:
            return None
        return SystemProfileSerializer(profile).data


class SystemProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemProfile
        fields = ['id', 'full_name', 'account_number', 'phone_number', 'address']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=120)
    account_number = serializers.CharField(max_length=20)
    phone_number = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=255, allow_blank=True, required=False)

    def validate(self, attrs):
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({'username': 'Username already exists.'})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Email already exists.'})
        if SystemProfile.objects.filter(account_number=attrs['account_number']).exists():
            raise serializers.ValidationError({'account_number': 'Account number already exists.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        SystemProfile.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            account_number=validated_data['account_number'],
            phone_number=validated_data['phone_number'],
            address=validated_data.get('address', ''),
        )
        return user


class AdminCreateUserSerializer(RegisterSerializer):
    is_staff = serializers.BooleanField(required=False, default=False)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_staff=validated_data.get('is_staff', False),
        )
        SystemProfile.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            account_number=validated_data['account_number'],
            phone_number=validated_data['phone_number'],
            address=validated_data.get('address', ''),
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs.get('username'), password=attrs.get('password'))
        if user is None:
            raise serializers.ValidationError({'error': 'Invalid username or password.'})
        attrs['user'] = user
        return attrs


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class BillSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='profile.account_number', read_only=True)
    full_name = serializers.CharField(source='profile.full_name', read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id',
            'account_number',
            'full_name',
            'billing_period',
            'meter_reading',
            'amount_due',
            'due_date',
            'status',
        ]


class AdminCreateBillSerializer(serializers.Serializer):
    account_number = serializers.CharField(max_length=20)
    billing_period = serializers.CharField(max_length=30)
    meter_reading = serializers.DecimalField(max_digits=10, decimal_places=2)
    amount_due = serializers.DecimalField(max_digits=10, decimal_places=2)
    due_date = serializers.DateField()

    def validate_account_number(self, value):
        if not SystemProfile.objects.filter(account_number=value).exists():
            raise serializers.ValidationError('Account number not found.')
        return value

    def create(self, validated_data):
        profile = SystemProfile.objects.get(account_number=validated_data['account_number'])
        return Bill.objects.create(
            profile=profile,
            billing_period=validated_data['billing_period'],
            meter_reading=validated_data['meter_reading'],
            amount_due=validated_data['amount_due'],
            due_date=validated_data['due_date'],
        )


class AdminUpdateBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = ['billing_period', 'meter_reading', 'amount_due', 'due_date']


class PaymentSerializer(serializers.ModelSerializer):
    bill = BillSerializer(read_only=True)
    reviewed_by = serializers.CharField(source='reviewed_by.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'bill',
            'amount',
            'payment_method',
            'transaction_reference',
            'status',
            'paid_at',
            'reviewed_by',
            'reviewed_at',
        ]


class PayBillSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    transaction_reference = serializers.CharField(max_length=50)


class PaymentDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
