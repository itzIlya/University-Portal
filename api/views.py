from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import EnrollSerializer
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
