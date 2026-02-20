from django.contrib import admin

from .models import CustomerProfile, Payment, WaterBill


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'account_number', 'phone_number')
    search_fields = ('user__username', 'account_number', 'phone_number')


@admin.register(WaterBill)
class WaterBillAdmin(admin.ModelAdmin):
    list_display = ('profile', 'billing_period', 'amount_due', 'due_date', 'is_paid')
    list_filter = ('is_paid', 'due_date')
    search_fields = ('profile__account_number', 'profile__user__username', 'billing_period')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'bill', 'amount_paid', 'payment_method', 'status', 'paid_at')
    list_filter = ('payment_method', 'status')
    search_fields = ('transaction_reference', 'bill__profile__account_number', 'bill__profile__user__username')
