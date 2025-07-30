from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import *
from django.middleware import csrf
from rest_framework.permissions import IsAdminUser

@api_view(["GET"])
def ping(request):
    return Response({"pong": True})

class EnrollView(APIView):
    def post(self, request, student_id: int):
        ser = EnrollSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            call_procedure("enroll_student",
                           (student_id, ser.validated_data["section_id"]))
        except DBError as e:
            return Response({"detail": e.msg}, status=e.status)
        return Response(status=status.HTTP_201_CREATED)

class TranscriptView(APIView):
    def get(self, request, student_id: int):
        try:
            rows = call_procedure("get_transcript", (student_id,))
        except DBError as e:
            return Response({"detail": e.msg}, status=e.status)
        payload = [
            {"course_code": r[0], "term": r[1],
             "grade": float(r[2]) if r[2] is not None else None}
            for r in rows
        ]
        return Response(payload)



class SignupView(APIView):  
    """
    POST /signup
    Body: {fname, lname, national_id, birthday, username, password}
    """

    permission_classes = []           # public endpoint

    def post(self, request):
        ser = SignupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()           # calls the procedure
        return Response(result, status=status.HTTP_201_CREATED)
    

class SignInView(APIView):
    permission_classes = []  # public

    def post(self, request):
        ser = SignInSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        member_id = ser.validated_data["member_id"]
        is_admin  = ser.validated_data["is_admin"]

        # mark session
        request.session["member_id"] = member_id
        request.session.set_expiry(60 * 60 * 24 * 7)   # 7 days

        # set CSRF token cookie
        token = csrf.get_token(request)
        resp = Response(
            {"signed_in": True, "is_admin": is_admin},  # ← include flag
            status=status.HTTP_200_OK
        )
        resp.set_cookie(
            "csrftoken", token,
            max_age=60 * 60 * 24 * 7,
            httponly=False, secure=False, samesite="Lax"
        )
        return resp


class SignOutView(APIView):
    """
    POST /signout  → deletes session
    """
    permission_classes = [permissions.IsAuthenticated]  # see custom backend below

    def post(self, request):
        request.session.flush()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class SemesterView(APIView):
    """
    GET  /api/semesters   → list
    POST /api/semesters   → create (admin)
    """
    # default permissions; we’ll override per method
    permission_classes = [permissions.IsAuthenticated]

    # ----- helper: choose permissions per HTTP verb -------------
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    # --------------------- GET ----------------------------------
    def get(self, request):
        rows = call_procedure("list_semesters", ())
        serializer = SemesterListSerializer(child=serializers.DictField())  # ← child
        data = serializer.to_representation(rows)
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        ser = SemesterCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response(result, status=status.HTTP_201_CREATED)
    

class DepartmentView(APIView):
    """
    POST /departments
    Body: { "department_name": "Mathematics", "location": "Building B" }
    """
   
    permission_classes     = [IsAdminUser]  # only admins

    def post(self, request):
        ser = DepartmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response(result, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        rows = call_procedure("list_departments", ())
        serializer = DepartmentListSerializer(child=serializers.DictField())  # ← child
        data = serializer.to_representation(rows)
        return Response(data, status=status.HTTP_200_OK)
    

class MajorView(APIView):
    """
    POST /api/majors
    Body:
    {
      "major_name":      "Software Engineering",
      "department_name": "Computer Science"
    }
    """
    permission_classes = [permissions.IsAdminUser]    # admin‑only

    def post(self, request):
        ser = MajorCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()                   # {"major_id": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        rows = call_procedure("list_majors", ())
        serializer = MajorListSerializer(child=serializers.DictField())  # ← child
        data = serializer.to_representation(rows)
        return Response(data, status=status.HTTP_200_OK)
    

    
class StudentRecordCreateView(APIView):
    """
    POST /api/student-records
    Body:
    {
      "national_id": "X123456789",
      "major_name":  "Software Engineering"
    }
    """
    permission_classes = [permissions.IsAdminUser]     # admin action

    def post(self, request):
        ser = StudentRecordCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()              # {"record_id": "...", "entrance_sem": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    

class SemesterListView(APIView):
    """
    GET /api/semesters
    Response: list of semester objects
    """
    permission_classes = [permissions.AllowAny]  # or IsAuthenticated

    def get(self, request):
        rows = call_procedure("list_semesters", ())
        serializer = SemesterListSerializer()
        data = serializer.to_representation(rows)
        return Response(data, status=status.HTTP_200_OK)
    
class StaffRoleCreateView(APIView):
    """
    POST /api/staff-roles
    {
      "national_id":     "X123456789",
      "department_name": "Computer Science",
      "staff_role":      "PROF",
      "start_date":      "2025-08-01",
      "end_date":        null
    }
    """
    permission_classes = [permissions.IsAdminUser]   # admin‑only

    def post(self, request):
        ser = StaffRoleCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response(result, status=status.HTTP_201_CREATED)
    
class StaffPromoteView(APIView):
    """
    POST /api/staff
    Body: { "national_id": "X123456789" }
    Promotes an existing member to staff (idempotent).
    """
    permission_classes = [permissions.IsAdminUser]   # admin‑only

    def post(self, request):
        ser = StaffPromoteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()               # {"staff_id": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    
class CourseCreateView(APIView):
    """
    POST /api/courses
    Body: { "course_name": "Calculus I" }
    """
    permission_classes = [permissions.IsAdminUser]   # admin‑only

    def post(self, request):
        ser = CourseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()      # {"cid": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    
class PresentedCourseCreateView(APIView):
    """
    POST /api/presented-courses
    {
      "prof_national_id": "X123456789",
      "course_name":      "Algorithms",
      "sem_title":        "2025‑Fall",
      "capacity":         30,
      "max_capacity":     40,
      "on_days":          "MWF",
      "on_times":         "10:00-11:15",
      "room_label":       "A‑101"   // optional
    }
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = PresentedCourseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()              # {"pcid": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    
class RoomView(APIView):

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = RoomCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()              # {"pcid": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    
class StudentSemesterCreateView(APIView):
    """
    POST /api/student-semesters
    { "record_id": "c0f2…uuid…" }

    • Auth required (session)
    • Checks that the given student_record belongs to the logged‑in member
    • Calls stored proc to create exactly one ACTIVE row for the current semester
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        record_id = request.data.get("record_id")

        # ---------- ownership check ---------------------------------
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM std_records WHERE record_id=%s AND mid=%s",
                (record_id, request.user.id),
            )
            if cur.fetchone() is None:
                return Response(
                    {"detail": "You do not own this student record"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # ---------- proceed to stored procedure ---------------------
        ser = StudentSemesterCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()           # {"record_id": "...", "semester_id": "..."}
        return Response(result, status=status.HTTP_201_CREATED)