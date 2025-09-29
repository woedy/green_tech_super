from rest_framework.routers import DefaultRouter

from .views import QuoteMessageViewSet, QuoteViewSet


router = DefaultRouter()
router.register('quotes', QuoteViewSet, basename='quote')
router.register(r'quotes/(?P<quote_pk>[^/.]+)/messages', QuoteMessageViewSet, basename='quote-message')

urlpatterns = router.urls
