from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth import authenticate
from .serializers import UserSerializer, GroupSerializer
from .models import Group

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

class GroupRetrieveView(generics.RetrieveAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer 