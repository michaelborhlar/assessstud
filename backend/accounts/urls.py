from django.urls import path
from . import views

urlpatterns = [
    path('register/student/', views.RegisterStudentView.as_view()),
    path('register/admin/',   views.RegisterAdminView.as_view()),
    path('login/',            views.LoginView.as_view()),
    path('me/',               views.MeView.as_view()),
]