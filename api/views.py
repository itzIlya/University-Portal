from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import *
from django.middleware import csrf
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import PermissionDenied

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

class MyProfileView(APIView):
    """
    GET /api/me    – return personal & credential info for logged-in user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rows = call_procedure("get_member_profile", (request.user.id,))
        if not rows:
            return Response({"detail": "Profile not found"},
                            status=status.HTTP_404_NOT_FOUND)

        data = MyProfileSerializer({
            "mid":         rows[0][0],
            "fname":       rows[0][1],
            "lname":       rows[0][2],
            "national_id": rows[0][3],
            "birthday":    rows[0][4],
            "is_admin":    bool(rows[0][5]),
            "username":    rows[0][6],
            "last_login":  rows[0][7],
        }).data

        return Response(data, status=status.HTTP_200_OK)

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
    
class StaffRoleView(APIView):
    """
    POST /api/staff-roles   → create   (admin)
    PUT  /api/staff-roles   → update   (admin)
    """
    permission_classes = [permissions.IsAdminUser]

    # ---------- POST ----------
    def post(self, request):
        ser = StaffRoleCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response(result, status=status.HTTP_201_CREATED)

    # ---------- PUT ----------
    def put(self, request):
        ser = StaffRoleUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response(result, status=status.HTTP_200_OK)
    
# class StaffPromoteView(APIView):
#     """
#     POST /api/staff
#     Body: { "national_id": "X123456789" }
#     Promotes an existing member to staff (idempotent).
#     """
#     permission_classes = [permissions.IsAdminUser]   # admin‑only

#     def post(self, request):
#         ser = StaffPromoteSerializer(data=request.data)
#         ser.is_valid(raise_exception=True)
#         result = ser.save()               # {"staff_id": "..."}
#         return Response(result, status=status.HTTP_201_CREATED)
    
class CourseView(APIView):
    """
    GET  /api/courses  → list
    POST /api/courses  → create (admin)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    # ---------- GET list --------------------------------------
    def get(self, request):
        rows = call_procedure("list_courses", ())
        data = CourseItemSerializer(
            [
                {"cid": r[0],"course_code":r[1], "course_name": r[2]}
                for r in rows
            ],
            many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)

    # ---------- POST create (you already have this) -----------
    def post(self, request):
        ser = CourseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()          # {"cid": "..."}
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

    """
    GET  /api/rooms   → list (any authenticated user)
    POST /api/rooms   → create (admin)
    """
    permission_classes = [permissions.IsAuthenticated]  # default; we’ll override

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    # ---------- GET (list) ----------
    def get(self, request):
        rows = call_procedure("list_rooms", ())
        data = RoomItemSerializer(
            [
                {"rid": r[0], "room_label": r[1], "capacity": r[2]}
                for r in rows
            ],
            many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)
    
    def post(self, request):
        ser = RoomCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()              # {"pcid": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    

class StudentSemesterCreateView(APIView):
    """
    POST /api/student-semesters         – create current ACTIVE semester
    GET  /api/student-semesters?record_id=<uuid>
                                        – list all semesters for that record
    """
    permission_classes = [permissions.IsAuthenticated]

    # ---------- helper: ownership check ----------------------------
    def _owns_record(self, record_id, user_id):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM std_records WHERE record_id=%s AND mid=%s",
                (record_id, user_id),
            )
            return cur.fetchone() is not None

    # ---------- GET – list semesters -------------------------------
    def get(self, request):
        record_id = request.query_params.get("record_id")
        if not record_id:
            return Response(
                {"detail": "record_id query parameter required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.is_staff and not self._owns_record(record_id, request.user.id):
            raise PermissionDenied("You do not own this student record")

        # either call the stored procedure…
        rows = call_procedure("list_student_semesters", (record_id,))

        data = StudentSemesterItemSerializer(
            [
                {"semester_id": r[0], "sem_status": r[1], "sem_gpa": r[2]}
                for r in rows
            ],
            many=True,
        ).data
        return Response(data, status=status.HTTP_200_OK)

    # ---------- POST – create row (unchanged) ----------------------
    def post(self, request):
        record_id = request.data.get("record_id")

        if not request.user.is_staff and not self._owns_record(record_id, request.user.id):
            raise PermissionDenied("You do not own this student record")

        ser = StudentSemesterCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()          # {"record_id": "...", "semester_id": "..."}
        return Response(result, status=status.HTTP_201_CREATED)

class StaffView(APIView):
    """
    GET  /api/staff?role=PROF     -> list professors
    POST /api/staff               -> promote member to staff (admin)
    """
    permission_classes = [permissions.IsAuthenticated]

    # per‑method permissions
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    # ---------- GET staff list by role -------------------------
    def get(self, request):
        ser = StaffByRoleQuerySerializer(data=request.query_params)
        ser.is_valid(raise_exception=True)
        data = ser.fetch()            # list[dict]
        return Response(data, status=status.HTTP_200_OK)

    # ---------- POST promote member to staff -------------------
    def post(self, request):
        ser = StaffPromoteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()           # {"staff_id": "..."}
        return Response(result, status=status.HTTP_201_CREATED)
    

class PresentedCourseListView(APIView):
    """
    GET /api/presented-courses?semester_id=<sid>&department_id=<did>
 
    • Any authenticated user can call.
    • JSON array of sections that match both filters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ser = PresentedCourseListQuerySerializer(data=request.query_params)
        ser.is_valid(raise_exception=True)
        data = ser.fetch()
        return Response(data, status=status.HTTP_200_OK)
    

class TakenCourseView(APIView):
    """
    POST   /api/taken-courses   → add seat
    DELETE /api/taken-courses   → remove RESERVED seat
    """
    permission_classes = [permissions.IsAuthenticated]

    # ---- shared ownership check (non-admins) -----------------
    def _verify_ownership(self, record_id, user):
        if user.is_staff:
            return  # admins skip
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM std_records WHERE record_id=%s AND mid=%s",
                (record_id, user.id),
            )
            if cur.fetchone() is None:
                raise PermissionDenied("You do not own this student record")

    # ---------- create ----------------------------------------
    def post(self, request):
        self._verify_ownership(request.data.get("record_id"), request.user)
        ser = TakenCourseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"enrolled": True}, status=status.HTTP_201_CREATED)

    # ---------- delete RESERVED -------------------------------
    def delete(self, request):
        self._verify_ownership(request.data.get("record_id"), request.user)
        ser = TakenCourseDeleteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.delete(ser.validated_data)
        return Response({"removed": True}, status=status.HTTP_200_OK)
    

class MemberListView(APIView):
    """
    GET /api/members   (admin only)
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # 1. run stored procedure
        rows = call_procedure("list_members", ())

        # 2. map tuple→dict once, coercing is_admin to bool
        members = [
            {
                "mid":          r[0],
                "is_admin":     bool(r[1]),
                "fname":        r[2],
                "lname":        r[3],
                "national_id":  r[4],
                "birthday":     r[5],
                "username":     r[6],
                "last_login":   r[7],
            }
            for r in rows
        ]

        # 3. let DRF serializer handle final JSON output
        data = MemberItemSerializer(members, many=True).data
        return Response(data, status=status.HTTP_200_OK)
    

class GenericAdminDeleteView(APIView):
    permission_classes = [permissions.IsAdminUser]

    TABLES = {
        "courses":  ("delete_course",  "cid"),
        "members":  ("delete_member",  "mid"),
        "semesters":("delete_semester","sid"),
        "majors":   ("delete_major", "major_id"),
        # add more mappings here
    }

    def delete(self, request, resource, pk):
        if resource not in self.TABLES:
            return Response({"detail": "Unknown resource"},
                            status=status.HTTP_404_NOT_FOUND)

        proc_name, _ = self.TABLES[resource]
        try:
            call_procedure(proc_name, (pk,))
        except DBError as e:
            return Response({"detail": e.msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)
    
class SectionStudentListView(APIView):
    """
    GET /api/presented-courses/<pcid>/students
    """
    permission_classes = [permissions.IsAuthenticated]

    def _prof_owns_section(self, pcid, user_id):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT prof_id FROM presented_courses WHERE pcid=%s",
                (pcid,)
            )
            row = cur.fetchone()
        if row is None:
            return None          # section not found
        return row[0] == user_id

    def get(self, request, pcid):
        # 1. auth check
        if not request.user.is_staff:          # non-admin professor
            owns = self._prof_owns_section(pcid, request.user.id)
            if owns is None:
                return Response({"detail": "Section not found"},
                                status=status.HTTP_404_NOT_FOUND)
            if not owns:
                raise PermissionDenied("You do not teach this section")

        # 2. fetch roster
        rows = call_procedure("list_students_in_section", (pcid,))
        data = SectionStudentItemSerializer(
            [
                {
                    "student_number": r[0],
                    "record_id":      r[1],
                    "fname":          r[2],
                    "lname":          r[3],
                    "status":         r[4],
                    "grade":          r[5],
                }
                for r in rows
            ],
            many=True
        ).data

        return Response(data, status=status.HTTP_200_OK)
    

class MyPresentedCourseListView(APIView):
    """
    GET /api/my-presented-courses
        → professor:       list their own sections
        → admin:           same, or pass ?prof_id=<uuid> to inspect another
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # choose prof_id
        prof_id = request.query_params.get("prof_id")
        if prof_id:
            if not request.user.is_staff:   # only admins may override
                raise PermissionDenied("Only admins can specify prof_id")
        else:
            prof_id = request.user.id       # the logged-in professor / staff

        rows = call_procedure("list_sections_by_prof", (prof_id,))
        data = MySectionItemSerializer(
            [
                {
                    "pcid":         r[0],
                    "course_code":  r[1],
                    "course_name":  r[2],
                    "sem_title":    r[3],
                    "on_days":      r[4],
                    "on_times":     r[5],
                    "room":         r[6],
                    "capacity":     r[7],
                    "max_capacity": r[8],
                }
                for r in rows
            ],
            many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)
    
class GradeUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _prof_teaches(self, pcid, user_id):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM presented_courses WHERE pcid=%s AND prof_id=%s",
                (pcid, user_id)
            )
            return cur.fetchone() is not None

    def post(self, request):
        if not request.user.is_staff:
            if not self._prof_teaches(request.data.get("pcid"), request.user.id):
                raise PermissionDenied("You do not teach this section")

        ser = GradeUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(request.user.id)

        return Response(
            {"grade_set": True, "grade": ser.validated_data["grade"]},
            status=status.HTTP_200_OK,
        )
    

class RecordCourseListView(APIView):
    """
    GET /api/my-courses?record_id=<record>&semester_id=<sid>

    • Student: may query only their own record.
    • Admin   : may query any record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _owns_record(self, record_id, user_id):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM std_records WHERE record_id=%s AND mid=%s",
                (record_id, user_id),
            )
            return cur.fetchone() is not None

    def get(self, request):
        record_id   = request.query_params.get("record_id")
        semester_id = request.query_params.get("semester_id")

        if not record_id or not semester_id:
            return Response(
                {"detail": "record_id and semester_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # permission: non-admin must own the record
        if not request.user.is_staff and not self._owns_record(record_id, request.user.id):
            raise PermissionDenied("You do not own this student record")

        # fetch
        try:
            rows = call_procedure("list_record_courses", (record_id, semester_id))
        except DBError as e:
            return Response({"detail": e.msg}, status=status.HTTP_400_BAD_REQUEST)

        data = RecordCourseItemSerializer(
            [
                {
                    "pcid":        r[0],
                    "course_code": r[1],
                    "course_name": r[2],
                    "status":      r[3],
                    "grade":       r[4],
                    "professor":   r[5],
                    "on_days":     r[6],
                    "on_times":    r[7],
                    "room":        r[8],
                }
                for r in rows
            ],
            many=True
        ).data

        return Response(data, status=status.HTTP_200_OK)


class SemesterDeactivateView(APIView):
    """
    POST /api/semesters/<sid>/deactivate   (admin only)
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, sid):
        ser = SemesterDeactivateSerializer(data={"sid": str(sid)})  # cast here
        ser.is_valid(raise_exception=True)
        ser.save()

        # fetch the fresh end_date to return
        with connection.cursor() as cur:
            cur.execute(
                "SELECT end_date FROM semesters WHERE sid=%s",
                (sid,)
            )
            row = cur.fetchone()

        return Response(
            {"deactivated": True, "sid": sid, "end_date": row[0]},
            status=status.HTTP_200_OK,
        )

class StatusUpdateView(APIView):
    """
    POST /api/taken-courses/status
    Body: { "record_id": "...", "pcid": "...", "to_status":"TAKING" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def _prof_teaches(self, pcid, user_id):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM presented_courses WHERE pcid=%s AND prof_id=%s",
                (pcid, user_id),
            )
            return cur.fetchone() is not None

    def post(self, request):
        if not request.user.is_staff:
            if not self._prof_teaches(request.data.get("pcid"), request.user.id):
                raise PermissionDenied("You do not teach this section")

        ser = StatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(request.user.id, request.user.is_staff)

        return Response(
            {"status_changed": True, "to": "TAKING"},
            status=status.HTTP_200_OK,
        )



