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
from .parsers import parse_bulk_questions

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
            correct_text_answer=request.data.get('correct_text_answer', ''),
            solution_description=request.data.get('solution_description', ''),
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

class BulkUploadQuestionsView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        if not file.name.endswith('.docx'):
            return Response({'error': 'File must be a .docx Word document'}, status=400)

        try:
            questions = parse_bulk_questions(file)
        except Exception as e:
            return Response({'error': f'Failed to parse file: {str(e)}'}, status=400)

        if not questions:
            return Response({'error': 'No questions found in file. Check your format.'}, status=400)

        created = []
        errors = []

        for i, q in enumerate(questions):
            try:
                question = QuestionBank.objects.create(
                    subject=q.get('subject', 'other'),
                    topic=q.get('topic', ''),
                    text=q.get('text', ''),
                    correct_text_answer=q.get('correct_text_answer', ''),
                    solution_description=q.get('solution', ''),
                    created_by=request.user
                )
                choices = q.get('choices', [])
                for c in choices:
                    QuestionChoice.objects.create(
                        question=question,
                        label=c['label'],
                        text=c['text'],
                        is_correct=c['is_correct']
                    )
                created.append({
                    'id': question.id,
                    'text': question.text[:60]
                })
            except Exception as e:
                errors.append(f'Question {i+1}: {str(e)}')

        return Response({
            'created': len(created),
            'errors': errors,
            'questions': created
        }, status=201)

class QuestionDeleteView(APIView):
    def delete(self, request, question_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        try:
            question = QuestionBank.objects.get(
                id=question_id,
                created_by=request.user
            )
        except QuestionBank.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)

        question.delete()

        return Response({'message': 'Question deleted successfully'})

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

class AssessmentDeleteView(APIView):
    def delete(self, request, assessment_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        try:
            assessment = Assessment.objects.get(
                id=assessment_id,
                created_by=request.user
            )
        except Assessment.DoesNotExist:
            return Response({'error': 'Assessment not found'}, status=404)

        assessment.delete()

        return Response({'message': 'Assessment deleted successfully'})

# ── Student: see available assessments ────────────────────
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
            try:
                sa = StudentAssessment.objects.get(student=student, assessment=a)
                result.append({
                    'assessment': AssessmentListSerializer(a).data,
                    'is_submitted': sa.is_submitted,
                    'score': sa.score,
                    'started_at': sa.started_at,
                })
            except StudentAssessment.DoesNotExist:
                result.append({
                    'assessment': AssessmentListSerializer(a).data,
                    'is_submitted': False,
                    'score': None,
                    'started_at': None,
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

        # total questions assigned to student
        total = len(sa.questions_order)
        breakdown = []
        has_image_upload = False

        for q_id_str, ans_data in answers.items():
            try:
                q = QuestionBank.objects.get(id=int(q_id_str))
            except QuestionBank.DoesNotExist:
                continue

            student_ans = StudentAnswer(student_assessment=sa, question=q)
            is_correct = None
            

            if sa.assessment.answer_type == 'mcq':
                choice_id = ans_data.get('choice_id')
                if choice_id:
                    try:
                        ch = QuestionChoice.objects.get(id=choice_id)
                        student_ans.selected_choice = ch
                        is_correct = ch.is_correct
                        if is_correct:
                            correct += 1
                    except QuestionChoice.DoesNotExist:
                        pass

            elif sa.assessment.answer_type == 'typed':
                typed = ans_data.get('text', '').strip().lower()
                expected = q.correct_text_answer.strip().lower()
                if expected and typed:
                    is_correct = typed == expected
                    if is_correct:
                        correct += 1
                else:
                    is_correct = None  # no correct answer set — manual review
                student_ans.typed_answer = ans_data.get('text', '')

            elif sa.assessment.answer_type == 'typed_with_image':
                # always manual review for image uploads
                student_ans.typed_answer = ans_data.get('text', '')
                img_key = f"image_{q_id_str}"
                if img_key in request.FILES:
                    student_ans.uploaded_image = request.FILES[img_key]
                is_correct = None
                has_image_upload = True

            student_ans.is_correct = is_correct
            student_ans.marks_awarded = 1 if is_correct else 0
            student_ans.save()

            your_answer = ''

            if sa.assessment.answer_type == 'mcq':
                choice_id = ans_data.get('choice_id')

                if choice_id:
                    try:
                        selected_choice = QuestionChoice.objects.get(id=choice_id)
                        your_answer = selected_choice.text
                    except QuestionChoice.DoesNotExist:
                        your_answer = ''

            elif sa.assessment.answer_type in ['typed', 'typed_with_image']:
                your_answer = ans_data.get('text', '')

            breakdown.append({
                'question_id': q.id,
                'question_text': q.text,
                'your_answer': your_answer,
                'correct_answer': q.correct_text_answer if sa.assessment.answer_type == 'typed' else None,
                'solution': q.solution_description,
                'is_correct': is_correct,
            })

        # score only if fully auto-gradeable
        can_auto_score = sa.assessment.answer_type != 'typed_with_image'
        score_pct = round(correct / total * 100, 1) if (can_auto_score and total > 0) else None

        sa.is_submitted = True
        sa.submitted_at = timezone.now()
        sa.score = score_pct
        sa.save()

        show = sa.assessment.show_results or can_auto_score

        return Response({
            'submitted': True,
            'score': score_pct,
            'correct': correct,
            'total': total,
            'show_results': show,
            'has_image_upload': has_image_upload,
            'breakdown': breakdown,
            'show_solution': sa.assessment.show_solution,
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

        # update answer review
        ans.is_correct = request.data.get('is_correct', None)
        ans.marks_awarded = request.data.get('marks_awarded', 0)
        ans.admin_feedback = request.data.get('admin_feedback', '')
        ans.reviewed = True
        ans.save()

        # recalculate total score for the student assessment
        sa = ans.student_assessment

        total_questions = len(sa.questions_order)

        correct_answers = sa.answers.filter(
            is_correct=True
        ).count()

        score_pct = round(
            (correct_answers / total_questions) * 100,
            1
        ) if total_questions > 0 else 0

        sa.score = score_pct
        sa.save()

        return Response({
            'message': 'Reviewed successfully',
            'new_score': sa.score,
            'answer': StudentAnswerSerializer(ans).data
        })

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
    
class StudentOverallScoreView(APIView):
    def get(self, request):
        student = request.user

        if not student.student_class:
            return Response({'error': 'No class assigned'}, status=400)

        now = timezone.now()

        all_assessments = Assessment.objects.filter(
            target_class=student.student_class,
            is_active=True
        ).order_by('created_at')

        total_assessments = all_assessments.count()

        if total_assessments == 0:
            return Response({
                'total_assessments': 0,
                'submitted': 0,
                'pending': 0,
                'missed': 0,
                'overall_score': 0,
                'breakdown': []
            })

        breakdown = []

        total_score = 0

        submitted_count = 0
        pending_count = 0
        missed_count = 0

        for a in all_assessments:

            try:
                sa = StudentAssessment.objects.get(
                    student=student,
                    assessment=a
                )

                if sa.is_submitted:

                    score = sa.score if sa.score is not None else 0

                    submitted_count += 1
                    total_score += score

                    breakdown.append({
                        'id': a.id,
                        'title': a.title,
                        'type': a.type,
                        'subject': a.subject,
                        'score': score,
                        'status': 'submitted',
                        'submitted_at': sa.submitted_at,
                    })

                else:

                    is_expired = (
                        a.end_datetime and now > a.end_datetime
                    )

                    if is_expired:

                        missed_count += 1

                        breakdown.append({
                            'id': a.id,
                            'title': a.title,
                            'type': a.type,
                            'subject': a.subject,
                            'score': 0,
                            'status': 'missed',
                            'submitted_at': None,
                        })

                    else:

                        pending_count += 1

                        breakdown.append({
                            'id': a.id,
                            'title': a.title,
                            'type': a.type,
                            'subject': a.subject,
                            'score': None,
                            'status': 'pending',
                            'submitted_at': None,
                        })

            except StudentAssessment.DoesNotExist:

                is_expired = (
                    a.end_datetime and now > a.end_datetime
                )

                if is_expired:

                    missed_count += 1

                    breakdown.append({
                        'id': a.id,
                        'title': a.title,
                        'type': a.type,
                        'subject': a.subject,
                        'score': 0,
                        'status': 'missed',
                        'submitted_at': None,
                    })

                else:

                    pending_count += 1

                    breakdown.append({
                        'id': a.id,
                        'title': a.title,
                        'type': a.type,
                        'subject': a.subject,
                        'score': None,
                        'status': 'pending',
                        'submitted_at': None,
                    })

        overall_score = round(
            total_score / total_assessments,
            1
        )

        type_stats = {}

        for item in breakdown:

            t = item['type']

            if t not in type_stats:
                type_stats[t] = {
                    'total': 0,
                    'score_sum': 0,
                    'submitted': 0,
                    'pending': 0,
                    'missed': 0
                }

            type_stats[t]['total'] += 1

            if item['score'] is not None:
                type_stats[t]['score_sum'] += item['score']

            if item['status'] == 'submitted':
                type_stats[t]['submitted'] += 1

            elif item['status'] == 'pending':
                type_stats[t]['pending'] += 1

            elif item['status'] == 'missed':
                type_stats[t]['missed'] += 1

        type_summary = []

        for t, stats in type_stats.items():

            average = round(
                stats['score_sum'] / stats['total'],
                1
            )

            type_summary.append({
                'type': t,
                'total': stats['total'],
                'submitted': stats['submitted'],
                'pending': stats['pending'],
                'missed': stats['missed'],
                'average': average,
            })

        return Response({
            'total_assessments': total_assessments,
            'submitted': submitted_count,
            'pending': pending_count,
            'missed': missed_count,
            'overall_score': overall_score,
            'type_summary': type_summary,
            'breakdown': breakdown,
        })

# ── Admin: redo (reset) a student submission ──────────────
class AdminRedoSubmissionView(APIView):
    def post(self, request, session_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        try:
            sa = StudentAssessment.objects.get(id=session_id)
        except StudentAssessment.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        # wipe all previous answers and reset submission state
        sa.answers.all().delete()
        sa.is_submitted = False
        sa.submitted_at = None
        sa.score = None
        sa.started_at = None
        sa.questions_order = []
        sa.save()

        return Response({
            'message': f'Submission reset for {sa.student.first_name} {sa.student.last_name}. They can now retake the assessment.'
        })


# ── Admin: extend deadline on an assessment ───────────────
class AdminExtendDeadlineView(APIView):
    def patch(self, request, assessment_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        try:
            assessment = Assessment.objects.get(id=assessment_id, created_by=request.user)
        except Assessment.DoesNotExist:
            return Response({'error': 'Assessment not found'}, status=404)

        new_end = request.data.get('end_datetime')
        if not new_end:
            return Response({'error': 'end_datetime is required'}, status=400)

        from django.utils.dateparse import parse_datetime
        parsed = parse_datetime(new_end)
        if not parsed:
            return Response({'error': 'Invalid datetime format. Use ISO 8601 e.g. 2025-06-10T23:59:00'}, status=400)

        assessment.end_datetime = parsed
        assessment.save()

        return Response({
            'message': 'Deadline extended successfully.',
            'assessment_id': assessment.id,
            'new_end_datetime': assessment.end_datetime,
        })
