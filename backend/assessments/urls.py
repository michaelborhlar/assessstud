from django.urls import path
from . import views

urlpatterns = [
    # admin
    path('questions/', views.QuestionListCreateView.as_view()),
    path('questions/bulk-upload/', views.BulkUploadQuestionsView.as_view()),
    path('', views.AssessmentListCreateView.as_view()),
    path('answers/<int:answer_id>/review/', views.AdminReviewAnswerView.as_view()),
    path('questions/<int:question_id>/delete/', views.QuestionDeleteView.as_view()),
    path('<int:assessment_id>/delete/', views.AssessmentDeleteView.as_view()),
    path('<int:assessment_id>/extend-deadline/', views.AdminExtendDeadlineView.as_view()),   # NEW
    path('session/<int:session_id>/redo/', views.AdminRedoSubmissionView.as_view()),         # NEW
    path('class-rankings/<int:class_id>/', views.ClassRankingsView.as_view()),  # ← add this
    # student
    path('my/', views.StudentAssessmentListView.as_view()),
    path('<int:assessment_id>/start/', views.StartAssessmentView.as_view()),
    path('session/<int:session_id>/submit/', views.SubmitAssessmentView.as_view()),
    path('my/overall/', views.StudentOverallScoreView.as_view()),
    path('<int:assessment_id>/submissions/', views.AssessmentSubmissionsView.as_view()),
]