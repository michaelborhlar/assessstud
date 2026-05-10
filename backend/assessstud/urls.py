from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/classes/', include('classes.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/content/', include('content.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)