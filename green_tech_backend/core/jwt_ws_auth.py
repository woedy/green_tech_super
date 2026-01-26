from __future__ import annotations

from urllib.parse import parse_qs

from channels.auth import AuthMiddlewareStack


class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        params = parse_qs(query_string)
        token = None
        if "token" in params and params["token"]:
            token = params["token"][0]

        if token:
            user = await self._get_user(token)
            if user is not None:
                scope["user"] = user

        return await self.inner(scope, receive, send)

    @staticmethod
    async def _get_user(raw_token: str):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model

            User = get_user_model()
            access = AccessToken(raw_token)
            user_id = access.get("user_id")
            if not user_id:
                return None
            user = await User.objects.aget(pk=user_id)
            return user
        except Exception:
            return None


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(AuthMiddlewareStack(inner))
