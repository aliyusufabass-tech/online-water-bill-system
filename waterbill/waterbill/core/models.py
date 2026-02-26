from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User


class SystemProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=120)
    account_number = models.CharField(max_length=20, unique=True, blank=True)
    meter_number = models.CharField(max_length=20, unique=True, blank=True)
    phone_number = models.CharField(max_length=20)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.account_number:
            self.account_number = self._generate_unique_account_number()
        if not self.meter_number:
            self.meter_number = self._generate_unique_meter_number()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_unique_account_number(cls):
        prefix = 'ACC'
        next_number = 1
        existing_accounts = cls.objects.filter(account_number__startswith=prefix).values_list('account_number', flat=True)
        for account_number in existing_accounts:
            suffix = account_number[len(prefix) :]
            if suffix.isdigit():
                next_number = max(next_number, int(suffix) + 1)

        candidate = f'{prefix}{next_number:03d}'
        while cls.objects.filter(account_number=candidate).exists():
            next_number += 1
            candidate = f'{prefix}{next_number:03d}'
        return candidate

    @classmethod
    def _generate_unique_meter_number(cls):
        prefix = 'MTR'
        next_number = 1
        existing_numbers = cls.objects.filter(meter_number__startswith=prefix).values_list('meter_number', flat=True)
        for meter_number in existing_numbers:
            suffix = meter_number[len(prefix) :]
            if suffix.isdigit():
                next_number = max(next_number, int(suffix) + 1)

        candidate = f'{prefix}{next_number:06d}'
        while cls.objects.filter(meter_number=candidate).exists():
            next_number += 1
            candidate = f'{prefix}{next_number:06d}'
        return candidate

    def __str__(self):
        return f'{self.full_name} | {self.user.username} | {self.account_number} | {self.meter_number}'


class Bill(models.Model):
    RATE_PER_UNIT = Decimal('100.00')

    STATUS_UNPAID = 'unpaid'
    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_UNPAID, 'Unpaid'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_PAID, 'Paid'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    profile = models.ForeignKey(SystemProfile, on_delete=models.CASCADE, related_name='bills')
    billing_period = models.CharField(max_length=30)
    meter_reading = models.DecimalField(max_digits=10, decimal_places=2)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNPAID)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        reading = self.meter_reading or Decimal('0.00')
        self.amount_due = reading * self.RATE_PER_UNIT
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.profile.account_number} - {self.billing_period}'


class Payment(models.Model):
    MOBILE_MONEY = 'mobile_money'
    BANK = 'bank'
    METHOD_CHOICES = [
        (MOBILE_MONEY, 'Mobile Money'),
        (BANK, 'Bank'),
    ]

    APPROVED = 'approved'
    PENDING = 'pending'
    REJECTED = 'rejected'
    STATUS_CHOICES = [
        (APPROVED, 'Approved'),
        (PENDING, 'Pending'),
        (REJECTED, 'Rejected'),
    ]

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    paid_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_payments')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.transaction_reference} - {self.bill.profile.account_number}'
