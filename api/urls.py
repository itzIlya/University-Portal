from django.urls import path
from .views import *

urlpatterns = [
    path("ping", ping),
    path("students/<int:student_id>/enrollments", EnrollView.as_view()),
    path("students/<int:student_id>/transcript", TranscriptView.as_view()),
    ######################################################################
    path("signup", SignupView.as_view(), name="signup"),
    path("signin", SignInView.as_view()),
    path("signout", SignOutView.as_view()),
]
