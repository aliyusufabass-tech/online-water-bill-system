from django.contrib import admin

from .models import Bill, Payment, SystemProfile


@admin.register(SystemProfile)
class SystemProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'account_number', 'phone_number')
    search_fields = ('full_name', 'user__username', 'account_number', 'phone_number')


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('profile', 'billing_period', 'meter_reading', 'amount_due', 'due_date', 'status')
    list_filter = ('status', 'due_date')
    search_fields = ('profile__account_number', 'profile__user__username', 'billing_period')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'bill', 'amount', 'payment_method', 'status', 'paid_at', 'reviewed_by')
    list_filter = ('payment_method', 'status')
    search_fields = ('transaction_reference', 'bill__profile__account_number', 'bill__profile__user__username')
