from rest_framework import serializers
from .models import Class
from accounts.models import User

class ClassSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'name', 'student_count']

    def get_student_count(self, obj):
        return obj.students.count()

class StudentInClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username']