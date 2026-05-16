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
            qs = LearningContent.objects.filter(
                created_by=user
            ).order_by('-created_at')
        else:
            if not user.student_class:
                return Response([])
            qs = LearningContent.objects.filter(
                target_class=user.student_class,
                is_visible=True
            ).order_by('-created_at')
        return Response(
            LearningContentSerializer(
                qs, many=True, context={'request': request}
            ).data
        )

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)

        from classes.models import Class

        # validate target_class
        target_class_id = request.data.get('target_class')
        if not target_class_id:
            return Response({'error': 'target_class is required'}, status=400)

        try:
            cls = Class.objects.get(id=target_class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=404)

        # validate title
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'error': 'title is required'}, status=400)

        # handle is_visible — comes as string from FormData
        is_visible_raw = request.data.get('is_visible', 'true')
        if isinstance(is_visible_raw, bool):
            is_visible = is_visible_raw
        else:
            is_visible = str(is_visible_raw).lower() in ('true', '1', 'yes')

        # handle video_url — must be valid or empty
        video_url = request.data.get('video_url', '').strip()

        try:
            c = LearningContent.objects.create(
                title=title,
                description=request.data.get('description', ''),
                subject=request.data.get('subject', ''),
                video_url=video_url,
                video_file=request.FILES.get('video_file'),
                target_class=cls,
                is_visible=is_visible,
                created_by=request.user
            )
        except Exception as e:
            return Response({'error': str(e)}, status=500)

        return Response(
            LearningContentSerializer(c, context={'request': request}).data,
            status=201
        )

    def patch(self, request, content_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            c = LearningContent.objects.get(
                id=content_id, created_by=request.user
            )
        except LearningContent.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # handle is_visible as string or bool
        is_visible_raw = request.data.get('is_visible', c.is_visible)
        if isinstance(is_visible_raw, bool):
            c.is_visible = is_visible_raw
        else:
            c.is_visible = str(is_visible_raw).lower() in ('true', '1', 'yes')

        c.save()
        return Response(
            LearningContentSerializer(c, context={'request': request}).data
        )

    def delete(self, request, content_id):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            c = LearningContent.objects.get(
                id=content_id, created_by=request.user
            )
            c.delete()
            return Response({'message': 'Deleted'}, status=200)
        except LearningContent.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
