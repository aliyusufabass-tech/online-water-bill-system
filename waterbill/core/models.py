from django.db import models
from django.contrib.auth.models import User


class SystemProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=120)
    account_number = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.full_name} ({self.account_number})'


class Bill(models.Model):
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
