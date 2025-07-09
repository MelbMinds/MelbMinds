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
    description = models.TextField()
    year_level = models.CharField(max_length=50)
    meeting_format = models.CharField(max_length=100)
    primary_language = models.CharField(max_length=100)
    meeting_schedule = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    tags = models.CharField(max_length=255, blank=True)
    group_guidelines = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.group_name
