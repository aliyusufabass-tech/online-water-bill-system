from django.contrib import admin

from .models import Bill, Payment, SystemProfile


@admin.register(SystemProfile)
class SystemProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'account_number', 'meter_number', 'phone_number')
    search_fields = ('full_name', 'user__username', 'account_number', 'meter_number', 'phone_number')
    readonly_fields = ('account_number', 'meter_number')
    fields = ('user', 'full_name', 'phone_number', 'address', 'account_number', 'meter_number')


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('profile', 'billing_period', 'meter_reading', 'amount_due', 'due_date', 'status')
    list_filter = ('status', 'due_date')
    search_fields = ('profile__account_number', 'profile__meter_number', 'profile__user__username', 'billing_period')
    readonly_fields = ('amount_due',)
    fields = ('profile', 'billing_period', 'meter_reading', 'amount_due', 'due_date', 'status')
    list_select_related = ('profile', 'profile__user')

    def get_readonly_fields(self, request, obj=None):
        # Amount is derived from meter reading: 100 per 1.00 unit.
        return (*super().get_readonly_fields(request, obj), 'amount_due')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'bill', 'amount', 'payment_method', 'status', 'paid_at', 'reviewed_by')
    list_filter = ('payment_method', 'status')
    search_fields = ('transaction_reference', 'bill__profile__account_number', 'bill__profile__user__username')
