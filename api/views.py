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