from rest_framework import serializers
from .models import User, Group, Message, GroupSession, GroupFile, GroupRating, FlashcardFolder, Flashcard

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'major', 'year_level', 'preferred_study_format', 'languages_spoken', 'bio', 'password', 'is_staff', 'is_superuser']

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
        count = obj.members.count()
        if obj.creator and obj.creator not in obj.members.all():
            count += 1
        return count
    
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
        count = obj.members.count()
        if obj.creator and obj.creator not in obj.members.all():
            count += 1
        return count
    
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
    joinDate = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            "name", "email", "major", "year", "studyFormat",
            "languages", "bio", "joinDate", "avatar"
        ]
    
    def get_languages(self, obj):
        if obj.languages_spoken:
            return [lang.strip() for lang in obj.languages_spoken.split(',') if lang.strip()]
        return []
    
    def get_joinDate(self, obj):
        # Use date_joined if available, else None
        return getattr(obj, 'date_joined', None)
    
    def get_avatar(self, obj):
        # No avatar field in model, return None or a placeholder
        return None

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
        fields = ['id', 'group', 'creator', 'creator_name', 'date', 'start_time', 'end_time', 'location', 'description', 'created_at', 'updated_at']
        read_only_fields = ['group', 'creator', 'creator_name', 'created_at', 'updated_at']

    def validate(self, data):
        from datetime import datetime, date, time
        import pytz
        # Get date, start_time, end_time from data or instance
        session_date = data.get('date') or getattr(self.instance, 'date', None)
        start_time = data.get('start_time') or getattr(self.instance, 'start_time', None)
        end_time = data.get('end_time') or getattr(self.instance, 'end_time', None)

        # 1. Start time and end time must be provided
        if not session_date or not start_time or not end_time:
            raise serializers.ValidationError('Date, start time, and end time are required.')

        # 2. Start time cannot be in the past (if date is today)
        tz = pytz.timezone('Australia/Sydney')
        now = datetime.now(tz)
        if session_date == now.date() and start_time < now.time():
            raise serializers.ValidationError('Start time cannot be in the past.')

        # 3. End time must be after start time
        if end_time <= start_time:
            raise serializers.ValidationError('End time must be after start time.')

        # 4. Both times must be on quarter-hour marks
        for t, label in [(start_time, 'Start time'), (end_time, 'End time')]:
            if t.minute not in (0, 15, 30, 45) or (hasattr(t, 'second') and t.second != 0):
                raise serializers.ValidationError(f'{label} ({t}) must be on a quarter-hour mark (:00, :15, :30, :45).')

        return data

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

class FlashcardFolderSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    flashcard_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = FlashcardFolder
        fields = ['id', 'name', 'creator', 'creator_name', 'group', 'created_at', 'updated_at', 'flashcard_count']
        read_only_fields = ['creator', 'creator_name', 'created_at', 'updated_at', 'flashcard_count']
    
    def create(self, validated_data):
        # Set the creator from the request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['creator'] = request.user
        return super().create(validated_data)

class FlashcardSerializer(serializers.ModelSerializer):
    question_image_url = serializers.SerializerMethodField()
    answer_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Flashcard
        fields = ['id', 'folder', 'question', 'answer', 'question_image', 'answer_image', 'question_image_url', 'answer_image_url', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_question_image_url(self, obj):
        if obj.question_image:
            # Return URL to our Django backend instead of direct S3 URL
            request = self.context.get('request')
            if request:
                return f"{request.scheme}://{request.get_host()}/api/flashcards/{obj.id}/image/question/"
            return None
        return None
    
    def get_answer_image_url(self, obj):
        if obj.answer_image:
            # Return URL to our Django backend instead of direct S3 URL
            request = self.context.get('request')
            if request:
                return f"{request.scheme}://{request.get_host()}/api/flashcards/{obj.id}/image/answer/"
            return None
        return None
    
    def validate(self, data):
        """Validate the flashcard data"""
        # For partial updates, we need to check existing data as well
        instance = getattr(self, 'instance', None)
        
        # Get the values being updated
        question = data.get('question')
        answer = data.get('answer')
        question_image = data.get('question_image')
        answer_image = data.get('answer_image')
        
        # For partial updates, use existing values if not provided
        if instance:
            if question is None:
                question = instance.question
            if answer is None:
                answer = instance.answer
            if question_image is None:
                question_image = instance.question_image
            if answer_image is None:
                answer_image = instance.answer_image
        
        # Strip whitespace from text fields
        question = question.strip() if question else ''
        answer = answer.strip() if answer else ''
        
        # At least one of question text or question image must be provided
        if not question and not question_image:
            raise serializers.ValidationError("Question text or image is required")
        
        # At least one of answer text or answer image must be provided
        if not answer and not answer_image:
            raise serializers.ValidationError("Answer text or image is required")
        
        return data
    
    def create(self, validated_data):
        # Ensure the folder is properly set
        folder = validated_data.get('folder')
        if not folder:
            raise serializers.ValidationError("Folder is required")
        
        return super().create(validated_data) 