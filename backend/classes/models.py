from django.db import models

CLASS_CHOICES = [
    ('JSS1', 'JSS 1'), ('JSS2', 'JSS 2'), ('JSS3', 'JSS 3'),
    ('SSS1', 'SSS 1'), ('SSS2', 'SSS 2'), ('SSS3', 'SSS 3'),
]

class Class(models.Model):
    name = models.CharField(max_length=10, choices=CLASS_CHOICES, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Classes'