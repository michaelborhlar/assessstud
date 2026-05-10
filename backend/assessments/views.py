import random
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import QuestionBank, QuestionChoice, Assessment, StudentAssessment, StudentAnswer
from .serializers import (QuestionSerializer, QuestionStudentSerializer,
                           AssessmentSerializer, AssessmentListSerializer,
                           StudentAssessmentSerializer, StudentAnswerSerializer)

def is_admin(user):
    return user.role == 'admin'

# ── Question Bank ──────────────────────────────────────────
class QuestionListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        qs = QuestionBank.objects.filter(created_by=request.user)
        return Response(QuestionSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        q = QuestionBank.objects.create(
            subject=request.data.get('subject'),
            topic=request.data.get('topic', ''),
            text=request.data.get('text'),
            image=request.FILES.get('image'),
            created_by=request.user
        )
        # handle choices
        choices_raw = request.data.get('choices', '[]')
        if isinstance(choices_raw, str):
            import json
            choices_raw = json.loads(choices_raw)
        for c in choices_raw:
            QuestionChoice.objects.create(
                question=q, label=c['label'],
                text=c['text'], is_correct=c.get('is_correct', False)
            )
        return Response(QuestionSerializer(q, context={'request': request}).data, status=201)

# ── Assessments (admin) ────────────────────────────────────
class AssessmentListCreateView(APIView):
    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        qs = Assessment.objects.filter(created_by=request.user).order_by('-created_at')
        return Response(AssessmentListSerializer(qs, many=True).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        data = request.data
        from classes.models import Class
        try:
            cls = Class.objects.get(id=data.get('target_class'))
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=404)

        a = Assessment.objects.create(
            title=data.get('title'),
            type=data.get('type'),
            answer_type=data.get('answer_type', 'mcq'),
            subject=data.get('subject', ''),
            instructions=data.get('instructions', ''),
            target_class=cls,
            num_questions=int(data.get('num_questions', 10)),
            randomise=data.get('randomise', True),
            randomise_values=data.get('randomise_values', False),
            duration_minutes=data.get('duration_minutes') or None,
            start_datetime=data.get('start_datetime') or None,
            end_datetime=data.get('end_datetime') or None,
            show_results=data.get('show_results', False),
            show_solution=data.get('show_solution', False),
            is_active=data.get('is_active', True),
            created_by=request.user
        )
        q_ids = data.get('question_ids', [])
        if q_ids:
            a.questions.set(QuestionBank.objects.filter(id__in=q_ids))
        return Response(AssessmentSerializer(a).data, status=201)

# ── Student: see available assessments ────────────────────
class StudentAssessmentListView(APIView):
    def get(self, request):
        student = request.user
        if not student.student_class:
            return Response([])
        assessments = Assessment.objects.filter(
            target_class=student.student_class,
            is_active=True
        ).order_by('-created_at')
        result = []
        for a in assessments:
            sa, _ = StudentAssessment.objects.get_or_create(
                student=student, assessment=a
            )
            result.append({
                'assessment': AssessmentListSerializer(a).data,
                'is_submitted': sa.is_submitted,
                'score': sa.score,
                'started_at': sa.started_at,
            })
        return Response(result)

# ── Student: start & get questions ────────────────────────
class StartAssessmentView(APIView):
    def post(self, request, assessment_id):
        student = request.user
        try:
            a = Assessment.objects.get(id=assessment_id)
        except Assessment.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # check time range
        now = timezone.now()
        if a.end_datetime and now > a.end_datetime:
            return Response({'error': 'This assessment has closed.'}, status=403)
        if a.start_datetime and now < a.start_datetime:
            return Response({'error': 'This assessment has not started yet.'}, status=403)

        sa, created = StudentAssessment.objects.get_or_create(student=student, assessment=a)
        if sa.is_submitted:
            return Response({'error': 'Already submitted.'}, status=400)

        if not sa.started_at:
            sa.started_at = now

        # assign unique random questions if not yet assigned
        if not sa.questions_order:
            all_qs = list(a.questions.values_list('id', flat=True))
            random.shuffle(all_qs)
            sa.questions_order = all_qs[:a.num_questions]

        sa.save()

        questions = QuestionBank.objects.filter(id__in=sa.questions_order)
        # re-order to match student's assigned order
        q_map = {q.id: q for q in questions}
        ordered = [q_map[qid] for qid in sa.questions_order if qid in q_map]

        return Response({
            'session_id': sa.id,
            'duration_minutes': a.duration_minutes,
            'answer_type': a.answer_type,
            'questions': QuestionStudentSerializer(ordered, many=True, context={'request': request}).data
        })

# ── Student: submit answers ────────────────────────────────
class SubmitAssessmentView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, session_id):
        try:
            sa = StudentAssessment.objects.get(id=session_id, student=request.user)
        except StudentAssessment.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if sa.is_submitted:
            return Response({'error': 'Already submitted'}, status=400)

        answers = request.data.get('answers', {})
        if isinstance(answers, str):
            import json
            answers = json.loads(answers)

        correct = 0
        total = 0
        for q_id_str, ans_data in answers.items():
            try:
                q = QuestionBank.objects.get(id=int(q_id_str))
            except QuestionBank.DoesNotExist:
                continue

            student_ans = StudentAnswer(student_assessment=sa, question=q)

            if sa.assessment.answer_type == 'mcq':
                choice_id = ans_data.get('choice_id')
                if choice_id:
                    try:
                        ch = QuestionChoice.objects.get(id=choice_id)
                        student_ans.selected_choice = ch
                        student_ans.is_correct = ch.is_correct
                        if ch.is_correct:
                            correct += 1
                    except QuestionChoice.DoesNotExist:
                        pass
                total += 1
            elif sa.assessment.answer_type == 'typed':
                student_ans.typed_answer = ans_data.get('text', '')
                student_ans.is_correct = None  # manual review
            elif sa.assessment.answer_type == 'typed_with_image':
                student_ans.typed_answer = ans_data.get('text', '')
                img_key = f"image_{q_id_str}"
                if img_key in request.FILES:
                    student_ans.uploaded_image = request.FILES[img_key]
                student_ans.is_correct = None

            student_ans.save()

        sa.is_submitted = True
        sa.submitted_at = timezone.now()
        if sa.assessment.answer_type == 'mcq' and total > 0:
            sa.score = round(correct / total * 100, 1)
        sa.save()

        show = sa.assessment.show_results
        return Response({
            'submitted': True,
            'score': sa.score if show else None,
            'show_results': show,
        })

# ── Admin: review typed answers ───────────────────────────
class AdminReviewAnswerView(APIView):
    def patch(self, request, answer_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            ans = StudentAnswer.objects.get(id=answer_id)
        except StudentAnswer.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        ans.is_correct = request.data.get('is_correct', None)
        ans.marks_awarded = request.data.get('marks_awarded', 0)
        ans.admin_feedback = request.data.get('admin_feedback', '')
        ans.reviewed = True
        ans.save()
        return Response(StudentAnswerSerializer(ans).data)

# ── Admin: get all submissions for an assessment ──────────
class AssessmentSubmissionsView(APIView):
    def get(self, request, assessment_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        sessions = StudentAssessment.objects.filter(
            assessment_id=assessment_id, is_submitted=True
        ).select_related('student')
        data = []
        for s in sessions:
            data.append({
                'session_id': s.id,
                'student': f"{s.student.first_name} {s.student.last_name}",
                'student_class': s.student.student_class.name if s.student.student_class else '',
                'score': s.score,
                'submitted_at': s.submitted_at,
                'answers': StudentAnswerSerializer(s.answers.all(), many=True).data
            })
        return Response(data)