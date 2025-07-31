from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from django.db import connection
from .db import call_procedure, DBError  

class EnrollSerializer(serializers.Serializer):
    section_id = serializers.IntegerField(min_value=1)



class SignupSerializer(serializers.Serializer):
    fname          = serializers.CharField(max_length=100)
    lname          = serializers.CharField(max_length=100)
    national_id    = serializers.CharField(max_length=20)
    birthday       = serializers.DateField()
    username       = serializers.CharField(max_length=150)
    password       = serializers.CharField(write_only=True, min_length=8, max_length=59)

    def create(self, validated):
        """
        Hash the plaintext password and call the DB procedure.
        """
        from .db import call_procedure, DBError   # your helper from earlier

        hashed = make_password(validated.pop("password"))  # bcrypt by default
        try:
            rows = call_procedure(
                "add_member_with_credentials",
                (
                    False,                              # p_is_admin
                    validated["fname"],
                    validated["lname"],
                    validated["national_id"],
                    validated["birthday"],
                    validated["username"],
                    hashed,
                ),
            )
        except DBError as e:
            # map DB errors to serializer errors
            raise serializers.ValidationError({"detail": e.msg})

        # procedure returns a single row with one column (member_id)
        return {"member_id": rows[0][0]}
    


# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from django.db import connection

class SignInSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    # will hold {"member_id": "...", "is_admin": True/False}
    def validate(self, data):
        username = data["username"]
        password = data["password"]

        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT c.member_id, m.is_admin, c.password_hash
                FROM   credentials c
                JOIN   members     m ON m.mid = c.member_id
                WHERE  c.username = %s
                """,
                (username,),
            )
            row = cur.fetchone()

        if row is None or not check_password(password, row[2]):
            raise serializers.ValidationError("Invalid credentials")

        return {"member_id": row[0], "is_admin": bool(row[1])}





class SemesterCreateSerializer(serializers.Serializer):
    start_date  = serializers.DateField()
    end_date    = serializers.DateField()
    sem_title   = serializers.CharField(max_length=30)
    is_active   = serializers.BooleanField()     # true → new active

    def validate(self, data):
        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError("start_date must be before end_date")
        return data

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_semester",
                (
                    validated["start_date"],
                    validated["end_date"],
                    validated["sem_title"],
                    validated["is_active"],
                ),
            )
        except DBError as e:
            raise serializers.ValidationError({"detail": e.msg})

        # procedure returns one row with the new UUID
        return {"sid": rows[0][0]}

class DepartmentCreateSerializer(serializers.Serializer):
    department_name = serializers.CharField(max_length=150)
    location        = serializers.CharField(max_length=200, allow_blank=True)

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_department",
                (
                    validated["department_name"],
                    validated["location"],
                ),
            )
        except DBError as e:
            # Stored proc raises SQLSTATE‑45000 for “name already exists”
            raise serializers.ValidationError({"detail": e.msg})

        # procedure returns one row with did
        return {"did": rows[0][0]}
    

class MajorCreateSerializer(serializers.Serializer):
    major_name       = serializers.CharField(max_length=150)
    department_name  = serializers.CharField(max_length=150)

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_major",
                (
                    validated["major_name"],
                    validated["department_name"],
                ),
            )
        except DBError as e:
            # 45000 messages from add_major:
            # • "department_name not found"
            # • "major_name already exists"
            raise serializers.ValidationError({"detail": e.msg})

        return {"major_id": rows[0][0]}
    

class StudentRecordCreateSerializer(serializers.Serializer):
    national_id = serializers.CharField(max_length=20)
    major_name  = serializers.CharField(max_length=150)

    def create(self, validated):
        try:
            rows = call_procedure(
                "register_student",
                (
                    validated["national_id"],
                    validated["major_name"],
                ),
            )
        except DBError as e:
            # possible 45000 messages:
            #  • 'No member with that national_id'
            #  • 'No such major'
            #  • 'Student already registered for this major'
            #  • 'No active semester defined'
            raise serializers.ValidationError({"detail": e.msg})

        # procedure returns record_id + entrance_sem
        return {"record_id": rows[0][0], "entrance_sem": rows[0][1]}
    

class SemesterListSerializer(serializers.ListSerializer):
    """
    Serializer is trivial here—just map SQL tuples → dicts.
    """
    def to_representation(self, data):
        # `data` is the list of tuples returned by call_procedure
        return [
            {
                "sid":        row[0],
                "start_date": row[1],
                "end_date":   row[2],
                "sem_title":  row[3],
                "is_active":  bool(row[4]),
            }
            for row in data
        ]
    
class DepartmentListSerializer(serializers.ListSerializer):
    """
    Serializer is trivial here—just map SQL tuples → dicts.
    """
    def to_representation(self, data):
        # `data` is the list of tuples returned by call_procedure
        return [
            {
                "did":        row[0],
                "department_name": row[1],
                "location": row[2],
            }
            for row in data
        ]
    
class MajorListSerializer(serializers.ListSerializer):
    """
    Serializer is trivial here—just map SQL tuples → dicts.
    """
    def to_representation(self, data):
        # `data` is the list of tuples returned by call_procedure
        return [
            {
                "major_id":        row[0],
                "major_name": row[1],
                "department_name": row[2],
            }
            for row in data
        ]
    

class StaffRoleCreateSerializer(serializers.Serializer):
    national_id      = serializers.CharField(max_length=20)
    department_name  = serializers.CharField(max_length=150)
    staff_role       = serializers.ChoiceField(
        choices=["INSTRUCTOR", "CLERK", "CHAIR", "ADMIN", "PROF"]
    )
    start_date       = serializers.DateField()
    end_date         = serializers.DateField(allow_null=True, required=False)

    def validate(self, data):
        if data.get("end_date") and data["end_date"] <= data["start_date"]:
            raise serializers.ValidationError("end_date must be after start_date")
        return data

    def create(self, validated):
        try:
            rows = call_procedure(
                "assign_staff_role",
                (
                    validated["national_id"],
                    validated["department_name"],
                    validated["staff_role"],
                    validated["start_date"],
                    validated.get("end_date"),
                ),
            )
        except DBError as e:
            raise serializers.ValidationError({"detail": e.msg})

        return {
            "staff_id":       rows[0][0],
            "department_id":  rows[0][1],
            "staff_role":     validated["staff_role"],
            "start_date":     validated["start_date"],
            "end_date":       validated.get("end_date"),
        }
    
class StaffPromoteSerializer(serializers.Serializer):
    national_id = serializers.CharField(max_length=20)

    def create(self, validated):
        try:
            rows = call_procedure(
                "promote_member_to_staff",
                (validated["national_id"],),
            )
        except DBError as e:
            # • 'No member with that national_id'
            raise serializers.ValidationError({"detail": e.msg})

        return {"staff_id": rows[0][0]}     # the UUID returned by procedure
    

class CourseCreateSerializer(serializers.Serializer):
    course_code = serializers.CharField(max_length=20)
    course_name = serializers.CharField(max_length=200)

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_course",
                (
                    validated["course_name"],
                    validated["course_code"],
                    
                ),
            )
        except DBError as e:
            # 'course_code already exists'  or  'course_name already exists'
            raise serializers.ValidationError({"detail": e.msg})

        return {"cid": rows[0][0]}
class PresentedCourseCreateSerializer(serializers.Serializer):
    prof_national_id = serializers.CharField(max_length=20)
    course_name      = serializers.CharField(max_length=200)
    sem_title        = serializers.CharField(max_length=30)
    capacity         = serializers.IntegerField(min_value=1)
    max_capacity     = serializers.IntegerField(min_value=1)
    on_days          = serializers.CharField(max_length=15)
    on_times         = serializers.CharField(max_length=20)
    room_label       = serializers.CharField(max_length=50, allow_null=True, required=False)

    def validate(self, data):
        if data["capacity"] > data["max_capacity"]:
            raise serializers.ValidationError("capacity cannot exceed max_capacity")
        return data

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_presented_course",
                (
                    validated["prof_national_id"],
                    validated["course_name"],
                    validated["sem_title"],
                    validated["capacity"],
                    validated["max_capacity"],
                    validated["on_days"],
                    validated["on_times"],
                    validated.get("room_label"),
                ),
            )
        except DBError as e:
            raise serializers.ValidationError({"detail": e.msg})

        return {"pcid": rows[0][0]}
    

class RoomCreateSerializer(serializers.Serializer):
    room_label = serializers.CharField(max_length=50)
    capacity   = serializers.IntegerField(min_value=1)

    def create(self, validated):
        try:
            rows = call_procedure(
                "add_room",
                (validated["room_label"], validated["capacity"]),
            )
        except DBError as e:
            # 45000 messages: 'capacity must be > 0', 'room_label already exists'
            raise serializers.ValidationError({"detail": e.msg})

        return {"rid": rows[0][0]}
    

class StudentSemesterCreateSerializer(serializers.Serializer):
    record_id = serializers.CharField(max_length=36)

    def create(self, validated):
        try:
            rows = call_procedure("add_student_semester", (validated["record_id"],))
        except DBError as e:
            # 'No active semester' or 'Student semester already exists'
            raise serializers.ValidationError({"detail": e.msg})

        return {
            "record_id":   validated["record_id"],
            "semester_id": rows[0][0],
        }   


VALID_ROLES = ["INSTRUCTOR", "CLERK", "CHAIR", "ADMIN", "PROF"]

class StaffByRoleQuerySerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=VALID_ROLES)

    def fetch(self):
        role = self.validated_data["role"]
        try:
            rows = call_procedure("list_staff_by_role", (role,))
        except DBError as e:
            # Only 'Invalid staff_role' possible here, already filtered by ChoiceField
            raise serializers.ValidationError({"detail": e.msg})

        # rows: (staff_id, fname, lname, role, department_name)
        return [
            {
                "staff_id": row[0],
                "fname":    row[1],
                "lname":    row[2],
                "role":     row[3],
                "department_name": row[4],
            }
            for row in rows
        ]
    
class CourseItemSerializer(serializers.Serializer):
    cid         = serializers.CharField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()

class PresentedCourseListQuerySerializer(serializers.Serializer):
    semester_id   = serializers.CharField(max_length=36)
    department_id = serializers.CharField(max_length=36)

    def fetch(self):
        try:
            rows = call_procedure(
                "list_presented_courses",
                (
                    self.validated_data["semester_id"],
                    self.validated_data["department_id"],
                ),
            )
        except DBError as e:
            raise serializers.ValidationError({"detail": e.msg})

        return [
            {
                "pcid":          r[0],
                "course_code":   r[1],
                "course_name":   r[2],
                "professor":     r[3],
                "on_days":       r[4],
                "on_times":      r[5],
                "room":          r[6],
                "capacity":      r[7],
                "max_capacity":  r[8],
            }
            for r in rows
        ]
    
class TakenCourseCreateSerializer(serializers.Serializer):
    record_id   = serializers.CharField(max_length=36)
    semester_id = serializers.CharField(max_length=36)
    pcid        = serializers.CharField(max_length=36)
    status      = serializers.ChoiceField(
        choices=["RESERVED", "TAKING", "COMPLETED"],
        default="RESERVED"
    )

    def create(self, validated):
        try:
            call_procedure(
                "add_taken_course_tx",
                (
                    validated["record_id"],
                    validated["semester_id"],
                    validated["pcid"],
                    validated["status"],
                ),
            )
        except DBError as e:
            raise serializers.ValidationError({"detail": e.msg})
        return validated