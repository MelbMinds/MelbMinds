from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
from django.contrib.auth import authenticate
from django.db.models import Q
from .serializers import UserSerializer, GroupSerializer, GroupDetailSerializer, UserProfileSerializer, MessageSerializer, GroupSessionSerializer, GroupFileSerializer, GroupRatingSerializer, FlashcardFolderSerializer, FlashcardSerializer
from .models import Group, Message, GroupSession, CompletedSessionCounter, GroupNotification, GroupFile, GroupRating, PendingRegistration, FlashcardFolder, Flashcard
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Count
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
import os
from .perspective_moderation import perspective_moderator
from django.db import models
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Group, Message, GroupSession, GroupFile, CompletedSessionCounter, GroupNotification, GroupRating, EmailVerificationToken, PasswordResetToken
from .serializers import GroupSerializer, MessageSerializer, GroupSessionSerializer, GroupFileSerializer, GroupRatingSerializer
import json
from datetime import datetime, timedelta
import uuid
import logging
from rest_framework.permissions import IsAdminUser
from uuid import UUID
logger = logging.getLogger(__name__)

User = get_user_model()

def cleanup_past_sessions():
    """
    Utility function to clean up past sessions, create notifications, and update counter.
    This should be called periodically or when sessions are accessed.
    """
    from django.utils import timezone
    import pytz
    from datetime import datetime, timedelta
    
    # Get current time in Australia/Sydney timezone
    australia_tz = pytz.timezone('Australia/Sydney')
    now_local = timezone.now().astimezone(australia_tz)
    current_date = now_local.date()
    current_time = now_local.time().replace(microsecond=0)
    current_seconds = current_time.hour * 3600 + current_time.minute * 60 + current_time.second
    
    # Get ALL sessions and check each one individually
    all_sessions = GroupSession.objects.all()
    past_sessions = []
    
    for session in all_sessions:
        session_end_time = session.end_time.replace(microsecond=0)
        session_seconds = session_end_time.hour * 3600 + session_end_time.minute * 60 + session_end_time.second
        # Check if session is in the past
        if session.date < current_date:
            past_sessions.append(session)
        elif session.date == current_date and session_seconds < current_seconds:
            past_sessions.append(session)
    
    deleted_count = len(past_sessions)
    
    # Create notifications for each past session before deleting
    for session in past_sessions:
        # Calculate session duration in hours
        start_dt = datetime.combine(session.date, session.start_time)
        end_dt = datetime.combine(session.date, session.end_time)
        duration_hours = max(0, (end_dt - start_dt).total_seconds() / 3600)
        # Add duration to group's target_hours (if you want to track progress, otherwise just recalculate dynamically)
        group = session.group
        if hasattr(group, 'target_hours') and group.target_hours is not None:
            group.target_hours = float(group.target_hours) + duration_hours
            group.save(update_fields=["target_hours"])
        GroupNotification.objects.create(
            group=group,
            message=f"Session at {session.location} on {session.date} from {session.start_time} to {session.end_time} just ended. {duration_hours:.2f} hours added to group progress."
        )
        # Delete the session
        session.delete()
    
    # Update the completed sessions counter
    if deleted_count > 0:
        CompletedSessionCounter.increment(deleted_count)
    
    return deleted_count

def find_similar_groups(group, limit=3):
    """
    Find similar groups based on multiple factors:
    - Subject code (highest weight)
    - Tags overlap
    - Group personality overlap
    - Year level
    - Meeting format
    """
    from django.db.models import Q, Count
    from difflib import SequenceMatcher
    
    similar_groups = []
    
    # Get all other groups (excluding the current one)
    all_groups = Group.objects.exclude(id=group.id)
    
    for other_group in all_groups:
        score = 0
        factors = {}
        
        # 1. Subject code match (highest weight: 40 points)
        if group.subject_code == other_group.subject_code:
            score += 40
            factors['subject_code'] = True
        
        # 2. Tags overlap (up to 25 points)
        if group.tags and other_group.tags:
            group_tags = set([tag.strip().lower() for tag in group.tags.split(',')])
            other_tags = set([tag.strip().lower() for tag in other_group.tags.split(',')])
            
            if group_tags and other_tags:
                overlap = len(group_tags.intersection(other_tags))
                total_unique = len(group_tags.union(other_tags))
                if total_unique > 0:
                    tag_similarity = overlap / total_unique
                    score += tag_similarity * 25
                    factors['tags_overlap'] = tag_similarity
        
        # 3. Group personality overlap (up to 20 points)
        if group.group_personality and other_group.group_personality:
            group_personality = set([p.strip().lower() for p in group.group_personality.split(',')])
            other_personality = set([p.strip().lower() for p in other_group.group_personality.split(',')])
            
            if group_personality and other_personality:
                overlap = len(group_personality.intersection(other_personality))
                total_unique = len(group_personality.union(other_personality))
                if total_unique > 0:
                    personality_similarity = overlap / total_unique
                    score += personality_similarity * 20
                    factors['personality_overlap'] = personality_similarity
        
        # 4. Year level match (10 points)
        if group.year_level == other_group.year_level:
            score += 10
            factors['year_level'] = True
        
        # 5. Meeting format match (5 points)
        if group.meeting_format == other_group.meeting_format:
            score += 5
            factors['meeting_format'] = True
        
        # Only include groups with some similarity (score > 10)
        if score > 10:
            similar_groups.append({
                'group': other_group,
                'score': score,
                'factors': factors
            })
    
    # Sort by score and return top results
    similar_groups.sort(key=lambda x: x['score'], reverse=True)
    return similar_groups[:limit]

def validate_unimelb_email(email):
    """Validate that email is a University of Melbourne student email"""
    return email.endswith('@student.unimelb.edu.au')

def is_content_clean(field_name, value):
    """Run moderation only if value is not empty and longer than 2 chars. Only block if high confidence."""
    if not value or len(value.strip()) < 3:
        return {'valid': True, 'message': ''}
    result = perspective_moderator.validate_user_input(field_name, value)
    # Only block if not valid and the message contains 'likely inappropriate' or 'high confidence'
    if not result['valid'] and ('likely' in result['message'].lower() or 'high confidence' in result['message'].lower() or 'severe' in result['message'].lower()):
        return result
    return {'valid': True, 'message': ''}

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user with email verification (user is only created after verification)"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        # Validate email domain
        if not validate_unimelb_email(email):
            return Response({'error': 'Only University of Melbourne student emails (@student.unimelb.edu.au) are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        # Block if user or pending registration exists
        if User.objects.filter(email__iexact=email).exists() or PendingRegistration.objects.filter(email__iexact=email).exists():
            return Response({'error': 'A user with this email already exists or is pending verification.'}, status=status.HTTP_400_BAD_REQUEST)
        # Generate a unique token
        token = str(uuid.uuid4())
        # Store registration data in PendingRegistration
        PendingRegistration.objects.create(
            email=email,
            password=data.get('password'),
            name=data.get('name'),
            major=data.get('major'),
            year_level=data.get('year_level'),
            preferred_study_format=data.get('preferred_study_format'),
            languages_spoken=data.get('languages_spoken'),
            bio=data.get('bio', ''),
            token=token
        )
        # Send verification email
        verification_url = f"http://localhost:3000/verify-email?token={token}"
        email_subject = "🎓 Welcome to MelbMinds - Verify Your Account"
        email_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Welcome to MelbMinds</title>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f4f6fb; color: #222; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(30,58,138,0.08); overflow: hidden; }}
                .header {{ background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%); color: #fff; padding: 32px 0; text-align: center; }}
                .header img {{ width: 60px; margin-bottom: 12px; }}
                .content {{ padding: 32px; }}
                .cta-btn {{ display: inline-block; background: #3b82f6; color: #fff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; margin: 24px 0; }}
                .footer {{ background: #f1f5f9; color: #666; text-align: center; padding: 18px 0; font-size: 14px; }}
                .warning {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; color: #b45309; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <img src='https://raw.githubusercontent.com/Serzh-byte/MelbMinds/main/client/public/placeholder-logo.png' alt='MelbMinds Logo' />
                    <h1>Welcome to MelbMinds!</h1>
                    <p>Your University of Melbourne Study Group Platform</p>
                </div>
                <div class='content'>
                    <h2>Hello!</h2>
                    <p>Thank you for joining <b>MelbMinds</b>! We're excited to have you as part of our community of University of Melbourne students.</p>
                    <p>To complete your registration and start connecting with fellow students, please verify your email address by clicking the button below:</p>
                    <div style='text-align: center;'>
                        <a href='{verification_url}' class='cta-btn'>Verify My Email Address</a>
                    </div>
                    <div class='warning'>
                        <strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #3b82f6;'>{verification_url}</p>
                    <h3>What's next?</h3>
                    <ul>
                        <li>✅ Verify your email (you're here!)</li>
                        <li>🔍 Discover study groups in your subjects</li>
                        <li>👥 Join groups that match your study preferences</li>
                        <li>📚 Connect with fellow University of Melbourne students</li>
                    </ul>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>Best regards,<br><b>The MelbMinds Team</b></p>
                    <p>University of Melbourne Student Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        try:
            send_mail(
                subject=email_subject,
                message="Please use an HTML compatible email client to view this message.",
                from_email="MelbMinds <melbminds@gmail.com>",
                recipient_list=[email],
                fail_silently=False,
                html_message=email_message
            )
        except Exception as e:
            PendingRegistration.objects.filter(email=email).delete()
            return Response({'error': 'Failed to send verification email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'Registration started! Please check your email to verify your account.'}, status=status.HTTP_201_CREATED)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email with token and create the user account"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        if not token:
            return Response({'error': 'Verification token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pending = PendingRegistration.objects.get(token=token)
        except PendingRegistration.DoesNotExist:
            return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)
        # Check if token is expired (24 hours)
        if pending.created_at < timezone.now() - timedelta(hours=24):
            pending.delete()
            return Response({'error': 'Verification token has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        # Check if user already exists (shouldn't happen, but just in case)
        if User.objects.filter(email__iexact=pending.email).exists():
            pending.delete()
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        # Create the user
        user = User.objects.create_user(
            email=pending.email,
            password=pending.password,
            name=pending.name,
            major=pending.major,
            year_level=pending.year_level,
            preferred_study_format=pending.preferred_study_format,
            languages_spoken=pending.languages_spoken,
            bio=pending.bio,
            is_active=True,
            is_email_verified=True,
            email_verified_at=timezone.now()
        )
        pending.delete()
        return Response({'message': 'Email verified successfully! Your account has been created. You can now log in.'}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """Resend verification email"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({
                'error': 'No user found with this email address.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_email_verified:
            return Response({
                'error': 'Email is already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete any existing unused tokens for this user
        EmailVerificationToken.objects.filter(user=user, is_used=False).delete()
        
        # Create new verification token
        verification_token = EmailVerificationToken.objects.create(user=user)
        
        # Send verification email
        verification_url = f"http://localhost:3000/verify-email?token={verification_token.token}"
        
        email_subject = "🎓 Welcome to MelbMinds - Verify Your Account"
        email_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Welcome to MelbMinds</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                .warning {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎓 Welcome to MelbMinds!</h1>
                    <p>Your University of Melbourne Study Group Platform</p>
                </div>
                <div class='content'>
                    <h2>Hello {user.name}!</h2>
                    <p>Thank you for joining MelbMinds! We're excited to have you as part of our community of University of Melbourne students.</p>
                    <p>To complete your registration and start connecting with fellow students, please verify your email address by clicking the button below:</p>
                    <div style='text-align: center;'>
                        <a href='{verification_url}' class='button'>Verify My Email Address</a>
                    </div>
                    <div class='warning'>
                        <strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #3b82f6;'>{verification_url}</p>
                    <h3>What's next?</h3>
                    <ul>
                        <li>✅ Verify your email (you're here!)</li>
                        <li>🔍 Discover study groups in your subjects</li>
                        <li>👥 Join groups that match your study preferences</li>
                        <li>📚 Connect with fellow University of Melbourne students</li>
                    </ul>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>Best regards,<br>The MelbMinds Team</p>
                    <p>University of Melbourne Student Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            send_mail(
                subject=email_subject,
                message=email_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
                html_message=email_message
            )
        except Exception as e:
            return Response({
                'error': 'Failed to send verification email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'Verification email sent successfully!'
        }, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(APIView):
    def post(self, request):
        # Content moderation for user registration
        name_validation = perspective_moderator.validate_user_input('name', request.data.get('name', ''))
        bio_validation = perspective_moderator.validate_user_input('bio', request.data.get('bio', ''))
        
        if not name_validation['valid']:
            return Response({
                'error': name_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not bio_validation['valid']:
            return Response({
                'error': bio_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use original values (Perspective API doesn't sanitize, it blocks)
        data = request.data.copy()
        
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            data = UserSerializer(user).data
            return Response(data, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        # For JWT tokens, logout is typically handled client-side by removing the token
        # This endpoint can be used to invalidate tokens if needed
        return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def get_queryset(self):
        queryset = Group.objects.all()
        
        # Get filter parameters
        search = self.request.query_params.get('search', '')
        subject = self.request.query_params.get('subject', '')
        year_level = self.request.query_params.get('year_level', '')
        meeting_format = self.request.query_params.get('meeting_format', '')
        primary_language = self.request.query_params.get('primary_language', '')
        personality_tags = self.request.query_params.get('personality_tags', '')
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(group_name__icontains=search) |
                Q(subject_code__icontains=search) |
                Q(course_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        if subject and subject != 'all':
            queryset = queryset.filter(subject_code=subject)
        
        if year_level and year_level != 'all':
            queryset = queryset.filter(year_level=year_level)
        
        if meeting_format and meeting_format != 'all':
            queryset = queryset.filter(meeting_format=meeting_format)
        
        if primary_language and primary_language != 'all':
            queryset = queryset.filter(primary_language=primary_language)
        
        if personality_tags:
            # Split personality tags and filter by any matching tag
            tags = [tag.strip() for tag in personality_tags.split(',') if tag.strip()]
            if tags:
                personality_filter = Q()
                for tag in tags:
                    personality_filter |= Q(group_personality__icontains=tag)
                queryset = queryset.filter(personality_filter)
        
        # Sorting
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'members':
            queryset = queryset.annotate(num_members=Count('members')).order_by('-num_members', '-created_at')
        elif sort == 'rating':
            # Annotate with average rating, fallback to 0 if no ratings
            queryset = queryset.annotate(avg_rating=models.Avg('ratings__rating')).order_by(models.F('avg_rating').desc(nulls_last=True), '-created_at')
        elif sort == 'subject':
            queryset = queryset.order_by('subject_code', '-created_at')
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        # Content moderation for group creation
        group_name_check = is_content_clean('group name', serializer.validated_data.get('group_name', ''))
        description_check = is_content_clean('description', serializer.validated_data.get('description', ''))
        tags_check = is_content_clean('tags', serializer.validated_data.get('tags', ''))
        if not group_name_check['valid']:
            raise serializers.ValidationError({'error': group_name_check['message']})
        if not description_check['valid']:
            raise serializers.ValidationError({'error': description_check['message']})
        if not tags_check['valid']:
            raise serializers.ValidationError({'error': tags_check['message']})
        
        serializer.save(creator=self.request.user)

class GroupRetrieveView(generics.RetrieveAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get(self, request, *args, **kwargs):
        # Clean up past sessions when viewing a group
        cleanup_past_sessions()
        
        # Get the group
        group = self.get_object()
        
        # Find similar groups
        similar_groups_data = find_similar_groups(group, limit=3)
        
        # Serialize the main group
        serializer = self.get_serializer(group)
        data = serializer.data
        
        # Add similar groups to the response
        similar_groups_serialized = []
        for similar_data in similar_groups_data:
            similar_group = similar_data['group']
            similar_serializer = GroupSerializer(similar_group)
            similar_groups_serialized.append({
                'group': similar_serializer.data,
                'similarity_score': similar_data['score'],
                'matching_factors': similar_data['factors']
            })
        
        data['similar_groups'] = similar_groups_serialized

        # Add progress bar data
        from datetime import datetime, timedelta
        sessions = group.sessions.all()
        total_seconds = 0
        for session in sessions:
            # Calculate duration in seconds
            start = datetime.combine(session.date, session.start_time)
            end = datetime.combine(session.date, session.end_time)
            duration = (end - start).total_seconds()
            if duration > 0:
                total_seconds += duration
        total_hours = round(total_seconds / 3600, 2)
        target_hours = group.target_hours or 1
        progress_percentage = min(100, round((total_hours / target_hours) * 100, 2)) if target_hours else 0
        data['total_study_hours'] = total_hours
        data['progress_percentage'] = progress_percentage
        data['target_hours'] = target_hours
        return Response(data)

class JoinGroupView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.creator == request.user:
                return Response({'detail': 'You cannot join a group you created'}, status=status.HTTP_400_BAD_REQUEST)
            if request.user in group.members.all():
                return Response({'detail': 'You are already a member of this group'}, status=status.HTTP_400_BAD_REQUEST)
            group.members.add(request.user)
            return Response({'detail': 'Successfully joined the group'}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from .serializers import GroupSerializer
        joined_groups = user.joined_groups.all()
        groups_data = GroupSerializer(joined_groups, many=True).data
        serializer = UserProfileSerializer(user)
        data = serializer.data
        data['joined_groups'] = groups_data
        return Response(data)
    
    def put(self, request):
        user = request.user
        data = request.data.copy()
        
        # Content moderation for profile updates
        name_check = is_content_clean('name', data.get('name', ''))
        bio_check = is_content_clean('bio', data.get('bio', ''))
        if not name_check['valid']:
            return Response({'error': name_check['message']}, status=status.HTTP_400_BAD_REQUEST)
        if not bio_check['valid']:
            return Response({'error': bio_check['message']}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert languages array back to string for storage
        if 'languages' in data and isinstance(data['languages'], list):
            data['languages_spoken'] = ', '.join(data['languages'])
            del data['languages']
        
        # Map frontend field names to model field names
        if 'year' in data:
            data['year_level'] = data['year']
            del data['year']
        
        if 'studyFormat' in data:
            data['preferred_study_format'] = data['studyFormat']
            del data['studyFormat']
        
        serializer = UserProfileSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GroupChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
            return Response({'detail': 'Not a group member'}, status=403)
        messages = Message.objects.filter(group=group).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
            return Response({'detail': 'Not a group member'}, status=403)
        
        # Content moderation for chat messages
        message_text = request.data.get('text', '')
        message_check = is_content_clean('message', message_text)
        
        if not message_check['valid']:
            return Response({'error': message_check['message']}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use original message text (Perspective API blocks instead of sanitizing)
        data = request.data.copy()
        
        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user, group=group)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class GroupMembersView(APIView):
    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        members = group.members.all()
        
        # Include the creator in the members list
        all_members = list(members)
        if group.creator not in all_members:
            all_members.append(group.creator)
        
        data = [{'id': m.id, 'name': m.name, 'email': m.email, 'is_creator': m == group.creator} for m in all_members]
        return Response(data) 

class IsGroupCreatorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator == request.user

class GroupSessionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
            return Response({'detail': 'Not a group member'}, status=403)
        
        # Always clean up past sessions on every request
        deleted_count = cleanup_past_sessions()
        
        # Return only upcoming sessions for this group
        now = timezone.now()
        sessions = GroupSession.objects.filter(
            Q(date__gt=now.date()) |
            Q(date=now.date(), end_time__gte=now.time()),
            group=group
        ).order_by('date', 'start_time')
        serializer = GroupSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if group.creator != request.user:
            return Response({'detail': 'Only the group creator can create sessions'}, status=403)
        
        # Content moderation for session description
        description_validation = perspective_moderator.validate_user_input('session description', request.data.get('description', ''))
        
        if not description_validation['valid']:
            return Response({
                'error': description_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = GroupSessionSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save(group=group, creator=request.user)
            GroupNotification.objects.create(
                group=group,
                message=f"New session created at {session.location} on {session.date} from {session.start_time} to {session.end_time}."
            )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class GroupSessionRetrieveUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsGroupCreatorOrReadOnly]

    def get_object(self, session_id):
        return GroupSession.objects.get(id=session_id)

    def get(self, request, session_id):
        session = self.get_object(session_id)
        group = session.group
        if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
            return Response({'detail': 'Not a group member'}, status=403)
        serializer = GroupSessionSerializer(session)
        return Response(serializer.data)

    def put(self, request, session_id):
        session = self.get_object(session_id)
        if session.creator != request.user:
            return Response({'detail': 'Only the group creator can edit sessions'}, status=403)
        
        # Content moderation for session description
        description_validation = perspective_moderator.validate_user_input('session description', request.data.get('description', ''))
        
        if not description_validation['valid']:
            return Response({
                'error': description_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = GroupSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, session_id):
        session = self.get_object(session_id)
        if session.creator != request.user:
            return Response({'detail': 'Only the group creator can delete sessions'}, status=403)
        session.delete()
        return Response(status=204) 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_notifications(request, group_id):
    group = Group.objects.get(id=group_id)
    if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
        return Response({'detail': 'Not a group member'}, status=403)
    
    # Clean up past sessions before fetching notifications
    cleanup_past_sessions()
    
    notifications = GroupNotification.objects.filter(group=group).order_by('-created_at')[:50]
    data = [
        {
            'id': n.id,
            'message': n.message,
            'created_at': n.created_at
        } for n in notifications
    ]
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_group_notifications(request, group_id):
    group = Group.objects.get(id=group_id)
    if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
        return Response({'detail': 'Not a group member'}, status=403)
    GroupNotification.objects.filter(group=group).delete()
    return Response({'detail': 'All notifications cleared.'}, status=204)

@api_view(['GET'])
@permission_classes([AllowAny])
def stats_summary(request):
    # Clean up past sessions before calculating stats
    cleanup_past_sessions()
    
    now = timezone.now()
    from .models import User, Group, GroupSession
    active_students = User.objects.count()
    active_sessions = GroupSession.objects.filter(
        Q(date__gt=now.date()) |
        Q(date=now.date(), end_time__gte=now.time())
    ).count()
    subject_areas = Group.objects.values('subject_code').distinct().count()
    new_groups_today = Group.objects.filter(created_at__date=now.date()).count()
    unimelb_students = User.objects.filter(email__iendswith='@unimelb.edu.au').count()
    groups_created = Group.objects.count()
    # Use CompletedSessionCounter for sessions_completed
    try:
        sessions_completed = CompletedSessionCounter.objects.get(pk=1).count
    except CompletedSessionCounter.DoesNotExist:
        sessions_completed = 0
    from datetime import timedelta
    new_users_24hrs = User.objects.filter(date_joined__gte=now - timedelta(days=1)).count()
    return Response({
        "active_students": active_students,
        "active_sessions": active_sessions,
        "subject_areas": subject_areas,
        "new_groups_today": new_groups_today,
        "unimelb_students": unimelb_students,
        "groups_created": groups_created,
        "sessions_completed": sessions_completed,
        "grade_improvement": 12,
        "new_users_24hrs": new_users_24hrs,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_cleanup(request):
    """Manual trigger for session cleanup (for testing)"""
    deleted_count = cleanup_past_sessions()
    return Response({
        "message": f"Cleanup completed. {deleted_count} session(s) deleted.",
        "deleted_count": deleted_count
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_test_session(request):
    """Create a test session in the past (for testing cleanup)"""
    from datetime import datetime, timedelta, time as dtime
    from .models import User, Group
    
    # Get or create test user and group
    user, _ = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'name': 'Test User',
            'major': 'Computer Science',
            'year_level': '2nd Year',
            'preferred_study_format': 'In-person',
            'languages_spoken': 'English'
        }
    )
    
    group, _ = Group.objects.get_or_create(
        group_name='Test Group',
        defaults={
            'subject_code': 'TEST101',
            'course_name': 'Test Course',
            'description': 'A test group',
            'year_level': '2nd Year',
            'meeting_format': 'In-person',
            'primary_language': 'English',
            'meeting_schedule': 'Weekly',
            'location': 'Test Location',
            'tags': 'Python, Programming, Algorithms, Data Structures',
            'group_personality': 'Focused, Collaborative, Technical'
        }
    )
    
    # Create a session from 2 hours ago (today but past time)
    now = datetime.now()
    past_start = (now - timedelta(hours=2)).replace(second=0, microsecond=0)
    past_end = (now - timedelta(hours=1)).replace(second=0, microsecond=0)
    
    session = GroupSession.objects.create(
        group=group,
        creator=user,
        date=past_start.date(),
        start_time=past_start.time(),
        end_time=past_end.time(),
        location='Past Test Location',
        description='This session should be deleted by cleanup'
    )
    
    return Response({
        "message": f"Created test session: {session}",
        "session_id": session.id,
        "session_date": session.date,
        "session_start_time": session.start_time,
        "session_end_time": session.end_time
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def test_moderation(request):
    """Test endpoint for content moderation using Perspective API"""
    text = request.data.get('text', '')
    validation = perspective_moderator.validate_user_input('test field', text)
    
    return Response({
        'text': text,
        'is_toxic': not validation['valid'],
        'message': validation['message'],
        'analysis': validation.get('analysis', {}),
        'highest_attribute': validation.get('highest_attribute'),
        'score': validation.get('score')
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_sample_groups(request):
    """Create sample groups for testing similar groups functionality"""
    from .models import User, Group
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'name': 'Test User',
            'major': 'Computer Science',
            'year_level': '2nd Year',
            'preferred_study_format': 'In-person',
            'languages_spoken': 'English'
        }
    )
    
    # Create sample groups with different similarities
    sample_groups = [
        {
            'group_name': 'Advanced Python Programming',
            'subject_code': 'COMP20008',
            'course_name': 'Advanced Programming Techniques',
            'description': 'Advanced Python programming concepts and techniques',
            'year_level': '2nd Year',
            'meeting_format': 'In-person',
            'primary_language': 'English',
            'meeting_schedule': 'Weekly',
            'location': 'Engineering Building',
            'tags': 'Python, Programming, Algorithms, Data Structures',
            'group_personality': 'Focused, Collaborative, Technical'
        },
        {
            'group_name': 'Data Structures & Algorithms',
            'subject_code': 'COMP20008',
            'course_name': 'Data Structures and Algorithms',
            'description': 'Study of fundamental data structures and algorithms',
            'year_level': '2nd Year',
            'meeting_format': 'Virtual',
            'primary_language': 'English',
            'meeting_schedule': 'Bi-weekly',
            'location': 'Online',
            'tags': 'Algorithms, Data Structures, Programming, Python',
            'group_personality': 'Technical, Analytical, Problem-solving'
        },
        {
            'group_name': 'Software Engineering Principles',
            'subject_code': 'SWEN20003',
            'course_name': 'Software Engineering',
            'description': 'Software development methodologies and practices',
            'year_level': '2nd Year',
            'meeting_format': 'Hybrid',
            'primary_language': 'English',
            'meeting_schedule': 'Weekly',
            'location': 'Engineering Building',
            'tags': 'Software Engineering, Development, Teamwork, Design',
            'group_personality': 'Collaborative, Creative, Professional'
        },
        {
            'group_name': 'Machine Learning Fundamentals',
            'subject_code': 'COMP30024',
            'course_name': 'Machine Learning',
            'description': 'Introduction to machine learning concepts and algorithms',
            'year_level': '3rd Year',
            'meeting_format': 'In-person',
            'primary_language': 'English',
            'meeting_schedule': 'Weekly',
            'location': 'Engineering Building',
            'tags': 'Machine Learning, AI, Python, Mathematics',
            'group_personality': 'Technical, Research-oriented, Innovative'
        }
    ]
    
    created_groups = []
    for group_data in sample_groups:
        group, created = Group.objects.get_or_create(
            group_name=group_data['group_name'],
            defaults={
                **group_data,
                'creator': user
            }
        )
        if created:
            created_groups.append(group.group_name)
    
    return Response({
        'message': f'Created {len(created_groups)} new sample groups',
        'created_groups': created_groups,
        'total_groups': Group.objects.count()
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_sample_ratings(request):
    """Create sample ratings for testing the rating system"""
    from .models import User, Group, GroupRating
    import random
    
    # Get or create test users
    users = []
    for i in range(5):
        user, _ = User.objects.get_or_create(
            email=f'test{i}@example.com',
            defaults={
                'name': f'Test User {i}',
                'major': 'Computer Science',
                'year_level': '2nd Year',
                'preferred_study_format': 'In-person',
                'languages_spoken': 'English'
            }
        )
        users.append(user)
    
    # Get all groups
    groups = Group.objects.all()
    
    # Create random ratings
    ratings_created = 0
    for group in groups:
        for user in users:
            # 70% chance to create a rating
            if random.random() < 0.7:
                rating_value = random.choice([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0])
                rating, created = GroupRating.objects.get_or_create(
                    user=user,
                    group=group,
                    defaults={'rating': rating_value}
                )
                if created:
                    ratings_created += 1
    
    return Response({
        'message': f'Created {ratings_created} sample ratings',
        'total_ratings': GroupRating.objects.count(),
        'total_groups': groups.count(),
        'total_users': users.__len__()
    })

class GroupFileListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, group_id):
        """Get all files for a group"""
        try:
            group = Group.objects.get(id=group_id)
            # Check if user is a member or creator
            if not (request.user in group.members.all() or request.user == group.creator):
                return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            files = GroupFile.objects.filter(group=group).order_by('-uploaded_at')
            serializer = GroupFileSerializer(files, many=True)
            return Response(serializer.data)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, group_id):
        """Upload a file to a group"""
        try:
            group = Group.objects.get(id=group_id)
            # Check if user is a member or creator
            if not (request.user in group.members.all() or request.user == group.creator):
                return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            if 'file' not in request.FILES:
                return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            # Moderation for file name
            filename_validation = perspective_moderator.validate_user_input('file name', uploaded_file.name)
            if not filename_validation['valid']:
                return Response({'error': filename_validation['message']}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the file record
            file_obj = GroupFile.objects.create(
                group=group,
                uploaded_by=request.user,
                file=uploaded_file,
                original_filename=uploaded_file.name,
                file_size=uploaded_file.size
            )
            
            serializer = GroupFileSerializer(file_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GroupFileDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, file_id):
        """Download a file"""
        try:
            file_obj = GroupFile.objects.get(id=file_id)
            print(f"DEBUG: File object found: {file_obj.original_filename}")
            print(f"DEBUG: File storage: {file_obj.file}")
            print(f"DEBUG: File URL: {file_obj.file.url if hasattr(file_obj.file, 'url') else 'No URL'}")
            
            # Check if user is a member or creator of the group
            if not (request.user in file_obj.group.members.all() or request.user == file_obj.group.creator):
                return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            if not file_obj.file:
                return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # For S3 files, stream the file directly
            if hasattr(file_obj.file, 'url'):
                try:
                    import boto3
                    from django.conf import settings
                    
                    # Create S3 client
                    s3_client = boto3.client(
                        's3',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_S3_REGION_NAME
                    )
                    
                    # Get the file path from the storage
                    file_path = file_obj.file.name
                    print(f"DEBUG: File path: {file_path}")
                    
                    # Get the file object from S3
                    response = s3_client.get_object(
                        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                        Key=file_path
                    )
                    
                    # Stream the file content
                    file_content = response['Body'].read()
                    
                    # Create HTTP response with the file content
                    http_response = HttpResponse(file_content, content_type='application/octet-stream')
                    http_response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'
                    
                    print(f"DEBUG: Streaming file directly from S3")
                    return http_response
                    
                except Exception as e:
                    print(f"DEBUG: Error streaming from S3: {e}")
                    # Fallback to URL method
                    file_url = file_obj.file.url
                    if file_url.startswith('/'):
                        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'melbmindsbucket')
                        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-southeast-2')
                        file_path = file_url.lstrip('/')
                        file_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_path}"
                    
                    return Response({
                        'download_url': file_url,
                        'filename': file_obj.original_filename
                    })
            else:
                # For local files, try to serve directly
                try:
                    with file_obj.file.open('rb') as f:
                        file_content = f.read()
                    
                    response = HttpResponse(file_content, content_type='application/octet-stream')
                    response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'
                    return response
                except Exception as e:
                    return Response({'detail': 'File not accessible'}, status=status.HTTP_404_NOT_FOUND)
            
        except GroupFile.DoesNotExist:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

class GroupFileDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, file_id):
        """Delete a file (only by uploader or group creator)"""
        try:
            file_obj = GroupFile.objects.get(id=file_id)
            # Check if user is the uploader or group creator
            if not (request.user == file_obj.uploaded_by or request.user == file_obj.group.creator):
                return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Delete the file from storage (works with both local and S3 storage)
            if file_obj.file:
                file_obj.file.delete(save=False)
            
            file_obj.delete()
            return Response({'detail': 'File deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
            
        except GroupFile.DoesNotExist:
            return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND) 

class GroupRatingView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, group_id):
        """Get rating for a group by the current user"""
        try:
            group = Group.objects.get(id=group_id)
            try:
                rating = GroupRating.objects.get(user=request.user, group=group)
                serializer = GroupRatingSerializer(rating)
                return Response(serializer.data)
            except GroupRating.DoesNotExist:
                return Response({'rating': None}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, group_id):
        """Create or update a rating for a group"""
        try:
            group = Group.objects.get(id=group_id)
            rating_value = request.data.get('rating')
            
            if not rating_value:
                return Response({'detail': 'Rating value is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is a member of the group
            if not (request.user in group.members.all() or request.user == group.creator):
                return Response({'detail': 'You must be a member of this group to rate it'}, status=status.HTTP_403_FORBIDDEN)
            
            # Prevent group creator from rating their own group
            if request.user == group.creator:
                return Response({'detail': 'Group creators cannot rate their own group'}, status=status.HTTP_403_FORBIDDEN)
            
            # Validate rating value
            try:
                rating_float = float(rating_value)
                if rating_float < 1.0 or rating_float > 5.0 or rating_float % 0.5 != 0:
                    return Response({'detail': 'Rating must be between 1.0 and 5.0 in 0.5 increments'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'detail': 'Invalid rating value'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or update rating
            rating, created = GroupRating.objects.update_or_create(
                user=request.user,
                group=group,
                defaults={'rating': rating_value}
            )
            
            serializer = GroupRatingSerializer(rating)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, group_id):
        """Delete a rating for a group"""
        try:
            group = Group.objects.get(id=group_id)
            try:
                rating = GroupRating.objects.get(user=request.user, group=group)
                rating.delete()
                return Response({'detail': 'Rating deleted'}, status=status.HTTP_204_NO_CONTENT)
            except GroupRating.DoesNotExist:
                return Response({'detail': 'Rating not found'}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND) 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_recommendations(request):
    """Get personalized group recommendations for the user"""
    user = request.user
    
    # Get all groups the user hasn't joined or created
    user_groups = set()
    user_groups.update(user.joined_groups.values_list('id', flat=True))
    user_groups.add(user.created_groups.values_list('id', flat=True))
    
    # Get all available groups excluding user's groups
    available_groups = Group.objects.exclude(id__in=user_groups)
    
    recommendations = []
    
    for group in available_groups:
        score = 0
        reasons = []
        
        # 1. Major match (highest weight: 40 points)
        if user.major and group.subject_code:
            # Check if major relates to subject code
            major_keywords = user.major.lower().split()
            subject_keywords = group.subject_code.lower().split()
            
            # Simple keyword matching
            for major_word in major_keywords:
                for subject_word in subject_keywords:
                    if major_word in subject_word or subject_word in major_word:
                        score += 40
                        reasons.append("Matches your major")
                        break
                if score >= 40:  # Only add reason once
                    break
        
        # 2. Year level match (30 points)
        if user.year_level == group.year_level:
            score += 30
            reasons.append("Same year level")
        
        # 3. Study format preference (20 points)
        if user.preferred_study_format and group.meeting_format:
            if user.preferred_study_format.lower() in group.meeting_format.lower() or group.meeting_format.lower() in user.preferred_study_format.lower():
                score += 20
                reasons.append("Matches your study preference")
        
        # 4. Language preference (15 points)
        if user.languages_spoken and group.primary_language:
            user_languages = [lang.strip().lower() for lang in user.languages_spoken.split(',')]
            if group.primary_language.lower() in user_languages:
                score += 15
                reasons.append("Matches your language preference")
        
        # 5. Popular groups bonus (10 points)
        member_count = group.members.count()
        if member_count >= 5:
            score += 10
            reasons.append("Popular group")
        
        # 6. High rating bonus (10 points)
        from .models import GroupRating
        avg_rating = GroupRating.get_average_rating(group)
        if avg_rating and avg_rating >= 4.0:
            score += 10
            reasons.append("Highly rated")
        
        # 7. Subject area diversity (5 points)
        # If user has joined groups in different subjects, recommend variety
        user_subjects = set(user.joined_groups.values_list('subject_code', flat=True))
        if group.subject_code not in user_subjects:
            score += 5
            reasons.append("New subject area")
        
        # Only include groups with some relevance (score > 20)
        if score > 20:
            # Calculate match percentage
            match_percentage = min(score, 100)
            
            recommendations.append({
                'group': GroupSerializer(group, context={'request': request}).data,
                'score': score,
                'match_percentage': match_percentage,
                'reasons': reasons[:3],  # Top 3 reasons
                'member_count': member_count,
                'avg_rating': avg_rating
            })
    
    # Sort by score and return top 6 recommendations
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    return Response({
        'recommendations': recommendations[:6],
        'user_profile': {
            'major': user.major,
            'year_level': user.year_level,
            'preferred_study_format': user.preferred_study_format,
            'languages_spoken': user.languages_spoken
        }
    }) 

class LeaveGroupView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, group_id):
        """Leave a group (for members only)"""
        try:
            group = Group.objects.get(id=group_id)
            
            # Check if user is a member (not the creator)
            if group.creator == request.user:
                return Response({'detail': 'Group creators cannot leave their own group. Use delete instead.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if request.user not in group.members.all():
                return Response({'detail': 'You are not a member of this group'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Remove user from group
            group.members.remove(request.user)
            
            # Create notification
            GroupNotification.objects.create(
                group=group,
                message=f"{request.user.name} left the group."
            )
            
            return Response({'detail': 'Successfully left the group'}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

class DeleteGroupView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, group_id):
        """Delete a group (for creators only)"""
        try:
            group = Group.objects.get(id=group_id)
            
            # Check if user is the creator
            if group.creator != request.user:
                return Response({'detail': 'Only the group creator can delete the group'}, status=status.HTTP_403_FORBIDDEN)
            
            # Delete the group (this will cascade to related objects)
            group_name = group.group_name
            group.delete()
            
            return Response({'detail': f'Group "{group_name}" has been deleted'}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND) 

class UpdateGroupView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.creator != request.user:
                return Response({'error': 'Only the group creator can update the group'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = GroupSerializer(group, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

class FlashcardFolderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all flashcard folders for the current user, optionally filtered by group"""
        folders = FlashcardFolder.objects.filter(creator=request.user)
        
        # Filter by group if specified
        group_id = request.query_params.get('group')
        if group_id:
            folders = folders.filter(group_id=group_id)
        
        folders = folders.order_by('-created_at')
        serializer = FlashcardFolderSerializer(folders, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new flashcard folder"""
        serializer = FlashcardFolderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlashcardFolderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, folder_id):
        """Get a specific flashcard folder with its flashcards"""
        try:
            folder = FlashcardFolder.objects.get(id=folder_id, creator=request.user)
            folder_data = FlashcardFolderSerializer(folder, context={'request': request}).data
            flashcards = Flashcard.objects.filter(folder=folder).order_by('created_at')
            flashcard_data = FlashcardSerializer(flashcards, many=True, context={'request': request}).data
            
            return Response({
                'folder': folder_data,
                'flashcards': flashcard_data
            })
        except FlashcardFolder.DoesNotExist:
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, folder_id):
        """Update a flashcard folder"""
        try:
            folder = FlashcardFolder.objects.get(id=folder_id, creator=request.user)
            serializer = FlashcardFolderSerializer(folder, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except FlashcardFolder.DoesNotExist:
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, folder_id):
        """Delete a flashcard folder"""
        try:
            folder = FlashcardFolder.objects.get(id=folder_id, creator=request.user)
            folder.delete()
            return Response({'message': 'Folder deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except FlashcardFolder.DoesNotExist:
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)

class FlashcardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create a new flashcard"""
        try:
            # Handle both FormData and JSON data
            folder_id = request.data.get('folder')
            if not folder_id:
                return Response({'error': 'Folder ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            folder = FlashcardFolder.objects.get(id=folder_id, creator=request.user)
            
            # Create a new dict with the data to avoid deepcopy issues with files
            data = dict(request.data)
            data['folder'] = folder.id  # Pass the folder ID, not the object
            
            # Convert list values to strings for text fields
            if isinstance(data.get('question'), list):
                data['question'] = data['question'][0] if data['question'] else ''
            if isinstance(data.get('answer'), list):
                data['answer'] = data['answer'][0] if data['answer'] else ''
            
            # Convert list values to files for image fields
            if isinstance(data.get('question_image'), list):
                data['question_image'] = data['question_image'][0] if data['question_image'] else None
            if isinstance(data.get('answer_image'), list):
                data['answer_image'] = data['answer_image'][0] if data['answer_image'] else None

            # Add more detailed debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[FlashcardView.post] Request data: {request.data}")
            logger.info(f"[FlashcardView.post] Processed data: {data}")
            logger.info(f"[FlashcardView.post] Folder ID: {folder_id}")
            logger.info(f"[FlashcardView.post] Folder object: {folder}")

            serializer = FlashcardSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                flashcard = serializer.save()
                # Confirm storage backend
                if flashcard.question_image:
                    logger.info(f"[FlashcardView.post] question_image storage: {type(flashcard.question_image.storage)}")
                    logger.info(f"[FlashcardView.post] question_image url: {getattr(flashcard.question_image, 'url', None)}")
                    if not getattr(flashcard.question_image, 'url', None):
                        logger.error("[FlashcardView.post] ERROR: Question image was not saved or has no URL!")
                        return Response({'error': 'Question image was not saved or has no URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                if flashcard.answer_image:
                    logger.info(f"[FlashcardView.post] answer_image storage: {type(flashcard.answer_image.storage)}")
                    logger.info(f"[FlashcardView.post] answer_image url: {getattr(flashcard.answer_image, 'url', None)}")
                    if not getattr(flashcard.answer_image, 'url', None):
                        logger.error("[FlashcardView.post] ERROR: Answer image was not saved or has no URL!")
                        return Response({'error': 'Answer image was not saved or has no URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            # Add debugging to see what validation errors occur
            logger.error(f"[FlashcardView.post] Flashcard validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except FlashcardFolder.DoesNotExist:
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Invalid folder ID'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.exception(f"[FlashcardView.post] Unexpected error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FlashcardDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, flashcard_id):
        """Get a specific flashcard"""
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id, folder__creator=request.user)
            serializer = FlashcardSerializer(flashcard, context={'request': request})
            return Response(serializer.data)
        except Flashcard.DoesNotExist:
            return Response({'error': 'Flashcard not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, flashcard_id):
        """Update a flashcard"""
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id, folder__creator=request.user)
            
            print(f"=== FLASHCARD UPDATE DEBUG ===")
            print(f"Flashcard ID: {flashcard_id}")
            print(f"Original question_image: {flashcard.question_image}")
            print(f"Original answer_image: {flashcard.answer_image}")
            print(f"Request data keys: {list(request.data.keys())}")
            print(f"Request FILES keys: {list(request.FILES.keys())}")
            
            # Handle FormData for image updates
            data = dict(request.data)
            
            # Convert list values to strings for text fields
            if isinstance(data.get('question'), list):
                data['question'] = data['question'][0] if data['question'] else ''
            if isinstance(data.get('answer'), list):
                data['answer'] = data['answer'][0] if data['answer'] else ''
            
            # Convert list values to files for image fields
            if isinstance(data.get('question_image'), list):
                data['question_image'] = data['question_image'][0] if data['question_image'] else None
            if isinstance(data.get('answer_image'), list):
                data['answer_image'] = data['answer_image'][0] if data['answer_image'] else None
            
            # Handle image removal (empty string means remove the image)
            if data.get('question_image') == '':
                data['question_image'] = None
            if data.get('answer_image') == '':
                data['answer_image'] = None
            
            print(f"Processed data: {data}")
            print(f"Question image type: {type(data.get('question_image'))}")
            print(f"Answer image type: {type(data.get('answer_image'))}")
            if data.get('question_image'):
                print(f"Question image name: {data['question_image'].name}")
            if data.get('answer_image'):
                print(f"Answer image name: {data['answer_image'].name}")
            
            serializer = FlashcardSerializer(flashcard, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                # Check if we're updating images and delete old ones
                if data.get('question_image') and flashcard.question_image:
                    print(f"Deleting old question image: {flashcard.question_image}")
                    try:
                        flashcard.question_image.delete(save=False)
                    except Exception as e:
                        print(f"Error deleting old question image: {e}")
                
                if data.get('answer_image') and flashcard.answer_image:
                    print(f"Deleting old answer image: {flashcard.answer_image}")
                    try:
                        flashcard.answer_image.delete(save=False)
                    except Exception as e:
                        print(f"Error deleting old answer image: {e}")
                
                updated_flashcard = serializer.save()
                print(f"Updated question_image: {updated_flashcard.question_image}")
                print(f"Updated answer_image: {updated_flashcard.answer_image}")
                return Response(serializer.data)
            # Add debugging to see what validation errors occur
            print("Flashcard update validation errors:", serializer.errors)
            print("Flashcard update data:", data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Flashcard.DoesNotExist:
            return Response({'error': 'Flashcard not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, flashcard_id):
        """Delete a flashcard"""
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id, folder__creator=request.user)
            flashcard.delete()
            return Response({'message': 'Flashcard deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Flashcard.DoesNotExist:
            return Response({'error': 'Flashcard not found'}, status=status.HTTP_404_NOT_FOUND)

class FlashcardImageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, flashcard_id, image_type):
        """Serve flashcard images (question or answer)"""
        import logging
        logger = logging.getLogger(__name__)
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id, folder__creator=request.user)
            
            # Determine which image to serve
            if image_type == 'question':
                image_field = flashcard.question_image
            elif image_type == 'answer':
                image_field = flashcard.answer_image
            else:
                return Response({'detail': 'Invalid image type'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not image_field:
                return Response({'detail': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # For S3 files, stream the file directly
            logger.info(f"[FlashcardImageView.get] image_field: {image_field}")
            logger.info(f"[FlashcardImageView.get] image_field storage: {type(image_field.storage)}")
            logger.info(f"[FlashcardImageView.get] image_field url: {getattr(image_field, 'url', None)}")
            if hasattr(image_field, 'url'):
                try:
                    import boto3
                    from django.conf import settings
                    
                    # Create S3 client
                    s3_client = boto3.client(
                        's3',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_S3_REGION_NAME
                    )
                    
                    # Get the file path from the storage
                    file_path = image_field.name
                    logger.info(f"[FlashcardImageView.get] S3 file_path: {file_path}")
                    
                    # Get the file object from S3
                    response = s3_client.get_object(
                        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                        Key=file_path
                    )
                    
                    # Stream the file content
                    file_content = response['Body'].read()
                    
                    # Determine content type based on file extension
                    content_type = 'image/jpeg'  # default
                    if file_path.lower().endswith('.png'):
                        content_type = 'image/png'
                    elif file_path.lower().endswith('.gif'):
                        content_type = 'image/gif'
                    elif file_path.lower().endswith('.webp'):
                        content_type = 'image/webp'
                    
                    # Create HTTP response with the file content
                    http_response = HttpResponse(file_content, content_type=content_type)
                    http_response['Cache-Control'] = 'public, max-age=31536000'  # Cache for 1 year
                    
                    return http_response
                    
                except Exception as e:
                    logger.error(f"[FlashcardImageView.get] Error streaming image from S3: {e}")
                    return Response({'detail': 'Image not accessible'}, status=status.HTTP_404_NOT_FOUND)
            else:
                # For local files, try to serve directly
                try:
                    with image_field.open('rb') as f:
                        file_content = f.read()
                    
                    # Determine content type based on file extension
                    content_type = 'image/jpeg'  # default
                    if image_field.name.lower().endswith('.png'):
                        content_type = 'image/png'
                    elif image_field.name.lower().endswith('.gif'):
                        content_type = 'image/gif'
                    elif image_field.name.lower().endswith('.webp'):
                        content_type = 'image/webp'
                    
                    response = HttpResponse(file_content, content_type=content_type)
                    response['Cache-Control'] = 'public, max-age=31536000'  # Cache for 1 year
                    logger.warning(f"[FlashcardImageView.get] WARNING: Serving image from local storage!")
                    return response
                except Exception as e:
                    logger.error(f"[FlashcardImageView.get] Error accessing local image: {e}")
                    return Response({'detail': 'Image not accessible'}, status=status.HTTP_404_NOT_FOUND)
            
        except Flashcard.DoesNotExist:
            return Response({'detail': 'Flashcard not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"[FlashcardImageView.get] Unexpected error: {e}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        # Use 'email' instead of 'username' for authentication
        credentials = {
            'email': attrs.get('email', '').strip().lower(),
            'password': attrs.get('password')
        }
        user = authenticate(**credentials)
        if user is None:
            logger.warning(f"Login failed: invalid credentials for email={credentials['email']}")
            raise serializers.ValidationError('Invalid credentials')
        self.user = user
        logger.info(f"Login attempt: email={user.email}, is_active={user.is_active}, is_email_verified={getattr(user, 'is_email_verified', None)}")
        if not user.is_active:
            logger.warning(f"Login failed: inactive user {user.email}")
            raise serializers.ValidationError('This account is inactive. Please contact support.')
        if not getattr(user, 'is_email_verified', True):
            logger.warning(f"Login failed: unverified email {user.email}")
            raise serializers.ValidationError('Email not verified. Please check your inbox and verify your email before logging in.')
        data = super().validate(attrs)
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Function-based views for URL patterns
@api_view(['GET'])
@permission_classes([AllowAny])
def group_list(request):
    """Get list of groups with filtering"""
    view = GroupListCreateView()
    view.request = request
    view.args = ()
    view.kwargs = {}
    view.format_kwarg = None
    return view.get(request)

@api_view(['GET'])
@permission_classes([AllowAny])
def group_detail(request, group_id):
    """Get detailed information about a specific group"""
    view = GroupRetrieveView()
    view.request = request
    view.args = ()
    view.kwargs = {'pk': group_id}
    view.format_kwarg = None
    return view.get(request, pk=group_id)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def message_list(request, group_id):
    """Get messages for a group or post a new message"""
    view = GroupChatView()
    view.request = request
    view.kwargs = {'group_id': group_id}
    if request.method == 'GET':
        return view.get(request, group_id=group_id)
    elif request.method == 'POST':
        return view.post(request, group_id=group_id)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def session_list(request, group_id):
    """Get sessions for a group or create a new session"""
    view = GroupSessionListCreateView()
    view.request = request
    view.kwargs = {'group_id': group_id}
    if request.method == 'GET':
        return view.get(request, group_id=group_id)
    elif request.method == 'POST':
        return view.post(request, group_id=group_id)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def file_list(request, group_id):
    """Get files for a group or upload a new file"""
    view = GroupFileListCreateView()
    view.request = request
    view.kwargs = {'group_id': group_id}
    if request.method == 'GET':
        return view.get(request, group_id=group_id)
    elif request.method == 'POST':
        return view.post(request, group_id=group_id)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request, group_id):
    group = Group.objects.get(id=group_id)
    if not (group.members.filter(id=request.user.id).exists() or group.creator == request.user):
        return Response({'detail': 'Not a group member'}, status=403)
    # Clean up past sessions before fetching notifications
    cleanup_past_sessions()
    notifications = GroupNotification.objects.filter(group=group).order_by('-created_at')[:50]
    data = [
        {
            'id': n.id,
            'message': n.message,
            'created_at': n.created_at
        } for n in notifications
    ]
    return Response(data)

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def rating_list(request, group_id):
    """Get ratings for a group, post a rating, or delete a rating"""
    view = GroupRatingView()
    view.request = request
    view.kwargs = {'group_id': group_id}
    if request.method == 'GET':
        return view.get(request, group_id=group_id)
    elif request.method == 'POST':
        return view.post(request, group_id=group_id)
    elif request.method == 'DELETE':
        return view.delete(request, group_id=group_id)

@api_view(['GET'])
@permission_classes([AllowAny])
def similar_groups(request, group_id):
    """Get similar groups for a given group"""
    try:
        group = Group.objects.get(id=group_id)
        similar_groups_data = find_similar_groups(group, limit=3)
        
        similar_groups_serialized = []
        for similar_data in similar_groups_data:
            similar_group = similar_data['group']
            similar_serializer = GroupSerializer(similar_group)
            similar_groups_serialized.append({
                'group': similar_serializer.data,
                'similarity_score': similar_data['score'],
                'matching_factors': similar_data['factors']
            })
        
        return Response({
            'similar_groups': similar_groups_serialized
        })
    except Group.DoesNotExist:
        return Response({'detail': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_growth(request):
    from .models import User
    from django.utils import timezone
    from datetime import timedelta
    today = timezone.now().date()
    days = 30
    data = []
    for i in range(days):
        day = today - timedelta(days=days - i - 1)
        count = User.objects.filter(date_joined__date__lte=day).count()
        data.append({
            'date': day.isoformat(),
            'user_count': count
        })
    return Response(data)

from .models import Report
from rest_framework import serializers

class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.SerializerMethodField()
    class Meta:
        model = Report
        fields = ['id', 'type', 'target_id', 'reporter_email', 'reason', 'status', 'severity', 'created_at']
    def get_reporter_email(self, obj):
        return obj.reporter.email if obj.reporter else 'Anonymous'

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_report(request):
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        reporter = request.user if request.user.is_authenticated else None
        Report.objects.create(
            type=serializer.validated_data['type'],
            target_id=serializer.validated_data['target_id'],
            reporter=reporter,
            reason=serializer.validated_data['reason'],
            status=serializer.validated_data.get('status', 'open'),
            severity=serializer.validated_data.get('severity', 'medium'),
        )
        return Response({'message': 'Report submitted'}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_reports(request):
    reports = Report.objects.all().order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_report(request, report_id):
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)
    for field in ['status', 'severity']:
        if field in request.data:
            setattr(report, field, request.data[field])
    report.save()
    serializer = ReportSerializer(report)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def popular_subjects(request):
    from .models import Group
    from django.db.models import Count
    subjects = (
        Group.objects.values('subject_code')
        .annotate(group_count=Count('id'))
        .order_by('-group_count')[:5]
    )
    return Response(list(subjects))

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request a password reset by email"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No user found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
        # Delete any existing unused tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()
        # Create new reset token
        reset_token = PasswordResetToken.objects.create(user=user)
        # Send reset email
        reset_url = f"http://localhost:3000/reset-password?token={reset_token.token}"
        email_subject = "MelbMinds Password Reset Request"
        email_message = f"""
        <html>
        <body>
            <h2>Password Reset Requested</h2>
            <p>Hello {user.name},</p>
            <p>We received a request to reset your password for your MelbMinds account.</p>
            <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
            <a href='{reset_url}'>Reset My Password</a>
            <p>If you did not request this, you can ignore this email.</p>
        </body>
        </html>
        """
        try:
            send_mail(
                subject=email_subject,
                message="Please use an HTML compatible email client to view this message.",
                from_email="MelbMinds <melbminds@gmail.com>",
                recipient_list=[email],
                fail_silently=False,
                html_message=email_message
            )
        except Exception as e:
            reset_token.delete()
            return Response({'error': 'Failed to send password reset email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'Password reset email sent! Please check your inbox.'}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password using token"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        new_password = data.get('password')
        if not token or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from uuid import UUID
            token_uuid = UUID(token)
            reset_token = PasswordResetToken.objects.get(token=token_uuid, is_used=False)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'error': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)
        # Check if token is expired (1 hour)
        if reset_token.created_at < timezone.now() - timedelta(hours=1):
            reset_token.delete()
            return Response({'error': 'Reset token has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        reset_token.is_used = True
        reset_token.save()
        return Response({'message': 'Password has been reset successfully!'}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
