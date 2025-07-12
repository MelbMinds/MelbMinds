from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth import authenticate
from django.db.models import Q
from .serializers import UserSerializer, GroupSerializer, GroupDetailSerializer, UserProfileSerializer, MessageSerializer, GroupSessionSerializer
from .models import Group, Message, GroupSession, CompletedSessionCounter, GroupNotification
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Count
from rest_framework.permissions import AllowAny

def cleanup_past_sessions():
    """
    Utility function to clean up past sessions, create notifications, and update counter.
    This should be called periodically or when sessions are accessed.
    """
    from django.utils import timezone
    import pytz
    
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
        session_time = session.time.replace(microsecond=0)
        session_seconds = session_time.hour * 3600 + session_time.minute * 60 + session_time.second
        # Check if session is in the past
        if session.date < current_date:
            past_sessions.append(session)
        elif session.date == current_date and session_seconds < current_seconds:
            past_sessions.append(session)
    
    deleted_count = len(past_sessions)
    
    # Create notifications for each past session before deleting
    for session in past_sessions:
        GroupNotification.objects.create(
            group=session.group,
            message=f"Session at {session.location} on {session.date} {session.time} just started."
        )
        # Delete the session
        session.delete()
    
    # Update the completed sessions counter
    if deleted_count > 0:
        CompletedSessionCounter.increment(deleted_count)
    
    return deleted_count

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
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

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def get_queryset(self):
        queryset = Group.objects.all().order_by('-created_at')
        
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
        
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
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
        return super().get(request, *args, **kwargs)

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
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, group=group)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class GroupMembersView(APIView):
    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        members = group.members.all()
        data = [{'id': m.id, 'name': m.name, 'email': m.email} for m in members]
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
            Q(date=now.date(), time__gte=now.time()),
            group=group
        ).order_by('date', 'time')
        serializer = GroupSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if group.creator != request.user:
            return Response({'detail': 'Only the group creator can create sessions'}, status=403)
        serializer = GroupSessionSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save(group=group, creator=request.user)
            GroupNotification.objects.create(
                group=group,
                message=f"New session created at {session.location} on {session.date} {session.time}."
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
        Q(date=now.date(), time__gte=now.time())
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
    return Response({
        "active_students": active_students,
        "active_sessions": active_sessions,
        "subject_areas": subject_areas,
        "new_groups_today": new_groups_today,
        "unimelb_students": unimelb_students,
        "groups_created": groups_created,
        "sessions_completed": sessions_completed,
        "grade_improvement": 12,
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
    from datetime import datetime, timedelta
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
            'creator': user
        }
    )
    
    # Create a session from 2 hours ago (today but past time)
    past_time = datetime.now() - timedelta(hours=2)
    
    session = GroupSession.objects.create(
        group=group,
        creator=user,
        date=past_time.date(),
        time=past_time.time(),
        location='Past Test Location',
        description='This session should be deleted by cleanup'
    )
    
    return Response({
        "message": f"Created test session: {session}",
        "session_id": session.id,
        "session_date": session.date,
        "session_time": session.time
    }) 