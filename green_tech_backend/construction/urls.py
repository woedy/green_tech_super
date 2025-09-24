"""
URL configuration for the construction app.
"""
from django.urls import path, include

# API URLs
urlpatterns = [
    # Include the API URLs
    path('api/', include('construction.api.urls')),
]

# Add Swagger/OpenAPI documentation if needed
# from rest_framework_swagger.views import get_swagger_view
# schema_view = get_swagger_view(title='Construction API')
# urlpatterns += [
#     path('api/docs/', schema_view),
# ]
