from rest_framework import serializers
from .models import User, Group, Message, GroupSession

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'major', 'year_level', 'preferred_study_format', 'languages_spoken', 'bio', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class GroupSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = Group
        fields = '__all__'

class GroupDetailSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    member_count = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    joined = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = '__all__'
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "name", "email", "major", "year_level", "preferred_study_format",
            "languages_spoken", "bio"
        ] 

class MessageSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    class Meta:
        model = Message
        fields = ['id', 'user', 'user_name', 'text', 'timestamp'] 

class GroupSessionSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    class Meta:
        model = GroupSession
        fields = ['id', 'group', 'creator', 'creator_name', 'date', 'time', 'location', 'description', 'created_at', 'updated_at']
        read_only_fields = ['group', 'creator', 'creator_name', 'created_at', 'updated_at'] 