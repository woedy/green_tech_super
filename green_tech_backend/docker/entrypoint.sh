#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

# Default to running migrations once container starts unless explicitly skipped.
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  python manage.py migrate --noinput
fi

# Collect static assets when requested (usually in production deployments).
if [ "${DJANGO_COLLECTSTATIC:-0}" = "1" ]; then
  python manage.py collectstatic --noinput
fi

exec "$@"
