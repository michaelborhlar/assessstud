from rest_framework import serializers
from .models import QuestionBank, QuestionChoice, Assessment, StudentAssessment, StudentAnswer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionChoice
        fields = ['id', 'label', 'text', 'is_correct']

class ChoiceStudentSerializer(serializers.ModelSerializer):
    # hides is_correct for students
    class Meta:
        model = QuestionChoice
        fields = ['id', 'label', 'text']

class QuestionSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = QuestionBank
        fields = ['id', 'subject', 'topic', 'text', 'image', 'choices', 'correct_text_answer', 'solution_description', 'created_at']
    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

class QuestionStudentSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    choices = ChoiceStudentSerializer(many=True, read_only=True)
    class Meta:
        model = QuestionBank
        fields = ['id', 'subject', 'topic', 'text', 'image', 'choices']
    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'

class AssessmentListSerializer(serializers.ModelSerializer):
    target_class_name = serializers.SerializerMethodField()
    class Meta:
        model = Assessment
        fields = ['id','title','type','answer_type','subject','target_class',
                  'target_class_name','start_datetime','end_datetime',
                  'duration_minutes','is_active','show_results','created_at']
    def get_target_class_name(self, obj):
        return obj.target_class.name

class StudentAssessmentSerializer(serializers.ModelSerializer):
    assessment = AssessmentListSerializer(read_only=True)
    class Meta:
        model = StudentAssessment
        fields = '__all__'

class StudentAnswerSerializer(serializers.ModelSerializer):
    uploaded_image = serializers.SerializerMethodField()
    selected_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = StudentAnswer
        fields = [
            'id',
            'question',
            'selected_choice',
            'selected_choice_text',
            'typed_answer',
            'uploaded_image',
            'is_correct',
            'marks_awarded',
            'admin_feedback',
            'reviewed',
        ]

    def get_uploaded_image(self, obj):
        if obj.uploaded_image:
            return obj.uploaded_image.url
        return None

    def get_selected_choice_text(self, obj):
        if obj.selected_choice:
            return obj.selected_choice.text
        return None
