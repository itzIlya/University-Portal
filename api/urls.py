from django.urls import path
from .views import ping, EnrollView, TranscriptView

urlpatterns = [
    path("ping", ping),
    path("students/<int:student_id>/enrollments", EnrollView.as_view()),
    path("students/<int:student_id>/transcript", TranscriptView.as_view()),
]
