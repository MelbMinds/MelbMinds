from rest_framework import serializers
from .models import User, Group

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
    class Meta:
        model = Group
        fields = '__all__' 