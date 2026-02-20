from django.urls import path

from . import api_views, views

urlpatterns = [
    path('', views.spa_view, name='spa'),
    path('api/register/', api_views.register_api, name='api_register'),
    path('api/login/', api_views.login_api, name='api_login'),
    path('api/logout/', api_views.logout_api, name='api_logout'),
    path('api/me/', api_views.me_api, name='api_me'),
    path('api/dashboard/', api_views.dashboard_api, name='api_dashboard'),
    path('api/bills/history/', api_views.bill_history_api, name='api_bill_history'),
    path('api/bills/<int:bill_id>/pay/', api_views.pay_bill_api, name='api_pay_bill'),
    path('api/payments/', api_views.payment_history_api, name='api_payment_history'),
    path('api/receipts/<int:payment_id>/', api_views.receipt_api, name='api_receipt'),
    path(
        'api/receipts/<int:payment_id>/download/',
        api_views.receipt_download_api,
        name='api_receipt_download',
    ),
    path('api/admin/dashboard/', api_views.admin_dashboard_api, name='api_admin_dashboard'),
    path('api/admin/users/', api_views.admin_users_api, name='api_admin_users'),
    path('api/admin/users/<int:user_id>/', api_views.admin_user_delete_api, name='api_admin_user_delete'),
    path('api/admin/bills/', api_views.admin_create_bill_api, name='api_admin_create_bill'),
    path('api/admin/payments/', api_views.admin_payments_api, name='api_admin_payments'),
    path(
        'api/admin/payments/<int:payment_id>/decision/',
        api_views.admin_payment_decision_api,
        name='api_admin_payment_decision',
    ),
    path('api/admin/reports/', api_views.admin_reports_api, name='api_admin_reports'),
]
