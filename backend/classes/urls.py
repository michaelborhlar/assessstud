from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClassListView.as_view()),
    path('<int:class_id>/students/', views.ClassStudentsView.as_view()),
]