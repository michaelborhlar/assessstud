from django.core.management.base import BaseCommand
from classes.models import Class

class Command(BaseCommand):
    help = 'Seed default classes'

    def handle(self, *args, **kwargs):
        classes = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']
        for name in classes:
            obj, created = Class.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f'Created class: {name}')
            else:
                self.stdout.write(f'Already exists: {name}')
        self.stdout.write('✓ Classes seeded')
