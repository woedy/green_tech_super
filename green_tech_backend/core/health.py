"""
Health check views for the Green Tech Africa backend.
"""
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
import redis
from channels.layers import get_channel_layer


def health_check(request):
    """
    Basic health check endpoint.
    Returns system status and connectivity information.
    """
    status = {
        'status': 'healthy',
        'database': 'unknown',
        'redis': 'unknown',
        'websockets': 'unknown',
        'version': '1.0.0'
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        status['database'] = 'healthy'
    except Exception as e:
        status['database'] = f'unhealthy: {str(e)}'
        status['status'] = 'unhealthy'
    
    # Check Redis connection
    try:
        if hasattr(settings, 'CELERY_BROKER_URL'):
            redis_client = redis.from_url(settings.CELERY_BROKER_URL)
            redis_client.ping()
            status['redis'] = 'healthy'
    except Exception as e:
        status['redis'] = f'unhealthy: {str(e)}'
    
    # Check WebSocket channel layer
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            status['websockets'] = 'healthy'
        else:
            status['websockets'] = 'not configured'
    except Exception as e:
        status['websockets'] = f'unhealthy: {str(e)}'
    
    return JsonResponse(status)