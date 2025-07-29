from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import EnrollSerializer, SignupSerializer, SignInSerializer
from .db import call_procedure, DBError

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
    """
    POST /signin  → sets session cookie
    """
    permission_classes = []  # public

    def post(self, request):
        ser = SignInSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        # 1. mark user as "authenticated" in the session
        request.session["member_id"] = ser.validated_data["member_id"]
        request.session.set_expiry(60 * 60 * 24 * 7)  # 7 days

        return Response({"signed_in": True}, status=status.HTTP_200_OK)


class SignOutView(APIView):
    """
    POST /signout  → deletes session
    """
    permission_classes = [permissions.IsAuthenticated]  # see custom backend below

    def post(self, request):
        request.session.flush()
        return Response(status=status.HTTP_204_NO_CONTENT)