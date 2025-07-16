from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Group, Message, GroupSession, GroupFile, GroupNotification, GroupRating, CompletedSessionCounter

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'major', 'year_level', 'is_active', 'is_staff')
    list_filter = ('is_active', 'is_staff', 'year_level', 'major')
    search_fields = ('email', 'name', 'major')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'major', 'year_level', 'preferred_study_format', 'languages_spoken', 'bio')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'major', 'year_level', 'preferred_study_format', 'languages_spoken', 'bio', 'password1', 'password2'),
        }),
    )

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('group_name', 'subject_code', 'creator', 'year_level', 'meeting_format', 'created_at', 'member_count')
    list_filter = ('year_level', 'meeting_format', 'primary_language', 'created_at')
    search_fields = ('group_name', 'subject_code', 'course_name', 'description')
    readonly_fields = ('created_at',)
    filter_horizontal = ('members',)
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'text_preview', 'timestamp')
    list_filter = ('timestamp', 'group')
    search_fields = ('text', 'user__name', 'group__group_name')
    readonly_fields = ('timestamp',)
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Message'

@admin.register(GroupSession)
class GroupSessionAdmin(admin.ModelAdmin):
    list_display = ('group', 'creator', 'date', 'start_time', 'end_time', 'location', 'created_at')
    list_filter = ('date', 'created_at', 'group')
    search_fields = ('location', 'description', 'group__group_name', 'creator__name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(GroupFile)
class GroupFileAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'group', 'uploaded_by', 'file_size_display', 'uploaded_at')
    list_filter = ('uploaded_at', 'group')
    search_fields = ('original_filename', 'group__group_name', 'uploaded_by__name')
    readonly_fields = ('uploaded_at', 'file_size')
    
    def file_size_display(self, obj):
        return obj.get_file_size_display()
    file_size_display.short_description = 'File Size'

@admin.register(GroupNotification)
class GroupNotificationAdmin(admin.ModelAdmin):
    list_display = ('group', 'message_preview', 'created_at')
    list_filter = ('created_at', 'group')
    search_fields = ('message', 'group__group_name')
    readonly_fields = ('created_at',)
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'

@admin.register(GroupRating)
class GroupRatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'rating', 'created_at', 'updated_at')
    list_filter = ('rating', 'created_at', 'updated_at', 'group')
    search_fields = ('user__name', 'group__group_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CompletedSessionCounter)
class CompletedSessionCounterAdmin(admin.ModelAdmin):
    list_display = ('count',)
    readonly_fields = ('count',)
    
    def has_add_permission(self, request):
        # Only allow one counter instance
        return not CompletedSessionCounter.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False 