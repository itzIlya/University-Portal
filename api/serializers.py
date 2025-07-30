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