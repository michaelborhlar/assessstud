from django.db import models
from django.conf import settings

class LearningContent(models.Model):
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True)
    subject      = models.CharField(max_length=100, blank=True)
    video_url    = models.TextField(blank=True)  # changed from URLField to TextField
    video_file   = models.FileField(upload_to='videos/', null=True, blank=True)
    target_class = models.ForeignKey(
        'classes.Class', on_delete=models.CASCADE, related_name='content'
    )
    is_visible   = models.BooleanField(default=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
