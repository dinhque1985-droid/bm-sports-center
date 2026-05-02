# booking/permissions.py
# 🎯 ROLE-BASED ACCESS CONTROL

from functools import wraps
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required


def require_role(*allowed_roles):
    """
    Usage:
        @require_role("staff", "admin")
        def some_view(request):

    Rules:
        - Anonymous => 401
        - Superuser => always allowed
        - Missing profile => 403
        - Wrong role => 403
    """

    def decorator(view_func):

        @wraps(view_func)
        def wrapper(request, *args, **kwargs):

            # ===============================
            # AUTH CHECK
            # ===============================
            if not request.user.is_authenticated:

                return JsonResponse(
                    {
                        "error": "Login required"
                    },
                    status=401
                )

            # ===============================
            # SUPERUSER BYPASS
            # ===============================
            if request.user.is_superuser:

                return view_func(
                    request,
                    *args,
                    **kwargs
                )

            # ===============================
            # PROFILE CHECK
            # ===============================
            profile = getattr(
                request.user,
                "userprofile",
                None
            )

            if not profile:

                return JsonResponse(
                    {
                        "error": "User profile missing"
                    },
                    status=403
                )

            # ===============================
            # ROLE CHECK
            # ===============================
            user_role = (
                profile.role or ""
            ).strip().lower()

            normalized_allowed_roles = [
                str(role).strip().lower()
                for role in allowed_roles
            ]

            if user_role not in normalized_allowed_roles:

                return JsonResponse(
                    {
                        "error": "Permission denied",
                        "required": normalized_allowed_roles,
                        "current": user_role
                    },
                    status=403
                )

            # ===============================
            # ALLOW
            # ===============================
            return view_func(
                request,
                *args,
                **kwargs
            )

        return wrapper

    return decorator



# =========================================
# ROLE HELPERS
# =========================================
def get_user_role(user):
    """
    Standard BM_Sport role mapper
    guest / staff / admin
    """

    if not user or not user.is_authenticated:
        return "guest"

    if user.is_superuser:
        return "admin"

    if (
        user.groups
        .filter(name="staff")
        .exists()
    ):
        return "staff"

    return "guest"


def is_admin(user):
    return get_user_role(user) == "admin"


def is_staff(user):
    return get_user_role(user) in [
        "staff",
        "admin"
    ]


def is_guest(user):
    return get_user_role(user) == "guest"



# =========================================
# API RESPONSE HELPERS
# =========================================
def permission_denied_json(
    message="Bạn không có quyền thực hiện thao tác này",
    status=403
):
    return JsonResponse(
        {
            "ok": False,
            "error": message
        },
        status=status
    )


def login_required_json(
    message="Vui lòng đăng nhập"
):
    return JsonResponse(
        {
            "ok": False,
            "error": message
        },
        status=401
    )



# =========================================
# DECORATORS (WEB)
# =========================================
def admin_required(view_func):
    """
    Admin only
    """

    @wraps(view_func)
    @login_required
    def wrapper(
        request,
        *args,
        **kwargs
    ):

        if not is_admin(
            request.user
        ):
            return permission_denied_json()

        return view_func(
            request,
            *args,
            **kwargs
        )

    return wrapper



def staff_required(view_func):
    """
    Staff + Admin
    """

    @wraps(view_func)
    @login_required
    def wrapper(
        request,
        *args,
        **kwargs
    ):

        if not is_staff(
            request.user
        ):
            return permission_denied_json()

        return view_func(
            request,
            *args,
            **kwargs
        )

    return wrapper



# =========================================
# DECORATORS (PAGE)
# =========================================
def admin_page_required(view_func):
    """
    Redirect UI page
    """

    @wraps(view_func)
    @login_required
    def wrapper(
        request,
        *args,
        **kwargs
    ):

        if not is_admin(
            request.user
        ):
            return redirect("/")

        return view_func(
            request,
            *args,
            **kwargs
        )

    return wrapper



def staff_page_required(view_func):
    """
    Staff/Admin page only
    """

    @wraps(view_func)
    @login_required
    def wrapper(
        request,
        *args,
        **kwargs
    ):

        if not is_staff(
            request.user
        ):
            return redirect("/")

        return view_func(
            request,
            *args,
            **kwargs
        )

    return wrapper



# =========================================
# NEWS PERMISSIONS
# =========================================
def can_view_news(user):
    """
    Everyone can view active news
    """
    return True


def can_create_news(user):
    """
    Staff + Admin
    """
    return is_staff(user)


def can_edit_news(
    user,
    news_post=None
):
    """
    Admin:
        full edit

    Staff:
        own post only
    """

    if is_admin(user):
        return True

    if (
        is_staff(user) and
        news_post and
        news_post.created_by_id == user.id
    ):
        return True

    return False


def can_delete_news(
    user,
    news_post=None
):
    """
    Admin:
        full delete

    Staff:
        own post only
    """

    return can_edit_news(
        user,
        news_post
    )


def can_pin_news(user):
    """
    Pinning is stronger privilege:
    Admin only
    """

    return is_admin(user)



# =========================================
# REQUEST GUARD HELPERS
# =========================================
def require_news_create(
    request
):
    if not can_create_news(
        request.user
    ):
        return permission_denied_json(
            "Bạn không có quyền đăng bản tin"
        )

    return None


def require_news_edit(
    request,
    news_post
):
    if not can_edit_news(
        request.user,
        news_post
    ):
        return permission_denied_json(
            "Bạn không có quyền chỉnh sửa bản tin này"
        )

    return None


def require_news_delete(
    request,
    news_post
):
    if not can_delete_news(
        request.user,
        news_post
    ):
        return permission_denied_json(
            "Bạn không có quyền xóa bản tin này"
        )

    return None


def require_news_pin(
    request
):
    if not can_pin_news(
        request.user
    ):
        return permission_denied_json(
            "Chỉ admin mới có quyền ghim bản tin"
        )

    return None

