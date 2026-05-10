from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Class
from .serializers import ClassSerializer, StudentInClassSerializer

class ClassListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(ClassSerializer(Class.objects.all(), many=True).data)

class ClassStudentsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, class_id):
        try:
            cls = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        students = cls.students.filter(role='student')
        return Response(StudentInClassSerializer(students, many=True).data)