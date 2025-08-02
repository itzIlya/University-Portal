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
    #path("staff", StaffPromoteView.as_view(), name="staff-promote"),

    path("courses", CourseView.as_view(), name="courses"),
    path("presented-courses/create", PresentedCourseCreateView.as_view(), name="presented-course-create"),
    path("presented-courses", PresentedCourseListView.as_view(), name="presented-course-list"),
    path("student-semesters", StudentSemesterCreateView.as_view(), name="student-semester-create"),
    path("taken-courses", TakenCourseView.as_view(), name="taken-course"),

    path(
            "presented-courses/<uuid:pcid>/students",
            SectionStudentListView.as_view(),
            name="section-student-list",
        ),

    path("rooms", RoomView.as_view(), name="room-create"),

    
    path("staff", StaffView.as_view(), name="staff-endpoint"),
    path("members", MemberListView.as_view(), name="member-list"),
    
    path("admin/<str:resource>/<uuid:pk>",
     GenericAdminDeleteView.as_view(),
     name="admin-generic-delete"
     ),

    path("my-presented-courses",
     MyPresentedCourseListView.as_view(),
     name="my-presented-courses"
     ),
    path("grades", GradeUpdateView.as_view(), name="grade-update"),

    path("my-courses", RecordCourseListView.as_view(), name="record-course-list"),

    path(
        "semesters/<uuid:sid>/deactivate",
        SemesterDeactivateView.as_view(),
        name="semester-deactivate",
    ),
    path("taken-courses/status", StatusUpdateView.as_view(), name="course-status-update"),
    path("staff-roles", StaffRoleView.as_view(), name="staff-roles"),
]
