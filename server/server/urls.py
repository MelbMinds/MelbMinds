"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import RegisterView, LoginView, GroupListCreateView, GroupRetrieveView, UserProfileView, JoinGroupView, GroupChatView, GroupMembersView, GroupSessionListCreateView, GroupSessionRetrieveUpdateDeleteView, stats_summary, group_notifications, trigger_cleanup, create_test_session, clear_group_notifications
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/groups/', GroupListCreateView.as_view(), name='groups'),
    path('api/groups/<int:pk>/', GroupRetrieveView.as_view(), name='group-detail'),
    path('api/groups/<int:group_id>/join/', JoinGroupView.as_view(), name='join-group'),
    path('api/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/groups/<int:group_id>/chat/', GroupChatView.as_view(), name='group-chat'),
    path('api/groups/<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
    path('api/groups/<int:group_id>/sessions/', GroupSessionListCreateView.as_view(), name='group-sessions'),
    path('api/sessions/<int:session_id>/', GroupSessionRetrieveUpdateDeleteView.as_view(), name='session-detail'),
    path('api/stats/summary/', stats_summary, name='stats-summary'),
    path('api/groups/<int:group_id>/notifications/', group_notifications, name='group-notifications'),
    path('api/groups/<int:group_id>/notifications/clear/', clear_group_notifications, name='clear-group-notifications'),
    path('api/cleanup/', trigger_cleanup, name='trigger-cleanup'),
    path('api/test-session/', create_test_session, name='create-test-session'),
]
