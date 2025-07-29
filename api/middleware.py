# api/middleware.py
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model

class MemberSessionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        member_id = request.session.get("member_id")
        request.user = None
        if member_id:
            from api.auth import MemberBackend
            request.user = MemberBackend().get_user(member_id)
        if request.user is None:
            from django.contrib.auth.models import AnonymousUser
            request.user = AnonymousUser()
