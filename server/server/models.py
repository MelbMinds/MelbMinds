from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import uuid
from storages.backends.s3boto3 import S3Boto3Storage

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    major = models.CharField(max_length=255)
    year_level = models.CharField(max_length=50)
    preferred_study_format = models.CharField(max_length=100)
    languages_spoken = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'major', 'year_level', 'preferred_study_format', 'languages_spoken', 'bio']

    __module__ = 'server.models'

    class Meta:
        app_label = 'server'

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name

class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Verification token for {self.user.email}"

    class Meta:
        app_label = 'server'

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Password reset token for {self.user.email}"

    class Meta:
        app_label = 'server'

class Group(models.Model):
    group_name = models.CharField(max_length=255)
    subject_code = models.CharField(max_length=50)
    course_name = models.CharField(max_length=255, default="")
    description = models.TextField()
    year_level = models.CharField(max_length=50)
    meeting_format = models.CharField(max_length=100)
    primary_language = models.CharField(max_length=100)
    meeting_schedule = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    tags = models.CharField(max_length=255, blank=True)
    group_guidelines = models.TextField(blank=True)
    group_personality = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups', null=True, blank=True)
    members = models.ManyToManyField(User, related_name='joined_groups', blank=True)
    target_hours = models.PositiveIntegerField(default=10)  # Renamed from target_study_hours

    def __str__(self):
        return self.group_name

class FlashcardFolder(models.Model):
    name = models.CharField(max_length=255)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_folders')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='flashcard_folders', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def flashcard_count(self):
        return self.flashcards.count()

class Flashcard(models.Model):
    folder = models.ForeignKey(FlashcardFolder, on_delete=models.CASCADE, related_name='flashcards')
    question = models.TextField(blank=True)
    answer = models.TextField(blank=True)
    question_image = models.ImageField(upload_to='flashcard_images/', null=True, blank=True, storage=S3Boto3Storage())
    answer_image = models.ImageField(upload_to='flashcard_images/', null=True, blank=True, storage=S3Boto3Storage())
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.question[:50]}..."

class Message(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name}: {self.text[:30]}"

class GroupSession(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='sessions')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attendees = models.ManyToManyField(User, related_name='joined_sessions', blank=True)

    def __str__(self):
        return f"Session for {self.group.group_name} on {self.date} from {self.start_time} to {self.end_time}"

class GroupFile(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    file = models.FileField(upload_to='group_files/')
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_filename} in {self.group.group_name}"

    def get_file_size_display(self):
        """Convert bytes to human readable format"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

class CompletedSessionCounter(models.Model):
    count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Completed Sessions: {self.count}"

    @classmethod
    def increment(cls, amount=1):
        obj, _ = cls.objects.get_or_create(pk=1)
        obj.count += amount
        obj.save()
        return obj.count

class GroupNotification(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.group.group_name}: {self.message[:30]}"

class GroupRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='ratings')
    rating = models.DecimalField(max_digits=3, decimal_places=1, choices=[
        (1.0, '1.0'),
        (1.5, '1.5'),
        (2.0, '2.0'),
        (2.5, '2.5'),
        (3.0, '3.0'),
        (3.5, '3.5'),
        (4.0, '4.0'),
        (4.5, '4.5'),
        (5.0, '5.0'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'group']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} rated {self.group.group_name} {self.rating}/5"

    @classmethod
    def get_average_rating(cls, group):
        """Get the average rating for a group"""
        ratings = cls.objects.filter(group=group)
        if ratings.exists():
            return ratings.aggregate(models.Avg('rating'))['rating__avg']
        return None

    @classmethod
    def get_rating_count(cls, group):
        """Get the number of ratings for a group"""
        return cls.objects.filter(group=group).count()

class PendingRegistration(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    major = models.CharField(max_length=255)
    year_level = models.CharField(max_length=50)
    preferred_study_format = models.CharField(max_length=100)
    languages_spoken = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ("group", "Group"),
        ("user", "User"),
        ("message", "Message"),
    ]
    STATUS_CHOICES = [
        ("open", "Open"),
        ("investigating", "Investigating"),
        ("resolved", "Resolved"),
    ]
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    type = models.CharField(max_length=16, choices=REPORT_TYPE_CHOICES)
    target_id = models.IntegerField()
    reporter = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="open")
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, default="medium")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} report (ID {self.target_id}) - {self.status}";
