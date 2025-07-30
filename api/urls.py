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
    path("staff", StaffPromoteView.as_view(), name="staff-promote"),
    path("staff-roles", StaffRoleCreateView.as_view(), name="staff-role-create"),
    path("courses", CourseCreateView.as_view(), name="course-create"),
    path("presented-courses", PresentedCourseCreateView.as_view(), name="presented-course-create"),
    path("rooms", RoomView.as_view(), name="room-create"),
    path("student-semesters", StudentSemesterCreateView.as_view(), name="student-semester-create"),

]
