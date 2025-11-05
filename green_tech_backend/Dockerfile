FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and stdout buffering
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build dependencies for psycopg2 and other compiled wheels
RUN apt-get update && \
    apt-get install -y --no-install-recommends bash build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker/entrypoint.sh

ENV DJANGO_SETTINGS_MODULE=core.settings

ENTRYPOINT ["./docker/entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
