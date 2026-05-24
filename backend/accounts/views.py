from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import (RegisterStudentSerializer, RegisterAdminSerializer,
                           LoginSerializer, UserSerializer)

User = get_user_model()

class RegisterStudentView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = RegisterStudentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(UserSerializer(user).data, status=201)

class RegisterAdminView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = RegisterAdminSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(UserSerializer(user).data, status=201)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(s.validated_data)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class StudentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        class_id = request.query_params.get('class_id')
        students = User.objects.filter(role='student')
        if class_id:
            students = students.filter(student_class_id=class_id)
        students = students.order_by('first_name')
        return Response(UserSerializer(students, many=True).data)

class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            user = User.objects.get(id=user_id)
            if user.id == request.user.id:
                return Response({'error': 'You cannot delete your own account'}, status=400)
            user.delete()
            return Response({'message': 'Account deleted'}, status=200)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class AdminListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        admins = User.objects.filter(role='admin').order_by('first_name')
        return Response(UserSerializer(admins, many=True).data)

class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        from classes.models import Class
        total_students = User.objects.filter(role='student').count()
        total_admins = User.objects.filter(role='admin').count()
        per_class = []
        for cls in Class.objects.all():
            per_class.append({
                'class': cls.name,
                'count': cls.students.filter(role='student').count()
            })
        return Response({
            'total_students': total_students,
            'total_admins': total_admins,
            'per_class': per_class
        })
      
class VisitorLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)

        try:
            from .models import VisitorLog
            from django.db.models import Count
            from django.utils.timezone import now, timedelta
            from django.db.models.functions import TruncDate

            days = int(request.query_params.get('days', 7))
            since = now() - timedelta(days=days)
            logs = VisitorLog.objects.filter(visited_at__gte=since)

            total = logs.count()
            unique = logs.values('ip_address').distinct().count()

            per_day_qs = (
                logs.annotate(date=TruncDate('visited_at'))
                .values('date')
                .annotate(count=Count('id'))
                .order_by('date')
            )
            per_day = [
                {
                    'date': str(item['date']) if item['date'] else None,
                    'count': item['count']
                }
                for item in per_day_qs
            ]

            top_pages = list(
                logs.values('path')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            )

            recent_qs = (
                logs.select_related('user')
                .order_by('-visited_at')[:50]
            )
            recent = [
                {
                    'ip_address': v.ip_address,
                    'path': v.path,
                    'visited_at': v.visited_at.isoformat() if v.visited_at else None,
                    'user__first_name': v.user.first_name if v.user else None,
                    'user__last_name': v.user.last_name if v.user else None,
                    'user__username': v.user.username if v.user else None,
                }
                for v in recent_qs
            ]

            return Response({
                'total_visits': total,
                'unique_visitors': unique,
                'per_day': per_day,
                'top_pages': top_pages,
                'recent': recent,
            })

        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'detail': traceback.format_exc()
            }, status=500)
