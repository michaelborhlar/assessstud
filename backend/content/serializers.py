from rest_framework import serializers
from .models import LearningContent

class LearningContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningContent
        fields = '__all__'