from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth import authenticate
from .serializers import UserSerializer, GroupSerializer, GroupDetailSerializer, UserProfileSerializer, MessageSerializer
from .models import Group, Message
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

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
    queryset = Group.objects.all().order_by('-created_at')
    serializer_class = GroupSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class GroupRetrieveView(generics.RetrieveAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

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

class GroupChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if not group.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Not a group member'}, status=403)
        messages = Message.objects.filter(group=group).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if not group.members.filter(id=request.user.id).exists():
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