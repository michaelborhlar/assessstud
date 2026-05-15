from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class QuestionBank(models.Model):
    SUBJECT_CHOICES = [
        ('math','Mathematics'),('eng','English'),('sci','Science'),
        ('bio','Biology'),('phy','Physics'),('chem','Chemistry'),
        ('geo','Geography'),('hist','History'),('other','Other'),
    ]
    subject      = models.CharField(max_length=20, choices=SUBJECT_CHOICES)
    topic        = models.CharField(max_length=200)
    text         = models.TextField()
    image = CloudinaryField(
    'image',
    folder='questions',
    overwrite=False,
    unique_filename=True,
    blank=True,
    null=True
    )
    # for MCQ this is A/B/C/D, for typed this is the expected answer text
    correct_text_answer = models.TextField(blank=True)
    solution_description = models.TextField(blank=True)  # admin explanation
    created_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at   = models.DateTimeField(auto_now_add=True)

class QuestionChoice(models.Model):
    question    = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='choices')
    label       = models.CharField(max_length=1)   # A B C D
    text        = models.CharField(max_length=500)
    is_correct  = models.BooleanField(default=False)

class Assessment(models.Model):
    TYPE_CHOICES = [
        ('test','Test'),
        ('assignment','Weekly Assignment'),
        ('assessment','Weekly Assessment'),
    ]
    ANSWER_TYPE_CHOICES = [
        ('mcq','Multiple Choice'),
        ('typed','Typed Answer'),
        ('typed_with_image','Typed + Image Upload'),
    ]
    title           = models.CharField(max_length=255)
    type            = models.CharField(max_length=20, choices=TYPE_CHOICES)
    answer_type     = models.CharField(max_length=20, choices=ANSWER_TYPE_CHOICES, default='mcq')
    subject         = models.CharField(max_length=20)
    instructions    = models.TextField(blank=True)
    target_class    = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='assessments')
    questions       = models.ManyToManyField(QuestionBank, blank=True)
    num_questions   = models.IntegerField(default=10)
    randomise       = models.BooleanField(default=True)
    randomise_values= models.BooleanField(default=False)
    duration_minutes= models.IntegerField(null=True, blank=True)
    start_datetime  = models.DateTimeField(null=True, blank=True)
    end_datetime    = models.DateTimeField(null=True, blank=True)
    show_results    = models.BooleanField(default=False)
    show_solution   = models.BooleanField(default=False)
    is_active       = models.BooleanField(default=True)
    created_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.type})"

class StudentAssessment(models.Model):
    student         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    assessment      = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    questions_order = models.JSONField(default=list)   # shuffled question IDs per student
    started_at      = models.DateTimeField(null=True, blank=True)
    submitted_at    = models.DateTimeField(null=True, blank=True)
    score           = models.FloatField(null=True, blank=True)
    is_submitted    = models.BooleanField(default=False)

    class Meta:
        unique_together = ('student', 'assessment')

class StudentAnswer(models.Model):
    student_assessment = models.ForeignKey(StudentAssessment, on_delete=models.CASCADE, related_name='answers')
    question           = models.ForeignKey(QuestionBank, on_delete=models.CASCADE)
    selected_choice    = models.ForeignKey(QuestionChoice, null=True, blank=True, on_delete=models.SET_NULL)
    typed_answer       = models.TextField(blank=True)
    uploaded_image = CloudinaryField(
    'image',
    folder='answers',
    overwrite=False,
    unique_filename=True,
    blank=True,
    null=True
    )
    is_correct         = models.BooleanField(null=True, blank=True)
    marks_awarded      = models.FloatField(default=0)
    admin_feedback     = models.TextField(blank=True)
    reviewed           = models.BooleanField(default=False)
