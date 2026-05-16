from rest_framework import serializers
from .models import LearningContent

class LearningContentSerializer(serializers.ModelSerializer):
    target_class_name = serializers.SerializerMethodField()
    video_file_url    = serializers.SerializerMethodField()

    class Meta:
        model = LearningContent
        fields = [
            'id', 'title', 'description', 'subject',
            'video_url', 'video_file', 'video_file_url',
            'target_class', 'target_class_name',
            'is_visible', 'created_by', 'created_at'
        ]

    def get_target_class_name(self, obj):
        return obj.target_class.name if obj.target_class else None

    def get_video_file_url(self, obj):
        request = self.context.get('request')
        if obj.video_file and request:
            return request.build_absolute_uri(obj.video_file.url)
        return None
