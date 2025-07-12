from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

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

    def __str__(self):
        return self.group_name

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
    time = models.TimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session for {self.group.group_name} on {self.date} at {self.time}"

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
