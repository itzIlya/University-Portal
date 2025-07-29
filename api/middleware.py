from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from api.auth import MemberBackend

class MemberSessionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        member_id = request.session.get("member_id")
        user_obj  = MemberBackend().get_user(member_id)
        request.user = user_obj if user_obj else AnonymousUser()
