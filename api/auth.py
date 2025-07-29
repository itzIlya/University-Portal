from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import AnonymousUser
from django.db import connection

class MemberBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        # we don't use this path; signup/signin handle auth
        return None

    def get_user(self, member_id):
        if member_id is None:
            return AnonymousUser()

        with connection.cursor() as cur:
            cur.execute(
                "SELECT mid, is_admin, fname, lname FROM member WHERE mid=%s",
                (member_id,),
            )
            row = cur.fetchone()

        if row is None:
            return AnonymousUser()

        # skeleton user object
        from django.contrib.auth.models import AnonymousUser
        u = AnonymousUser()
        u.id = row[0]
        u.is_staff = bool(row[1])
        u.first_name = row[2]
        u.last_name = row[3]
        return u
