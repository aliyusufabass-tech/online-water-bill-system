from django.db import models
from django.contrib.auth.models import User


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    account_number = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f'{self.user.username} ({self.account_number})'


class WaterBill(models.Model):
    profile = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='bills')
    billing_period = models.CharField(max_length=30)
    previous_reading = models.DecimalField(max_digits=10, decimal_places=2)
    current_reading = models.DecimalField(max_digits=10, decimal_places=2)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Bill {self.billing_period} - {self.profile.account_number}'


class Payment(models.Model):
    MOBILE_MONEY = 'mobile_money'
    BANK = 'bank'
    METHOD_CHOICES = [
        (MOBILE_MONEY, 'Mobile Money'),
        (BANK, 'Bank'),
    ]

    SUCCESS = 'success'
    PENDING = 'pending'
    FAILED = 'failed'
    STATUS_CHOICES = [
        (SUCCESS, 'Success'),
        (PENDING, 'Pending'),
        (FAILED, 'Failed'),
    ]

    bill = models.ForeignKey(WaterBill, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=SUCCESS)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.transaction_reference} - {self.bill.profile.account_number}'
