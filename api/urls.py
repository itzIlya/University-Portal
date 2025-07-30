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
    path("semesters", SemesterView.as_view(), name="semester-create"),
    path("departments", DepartmentView.as_view(), name="department-create"),
    path("majors", MajorView.as_view(), name="major-create"),
    path("student-records", StudentRecordCreateView.as_view(), name="student-record-create"),
]
