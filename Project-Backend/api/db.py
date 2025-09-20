# api/db.py
from django.db import connection, DatabaseError

class DBError(Exception):
    def __init__(self, status, msg):
        self.status = status
        self.msg = msg
        super().__init__(msg)

def call_procedure(name, params=()):
    """
    Runs a stored procedure safely and returns all rows (if any).
    Works on Postgres & MySQL with positional parameters.
    """
    try:
        with connection.cursor() as cur:
            placeholders = ",".join(["%s"] * len(params))
            cur.execute(f"CALL {name}({placeholders})", params)
            try:
                rows = cur.fetchall()
            except Exception:
                rows = []
        return rows
    except DatabaseError as exc:
        msg = str(exc)
        status = 409 if "full" in msg else 404 if "exist" in msg else 400
        raise DBError(status, msg)
