from django.urls import path
from . import views

urlpatterns = [
    path('', views.LearningContentView.as_view()),
    path('<int:content_id>/', views.LearningContentView.as_view()),
]