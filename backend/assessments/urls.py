from django.urls import path
from . import views

urlpatterns = [
    # admin
    path('questions/', views.QuestionListCreateView.as_view()),
    path('', views.AssessmentListCreateView.as_view()),
    path('<int:assessment_id>/submissions/', views.AssessmentSubmissionsView.as_view()),
    path('answers/<int:answer_id>/review/', views.AdminReviewAnswerView.as_view()),
    # student
    path('my/', views.StudentAssessmentListView.as_view()),
    path('<int:assessment_id>/start/', views.StartAssessmentView.as_view()),
    path('session/<int:session_id>/submit/', views.SubmitAssessmentView.as_view()),
]