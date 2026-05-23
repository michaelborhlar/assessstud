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

        from .models import VisitorLog
        from django.db.models import Count
        from django.utils.timezone import now, timedelta

        # filters
        days = int(request.query_params.get('days', 7))
        since = now() - timedelta(days=days)

        logs = VisitorLog.objects.filter(visited_at__gte=since)

        # total visits
        total = logs.count()

        # unique IPs
        unique = logs.values('ip_address').distinct().count()

        # visits per day
        from django.db.models.functions import TruncDate
        per_day = list(
            logs.annotate(date=TruncDate('visited_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # top pages
        top_pages = list(
            logs.values('path')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # recent visits
        recent = list(
            logs.values(
                'ip_address', 'path',
                'visited_at', 'user__first_name',
                'user__last_name', 'user__username'
            ).order_by('-visited_at')[:50]
        )

        return Response({
            'total_visits': total,
            'unique_visitors': unique,
            'per_day': per_day,
            'top_pages': top_pages,
            'recent': recent,
        })
