from rest_framework import serializers
from .models import User, Group, Message, GroupSession, GroupFile, GroupRating

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
    member_count = serializers.SerializerMethodField()
    joined = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    
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
    
    def get_average_rating(self, obj):
        from .models import GroupRating
        return GroupRating.get_average_rating(obj)
    
    def get_rating_count(self, obj):
        from .models import GroupRating
        return GroupRating.get_rating_count(obj)
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = GroupRating.objects.get(user=request.user, group=obj)
                return float(rating.rating)
            except GroupRating.DoesNotExist:
                return None
        return None

class GroupDetailSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    member_count = serializers.SerializerMethodField()
    # course_name is a direct field, not a relation
    joined = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    
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
    
    def get_average_rating(self, obj):
        from .models import GroupRating
        return GroupRating.get_average_rating(obj)
    
    def get_rating_count(self, obj):
        from .models import GroupRating
        return GroupRating.get_rating_count(obj)
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = GroupRating.objects.get(user=request.user, group=obj)
                return float(rating.rating)
            except GroupRating.DoesNotExist:
                return None
        return None

class UserProfileSerializer(serializers.ModelSerializer):
    languages = serializers.SerializerMethodField()
    year = serializers.CharField(source='year_level')
    studyFormat = serializers.CharField(source='preferred_study_format')
    
    class Meta:
        model = User
        fields = [
            "name", "email", "major", "year", "studyFormat",
            "languages", "bio"
        ]
    
    def get_languages(self, obj):
        if obj.languages_spoken:
            return [lang.strip() for lang in obj.languages_spoken.split(',') if lang.strip()]
        return []

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

class GroupFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupFile
        fields = ['id', 'group', 'uploaded_by', 'uploaded_by_name', 'uploaded_by_email', 'file', 'original_filename', 'file_size', 'file_size_display', 'file_url', 'uploaded_at']
        read_only_fields = ['group', 'uploaded_by', 'uploaded_by_name', 'uploaded_by_email', 'file_size_display', 'file_url', 'uploaded_at']
    
    def to_representation(self, instance):
        """Custom representation to ensure uploaded_by_email is included"""
        data = super().to_representation(instance)
        # Ensure uploaded_by_email is always included
        if instance.uploaded_by:
            data['uploaded_by_email'] = instance.uploaded_by.email
        return data
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

class GroupRatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupRating
        fields = ['id', 'user', 'user_name', 'group', 'rating', 'created_at', 'updated_at', 'average_rating', 'rating_count']
        read_only_fields = ['user', 'user_name', 'created_at', 'updated_at', 'average_rating', 'rating_count']
    
    def get_average_rating(self, obj):
        return GroupRating.get_average_rating(obj.group)
    
    def get_rating_count(self, obj):
        return GroupRating.get_rating_count(obj.group) 