from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
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
from .perspective_moderation import perspective_moderator

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
        # Content moderation for group creation
        group_name_validation = perspective_moderator.validate_user_input('group name', serializer.validated_data.get('group_name', ''))
        description_validation = perspective_moderator.validate_user_input('description', serializer.validated_data.get('description', ''))
        tags_validation = perspective_moderator.validate_user_input('tags', serializer.validated_data.get('tags', ''))
        
        if not group_name_validation['valid']:
            raise serializers.ValidationError({
                'group_name': group_name_validation['message']
            })
        
        if not description_validation['valid']:
            raise serializers.ValidationError({
                'description': description_validation['message']
            })
        
        if not tags_validation['valid']:
            raise serializers.ValidationError({
                'tags': tags_validation['message']
            })
        
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
        name_validation = perspective_moderator.validate_user_input('name', data.get('name', ''))
        bio_validation = perspective_moderator.validate_user_input('bio', data.get('bio', ''))
        
        if not name_validation['valid']:
            return Response({
                'error': name_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not bio_validation['valid']:
            return Response({
                'error': bio_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
        message_validation = perspective_moderator.validate_user_input('message', message_text)
        
        if not message_validation['valid']:
            return Response({
                'error': message_validation['message']
            }, status=status.HTTP_400_BAD_REQUEST)
        
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