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
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = QuestionBank
        fields = ['id', 'subject', 'topic', 'text', 'image', 'choices', 'created_at']

class QuestionStudentSerializer(serializers.ModelSerializer):
    choices = ChoiceStudentSerializer(many=True, read_only=True)
    class Meta:
        model = QuestionBank
        fields = ['id', 'subject', 'topic', 'text', 'image', 'choices']

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
    class Meta:
        model = StudentAnswer
        fields = '__all__'