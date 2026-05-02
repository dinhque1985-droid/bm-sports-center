from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from booking import views
from django.views.generic import RedirectView


urlpatterns = [
    # ===== ADMIN =====
    path('admin/', admin.site.urls),
    path("favicon.ico", RedirectView.as_view(url="/static/favicon.png")),

    # ===== APP ROUTES =====
    path('', include('booking.urls')),

    # ===== API =====
    path("api/blocks/", views.get_blocks),           # GET
    path("api/blocks/create/", views.create_block),  # POST
]


# ===== STATIC & MEDIA (DEV ONLY) =====
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)