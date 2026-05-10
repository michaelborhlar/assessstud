from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import LearningContent
from .serializers import LearningContentSerializer

def is_admin(user):
    return user.role == 'admin'

class LearningContentView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        if is_admin(user):
            qs = LearningContent.objects.filter(created_by=user).order_by('-created_at')
        else:
            if not user.student_class:
                return Response([])
            qs = LearningContent.objects.filter(
                target_class=user.student_class, is_visible=True
            ).order_by('-created_at')
        return Response(LearningContentSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        from classes.models import Class
        cls = Class.objects.get(id=request.data.get('target_class'))
        c = LearningContent.objects.create(
            title=request.data.get('title'),
            description=request.data.get('description', ''),
            subject=request.data.get('subject', ''),
            video_url=request.data.get('video_url', ''),
            video_file=request.FILES.get('video_file'),
            target_class=cls,
            is_visible=request.data.get('is_visible', True),
            created_by=request.user
        )
        return Response(LearningContentSerializer(c, context={'request': request}).data, status=201)

    def patch(self, request, content_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            c = LearningContent.objects.get(id=content_id, created_by=request.user)
        except LearningContent.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        c.is_visible = request.data.get('is_visible', c.is_visible)
        c.save()
        return Response(LearningContentSerializer(c).data)