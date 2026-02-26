from django.urls import path

from . import views

urlpatterns = [
    # Canonical auth endpoints (frontend uses unified login and customer register)
    path('register/', views.RegisterAPIView.as_view(), name='api_register'),
    path('login/', views.LoginAPIView.as_view(), name='api_login'),
    # Backward-compatible aliases
    path('home/', views.MeAPIView.as_view(), name='api_home'),
    path('customer/register/', views.RegisterAPIView.as_view(), name='api_customer_register'),
    path('customer/login/', views.LoginAPIView.as_view(), name='api_customer_login'),
    path('admin/register/', views.AdminRegisterAPIView.as_view(), name='api_admin_register'),
    path('admin/login/', views.AdminLoginAPIView.as_view(), name='api_admin_login'),
    path('token/refresh/', views.TokenRefreshAPIView.as_view(), name='api_token_refresh'),
    path('logout/', views.LogoutAPIView.as_view(), name='api_logout'),
    path('me/', views.MeAPIView.as_view(), name='api_me'),
    path('profile/', views.UserSystemProfileAPIView.as_view(), name='api_profile'),
    path('bills/', views.UserBillsAPIView.as_view(), name='api_user_bills'),
    path('bills/<int:bill_id>/pay/', views.UserPayBillAPIView.as_view(), name='api_pay_bill'),
    path('payments/history/', views.UserPaymentHistoryAPIView.as_view(), name='api_payment_history'),
    path('receipts/', views.UserReceiptsAPIView.as_view(), name='api_receipts'),
    path(
        'receipts/<int:payment_id>/download/',
        views.UserReceiptDownloadAPIView.as_view(),
        name='api_receipt_download',
    ),
    path('admin/users/', views.AdminUsersAPIView.as_view(), name='api_admin_users'),
    path('admin/users/<int:user_id>/', views.AdminUserDeleteAPIView.as_view(), name='api_admin_user_delete'),
    path('admin/bills/', views.AdminBillsAPIView.as_view(), name='api_admin_bills'),
    path('admin/bills/<int:bill_id>/', views.AdminBillDetailAPIView.as_view(), name='api_admin_bill_detail'),
    path('admin/payments/', views.AdminPaymentsAPIView.as_view(), name='api_admin_payments'),
    path('admin/payments/<int:payment_id>/', views.AdminPaymentDeleteAPIView.as_view(), name='api_admin_payment_delete'),
    path(
        'admin/payments/<int:payment_id>/decision/',
        views.AdminPaymentDecisionAPIView.as_view(),
        name='api_admin_payment_decision',
    ),
    path('admin/reports/', views.AdminReportsAPIView.as_view(), name='api_admin_reports'),
]
