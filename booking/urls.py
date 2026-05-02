# booking/urls.py

from django.urls import path
from . import views


urlpatterns = [

    # ===== PAGE =====
    path(
        "",
        views.schedule_view,
        name="schedule"
    ),

    # ===== BOOKINGS API =====
    path(
        "api/bookings/",
        views.booking_list,
        name="booking_list"
    ),

    path(
        "api/bookings/<int:booking_id>/",
        views.booking_detail,
        name="booking_detail"
    ),

    # ===== BLOCKS API =====
    path(
        "api/blocks/",
        views.get_blocks,
        name="get_blocks"
    ),

    path(
        "api/blocks/create/",
        views.create_block,
        name="create_block"
    ),

    path(
        "api/blocks/<int:block_id>/",
        views.block_detail,
        name="block_detail"
    ),

    # ===== BOOKING REQUEST API =====
    path(
        "api/booking-requests/",
        views.booking_request_list,
        name="booking_request_list"
    ),

    path(
        "api/booking-requests/<int:request_id>/approve/",
        views.approve_booking_request_view,
        name="approve_booking_request"
    ),

    path(
        "api/booking-requests/<int:request_id>/reject/",
        views.reject_booking_request_view,
        name="reject_booking_request"
    ),

    path(
        "api/test-admin/",
        views.test_admin_only,
        name="test_admin_only"
    ),

    # ===== NEWS PAGE =====
    path(
        "news/",
        views.news_page,
        name="news_page"
    ),

    # ===== NEWS API =====
    path(
        "api/news/",
        views.news_list_api,
        name="news_list_api"
    ),

    path(
        "api/news/create/",
        views.news_create_api,
        name="news_create_api"
    ),

    path(
        "api/news/<int:post_id>/",
        views.news_detail_api,
        name="news_detail_api"
    ),

    path(
        "api/news/<int:post_id>/update/",
        views.news_update_api,
        name="news_update_api"
    ),

    path(
        "api/news/<int:post_id>/delete/",
        views.news_delete_api,
        name="news_delete_api"
    ),

    path(
        "api/news/<int:post_id>/toggle-active/",
        views.news_toggle_active_api,
        name="news_toggle_active_api"
    ),

    path(
        "api/news/<int:post_id>/toggle-pin/",
        views.news_toggle_pin_api,
        name="news_toggle_pin_api"
    ),
]