from django.utils.deprecation import MiddlewareMixin
from django.utils.functional import SimpleLazyObject

class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.audit_user = getattr(request, 'user', None)
        request.audit_ip = request.META.get('REMOTE_ADDR')
        request.audit_user_agent = request.META.get('HTTP_USER_AGENT', '')
        return None

    def process_view(self, request, view_func, view_args, view_kwargs):
        user = getattr(request, 'audit_user', None)
        if not user or not user.is_authenticated:
            return None
            
        from django.db import models
        models.Model._current_user = SimpleLazyObject(lambda: user)
        models.Model._current_ip = request.audit_ip
        models.Model._current_user_agent = request.audit_user_agent
        
        return None
