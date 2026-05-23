from django.utils.timezone import now
from django.utils.deprecation import MiddlewareMixin
import re

class VisitorTrackingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # only track page-level visits, skip static/media/admin
        skip_paths = ['/static/', '/media/', '/django-admin/', '/favicon']
        if any(request.path.startswith(p) for p in skip_paths):
            return None

        # only track GET requests to API endpoints
        if request.method != 'GET':
            return None

        try:
            from .models import VisitorLog
            ip = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            path = request.path

            # get user if authenticated
            user = None
            if hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user

            VisitorLog.objects.create(
                ip_address=ip,
                path=path,
                user_agent=user_agent,
                user=user,
                visited_at=now()
            )
        except Exception:
            pass  # never break the app because of tracking

        return None

    def get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')
