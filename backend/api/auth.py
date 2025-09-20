from django.contrib.auth.backends import BaseBackend
from types import SimpleNamespace
from django.db import connection

class _UserLite(SimpleNamespace):
    """
    Lightweight user object with the attributes DRF expects.
    """
    def __bool__(self):         # so 'if request.user:' works
        return True

    @property
    def is_authenticated(self):  # DRF & Django check this property
        return True


class MemberBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        return None   # handled by sign‑in procedure

    def get_user(self, member_id):
        if member_id is None:
            return None   # middleware will swap in AnonymousUser()

        with connection.cursor() as cur:
            cur.execute(
                "SELECT mid, is_admin, fname, lname "
                "FROM members WHERE mid = %s",
                (member_id,),
            )
            row = cur.fetchone()

        if row is None:
            return None

        # Return a fully‑featured user object
        return _UserLite(
            id=row[0],
            first_name=row[2],
            last_name=row[3],
            is_staff=bool(row[1]),     # admin flag
            is_superuser=False,
            is_active=True,            # required by SessionAuthentication
        )
