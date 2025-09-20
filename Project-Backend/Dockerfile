# ---------- build stage (tiny) ----------
FROM python:3.12-slim AS builder
WORKDIR /install
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ---------- runtime stage ---------------
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# system deps for mysqlclient / PyMySQL TLS
RUN apt-get update && apt-get install -y \
        default-libmysqlclient-dev gcc wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /install /usr/local
COPY . /app

EXPOSE 8071
CMD ["python", "manage.py", "runserver", "0.0.0.0:8071"]
