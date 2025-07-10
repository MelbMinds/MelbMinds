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
from .views import RegisterView, LoginView, GroupListCreateView, GroupRetrieveView, UserProfileView, JoinGroupView, GroupChatView, GroupMembersView
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
]
