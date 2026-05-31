from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from classes.models import Class

class RegisterStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    student_class = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all())

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'password', 'student_class']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            student_class=validated_data['student_class'],
            role='student'
        )
        return user

class RegisterAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            role='admin', is_staff=True,
            **validated_data
        )

class UserSerializer(serializers.ModelSerializer):
    student_class_name = serializers.SerializerMethodField()
    date_joined_display = serializers.SerializerMethodField()
    last_seen_display   = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'role', 'student_class', 'student_class_name',
            'date_joined', 'date_joined_display',
            'last_seen', 'last_seen_display',
        ]

    def get_student_class_name(self, obj):
        return obj.student_class.name if obj.student_class else None

    def get_date_joined_display(self, obj):
        if obj.date_joined:
            return obj.date_joined.strftime('%d %b %Y, %I:%M %p')
        return None

    def get_last_seen_display(self, obj):
        if obj.last_seen:
            return obj.last_seen.strftime('%d %b %Y, %I:%M %p')
        return 'Never logged in'

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }