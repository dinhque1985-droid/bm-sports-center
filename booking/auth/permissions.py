from functools import wraps
from django.http import JsonResponse
from booking.models import UserProfile

def require_role(*allowed_roles):

    def decorator(view_func):

        @wraps(view_func)
        def wrapper(
            request,
            *args,
            **kwargs
        ):

            # ===== LOGIN CHECK =====
            if not request.user.is_authenticated:

                return JsonResponse(
                    {
                        "error": "Unauthorized"
                    },
                    status=401
                )

            # ===== SAFE ROLE GET =====
            profile, _ = UserProfile.objects.get_or_create(
                user=request.user
            )

            role = profile.role

            # ===== ROLE CHECK =====
            if role not in allowed_roles:

                return JsonResponse(
                    {
                        "error": "Forbidden",
                        "required": list(
                            allowed_roles
                        ),
                        "current": role,
                    },
                    status=403
                )

            # ===== PASS =====
            return view_func(
                request,
                *args,
                **kwargs
            )

        return wrapper

    return decorator