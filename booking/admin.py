from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Booking,
    PriceRule,
    MonthlyRule,
    UserProfile,
    NewsPost,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "role",
    )

    list_filter = (
        "role",
    )

    search_fields = (
        "user__username",
    )

    ordering = (
        "user__username",
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):

    # ===== LIST =====
    list_display = (
        "id",
        "court",
        "customer",
        "date",
        "time_range",
        "status",
        "paid"
    )

    # ===== FILTER =====
    list_filter = (
        "court",
        "date",
        "paid",
    )

    # ===== SEARCH =====
    search_fields = (
        "customer",
        "court"
    )

    # ===== ORDER =====
    ordering = ("-date", "start")

    # ===== CLICK ROW =====
    list_display_links = ("id", "customer")

    # ===== FORMAT TIME =====
    def time_range(self, obj):
        return f"{obj.start} → {obj.end}"
    time_range.short_description = "Thời gian"

    # ===== STATUS =====
    def status(self, obj):
        from datetime import datetime

        now = datetime.now()
        now_min = now.hour * 60 + now.minute

        if obj.start > now_min:
            return "Chưa chơi"
        elif obj.start <= now_min <= obj.end:
            return "Đang chơi"
        return "Đã chơi"

    status.short_description = "Trạng thái"


@admin.register(PriceRule)
class PriceRuleAdmin(admin.ModelAdmin):

    list_display = (
        "court_type",
        "start_minute",
        "end_minute",
        "day_of_week",
        "price_per_hour",
        "rule_type",
        "is_active"
    )

    list_filter = ("court_type", "rule_type", "day_of_week", "is_active")

    ordering = ("court_type", "start_minute")

# booking/admin.py


@admin.register(MonthlyRule)
class MonthlyRuleAdmin(admin.ModelAdmin):

    list_display = (
        "court_type",
        "start",
        "end",
        "pricing_factor",
        "is_active",
    )

    list_filter = (
        "court_type",
        "is_active",
    )
    search_fields = ("court_type",)
    ordering = ("court_type", "start")


# =========================================
# NEWS POST ADMIN
# =========================================
@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):

    # ===== LIST =====
    list_display = (
        "id",
        "title",
        "preview_image",
        "pinned_badge",
        "active_badge",
        "created_by",
        "created_at",
        "updated_at",
    )

    # ===== FILTER =====
    list_filter = (
        "is_pinned",
        "is_active",
        "created_at",
        "updated_at",
    )

    # ===== SEARCH =====
    search_fields = (
        "title",
        "content",
        "created_by__username",
    )

    # ===== SORT =====
    ordering = (
        "-is_pinned",
        "-created_at",
    )

    # ===== READONLY =====
    readonly_fields = (
        "created_at",
        "updated_at",
        "image_preview_large",
    )

    # ===== FORM LAYOUT =====
    fieldsets = (

        (
            "📰 Nội dung bản tin",
            {
                "fields": (
                    "title",
                    "content",
                )
            }
        ),

        (
            "🖼 Hình ảnh",
            {
                "fields": (
                    "image",
                    "image_preview_large",
                )
            }
        ),

        (
            "📌 Trạng thái",
            {
                "fields": (
                    "is_pinned",
                    "is_active",
                )
            }
        ),

        (
            "👤 Quản trị",
            {
                "fields": (
                    "created_by",
                    "created_at",
                    "updated_at",
                )
            }
        ),
    )

    # ===== PAGINATION =====
    list_per_page = 20

    # =====================================
    # AUTO SET CREATOR
    # =====================================
    def save_model(
        self,
        request,
        obj,
        form,
        change
    ):

        # only set creator first time
        if not obj.pk and not obj.created_by:
            obj.created_by = request.user

        super().save_model(
            request,
            obj,
            form,
            change
        )


    # =====================================
    # BADGES
    # =====================================
    @admin.display(
        description="📌 Ghim"
    )
    def pinned_badge(
        self,
        obj
    ):

        if obj.is_pinned:
            return format_html(
                '<span style="color:white; background:#1976d2; padding:4px 8px; border-radius:999px;">PINNED</span>'
            )

        return format_html(
            '<span style="color:#666;">—</span>'
        )


    @admin.display(
        description="👁 Hiển thị"
    )
    def active_badge(
        self,
        obj
    ):

        if obj.is_active:
            return format_html(
                '<span style="color:white; background:#2e7d32; padding:4px 8px; border-radius:999px;">ACTIVE</span>'
            )

        return format_html(
            '<span style="color:white; background:#c62828; padding:4px 8px; border-radius:999px;">HIDDEN</span>'
        )


    # =====================================
    # IMAGE PREVIEW (LIST)
    # =====================================
    @admin.display(
        description="🖼 Ảnh"
    )
    def preview_image(
        self,
        obj
    ):

        if obj.image:
            return format_html(
                '<img src="{}" style="height:48px; width:auto; border-radius:6px;" />',
                obj.image.url
            )

        return "—"


    # =====================================
    # IMAGE PREVIEW (DETAIL)
    # =====================================
    @admin.display(
        description="Preview"
    )
    def image_preview_large(
        self,
        obj
    ):

        if obj.pk and obj.image:
            return format_html(
                '''
                <div style="margin-top:10px;">
                    <img
                        src="{}"
                        style="
                            max-height:220px;
                            max-width:100%;
                            border-radius:12px;
                            box-shadow:0 4px 14px rgba(0,0,0,0.15);
                        "
                    />
                </div>
                ''',
                obj.image.url
            )

        return "Chưa có ảnh"


# =========================================
# ADMIN SITE CUSTOM (OPTIONAL V1 BRANDING)
# =========================================
admin.site.site_header = "BM_Sport Admin"
admin.site.site_title = "BM_Sport Admin Portal"
admin.site.index_title = "Quản trị hệ thống BM_Sport"