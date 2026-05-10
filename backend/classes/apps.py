from django.apps import AppConfig


class ClassesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'classes'

    def ready(self):
        try:
            from classes.models import Class

            for name in ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']:
                Class.objects.get_or_create(name=name)

        except Exception:
            pass