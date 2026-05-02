import json
from datetime import datetime, timedelta

from django.shortcuts import (
    render,
    get_object_or_404,
)

from django.contrib.auth.decorators import (
    login_required,
)

from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from .models import Booking, CourtBlock, BookingRequest, UserProfile

from booking.services.price_engine import calculate_price
from booking.services.block_price_engine import calculate_block_price

from booking.services.booking_request_service import (
    create_booking_request,
    approve_booking_request,
    reject_booking_request,
    get_booking_requests,
)

from .permissions import (
    require_role,
    get_user_role,
    require_news_create,
    require_news_edit,
    require_news_delete,
    require_news_pin,
)

from django.http import Http404

from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)

from .models import NewsPost

from .permissions import (
    get_user_role,
    require_news_create,
    require_news_edit,
    require_news_delete,
    require_news_pin,
)

# =========================================================
# ROLE HELPERS
# =========================================================
def is_staff_or_admin(request):

    if not request.user.is_authenticated:
        return False

    if request.user.is_superuser:
        return True

    profile = getattr(
        request.user,
        "userprofile",
        None
    )

    return bool(
        profile and
        profile.role in ["staff", "admin"]
    )


# =========================================================
# CORE HELPERS
# =========================================================
def get_court_type(court_id):

    return (
        "badminton"
        if int(court_id) <= 4
        else "pickleball"
    )


def booking_to_dict(booking):

    return {
        "id": booking.id,
        "court": str(booking.court),
        "court_id": int(booking.court),

        "date": booking.date.isoformat(),

        "start": booking.start,
        "end": booking.end,

        "customer": booking.customer or "Khách",
        "phone": booking.phone or "",
        "booked_by": booking.booked_by or "",

        "paid": booking.paid,

        "price": booking.price,
    }


def block_to_dict(block):

    return {
        "id": block.id,

        "court_id": int(block.court_id),

        "date_from": block.date_from.isoformat(),
        "date_to": block.date_to.isoformat(),

        "start": block.start,
        "end": block.end,

        "reason": block.reason or "",

        "rule_type": block.rule_type or "normal",

        "pricing_factor": block.pricing_factor,

        "total_price": block.total_price,

        "price": block.total_price,
    }


def booking_request_to_dict(request_obj):

    return {
        "id": request_obj.id,

        "court": str(request_obj.court),
        "court_id": int(request_obj.court_id),

        "date": request_obj.date.isoformat(),

        "start": request_obj.start,
        "end": request_obj.end,

        "customer": request_obj.customer,
        "phone": request_obj.phone,

        "note": request_obj.note or "",

        "status": request_obj.status,

        "estimated_price": request_obj.estimated_price,

        "admin_note": request_obj.admin_note or "",

        "created_at": (
            request_obj.created_at.isoformat()
            if request_obj.created_at
            else None
        ),

        "reviewed_at": (
            request_obj.reviewed_at.isoformat()
            if request_obj.reviewed_at
            else None
        ),
    }


# =========================================================
# PAGE
# =========================================================
def schedule_view(request):

    role = "guest"

    if request.user.is_authenticated:

        profile, _ = UserProfile.objects.get_or_create(
            user=request.user
        )

        if request.user.is_superuser and profile.role != "admin":
            profile.role = "admin"
            profile.save()

        role = profile.role

    return render(
        request,
        "booking/schedule.html",
        {
            "user_role": role
        }
    )


# =========================================================
# TEST ADMIN
# =========================================================
@require_role("admin")
def test_admin_only(request):

    return JsonResponse(
        {
            "ok": True,
            "role": request.user.userprofile.role
        }
    )


# =========================================================
# BOOKING LIST
# =========================================================
@csrf_exempt
def booking_list(request):

    # ================= GET =================
    if request.method == "GET":

        date_str = request.GET.get("date")

        if not date_str:
            return JsonResponse([], safe=False)

        try:

            date_obj = datetime.strptime(
                date_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            return JsonResponse([], safe=False)

        qs = Booking.objects.filter(
            date=date_obj
        )

        data = [
            booking_to_dict(b)
            for b in qs
        ]

        return JsonResponse(
            data,
            safe=False,
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    # ================= CREATE =================
    elif request.method == "POST":

        if not is_staff_or_admin(request):

            return JsonResponse(
                {
                    "error": "Permission denied"
                },
                status=403
            )

        try:

            data = json.loads(
                request.body
            )

            booking_date = datetime.strptime(
                data["date"],
                "%Y-%m-%d"
            ).date()

            start = int(
                data["start"]
            )

            end = int(
                data["end"]
            )

            now = datetime.now()

            today = now.date()

            current_minutes = (
                now.hour * 60 +
                now.minute
            )

            if booking_date < today:

                return JsonResponse(
                    {
                        "error": "Không thể tạo booking trong quá khứ"
                    },
                    status=400
                )

            if booking_date == today and start < current_minutes:

                return JsonResponse(
                    {
                        "error": "Không thể tạo booking trong thời gian đã qua"
                    },
                    status=400
                )

            if start >= end:

                return JsonResponse(
                    {
                        "error": "Giờ không hợp lệ"
                    },
                    status=400
                )

            court_id = int(
                data.get("court_id") or
                data.get("court")
            )

            court_type = get_court_type(
                court_id
            )

            price = calculate_price(
                court_type=court_type,
                start=start,
                end=end,
                date=booking_date,
            )

            booking = Booking(
                court=court_id,
                date=booking_date,

                start=start,
                end=end,

                customer=data.get(
                    "customer",
                    "Khách"
                ),

                phone=data.get(
                    "phone",
                    ""
                ),

                booked_by=(
                    data.get("booked_by")
                    or data.get(
                        "customer",
                        "Khách"
                    )
                ),

                paid=data.get(
                    "paid",
                    False
                ),

                price=price,
            )

            booking.save()

            return JsonResponse(
                booking_to_dict(
                    booking
                ),
                json_dumps_params={
                    "ensure_ascii": False
                }
            )

        except ValidationError as err:

            return JsonResponse(
                {
                    "error": str(err)
                },
                status=400
            )

        except Exception:

            return JsonResponse(
                {
                    "error": "Invalid data"
                },
                status=400
            )

    return JsonResponse(
        {
            "error": "Method not allowed"
        },
        status=405
    )


# =========================================================
# BOOKING DETAIL
# =========================================================
@csrf_exempt
def booking_detail(request, booking_id):

    try:

        booking = Booking.objects.get(
            id=booking_id
        )

    except Booking.DoesNotExist:

        return JsonResponse(
            {
                "error": "Not found"
            },
            status=404
        )

    # ================= GET =================
    if request.method == "GET":

        return JsonResponse(
            booking_to_dict(
                booking
            ),
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    # ================= UPDATE =================
    elif request.method == "PUT":

        if not is_staff_or_admin(request):

            return JsonResponse(
                {
                    "error": "Permission denied"
                },
                status=403
            )

        try:

            data = json.loads(
                request.body
            )

            if (
                not data.get("date")
                or data.get("start") is None
                or data.get("end") is None
            ):

                return JsonResponse(
                    {
                        "error": "Missing data"
                    },
                    status=400
                )

            booking_date = datetime.strptime(
                data["date"],
                "%Y-%m-%d"
            ).date()

            start = int(
                data["start"]
            )

            end = int(
                data["end"]
            )

            now = datetime.now()

            today = now.date()

            current_minutes = (
                now.hour * 60 +
                now.minute
            )

            if booking_date < today:

                return JsonResponse(
                    {
                        "error": "Không thể sửa booking trong quá khứ"
                    },
                    status=400
                )

            if booking_date == today and start < current_minutes:

                return JsonResponse(
                    {
                        "error": "Không thể sửa booking trong thời gian đã qua"
                    },
                    status=400
                )

            if start >= end:

                return JsonResponse(
                    {
                        "error": "Giờ không hợp lệ"
                    },
                    status=400
                )

            court_id = int(
                data.get("court_id") or
                data.get("court")
            )

            booking.court = court_id
            booking.date = booking_date

            booking.start = start
            booking.end = end

            booking.price = calculate_price(
                court_type=get_court_type(
                    court_id
                ),
                start=start,
                end=end,
                date=booking_date,
            )

            booking.customer = data.get(
                "customer",
                booking.customer
            )

            booking.phone = data.get(
                "phone",
                booking.phone
            )

            booking.paid = data.get(
                "paid",
                booking.paid
            )

            booking.booked_by = data.get(
                "booked_by",
                booking.booked_by
            )

            booking.save()

            return JsonResponse(
                booking_to_dict(
                    booking
                ),
                json_dumps_params={
                    "ensure_ascii": False
                }
            )

        except ValidationError as err:

            return JsonResponse(
                {
                    "error": str(err)
                },
                status=400
            )

        except Exception:

            return JsonResponse(
                {
                    "error": "Invalid data"
                },
                status=400
            )

    # ================= DELETE =================
    elif request.method == "DELETE":

        if not is_staff_or_admin(request):

            return JsonResponse(
                {
                    "error": "Permission denied"
                },
                status=403
            )

        booking.delete()

        return JsonResponse(
            {
                "success": True
            }
        )

    return JsonResponse(
        {
            "error": "Method not allowed"
        },
        status=405
    )


# =========================================================
# BLOCK LIST
# =========================================================
def get_blocks(request):

    date_str = request.GET.get("date")

    if not date_str:
        return JsonResponse([], safe=False)

    try:

        current_date = datetime.strptime(
            date_str,
            "%Y-%m-%d"
        ).date()

    except ValueError:

        return JsonResponse([], safe=False)

    blocks = CourtBlock.objects.filter(
        date_from__lte=current_date,
        date_to__gte=current_date
    )

    data = [
        block_to_dict(b)
        for b in blocks
    ]

    return JsonResponse(
        data,
        safe=False
    )


# =========================================================
# CREATE BLOCK
# =========================================================
@csrf_exempt
@require_role("staff", "admin")
def create_block(request):

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "Method not allowed"
            },
            status=405
        )

    try:

        data = json.loads(
            request.body
        )

        date_from = datetime.strptime(
            data["date_from"],
            "%Y-%m-%d"
        ).date()

        date_to = datetime.strptime(
            data["date_to"],
            "%Y-%m-%d"
        ).date()

        start = int(
            data["start"]
        )

        end = int(
            data["end"]
        )

        court_id = int(
            data["court_id"]
        )

        factor = float(
            data.get(
                "pricing_factor",
                1.0
            )
        )

        today = datetime.today().date()

        if date_from < today:

            return JsonResponse(
                {
                    "error": "Không thể tạo block trong quá khứ"
                },
                status=400
            )

        if date_from > date_to:

            return JsonResponse(
                {
                    "error": "Khoảng ngày không hợp lệ"
                },
                status=400
            )

        if start >= end:

            return JsonResponse(
                {
                    "error": "Giờ không hợp lệ"
                },
                status=400
            )

        total_price = calculate_block_price(
            court_type=get_court_type(
                court_id
            ),
            start=start,
            end=end,

            date_from=date_from,
            date_to=date_to,

            factor=factor,

            rule_type=data.get(
                "rule_type",
                "normal"
            ),
        )

        block = CourtBlock(
            court_id=court_id,

            start=start,
            end=end,

            reason=data.get(
                "reason",
                ""
            ),

            date_from=date_from,
            date_to=date_to,

            total_price=total_price,

            rule_type=data.get(
                "rule_type",
                "normal"
            ),

            pricing_factor=factor,
        )

        block.save()

        return JsonResponse(
            block_to_dict(
                block
            ),
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    except ValidationError as err:

        return JsonResponse(
            {
                "error": str(err)
            },
            status=400
        )

    except Exception:

        return JsonResponse(
            {
                "error": "Invalid data"
            },
            status=400
        )


# =========================================================
# BLOCK DETAIL
# =========================================================
@csrf_exempt
@require_role("staff", "admin")
def block_detail(request, block_id):

    try:

        block = CourtBlock.objects.get(
            id=block_id
        )

    except CourtBlock.DoesNotExist:

        return JsonResponse(
            {
                "error": "Not found"
            },
            status=404
        )

    if request.method == "DELETE":

        try:

            date_str = request.GET.get(
                "date"
            )

            if not date_str:

                return JsonResponse(
                    {
                        "error": "Missing date"
                    },
                    status=400
                )

            current_date = datetime.strptime(
                date_str,
                "%Y-%m-%d"
            ).date()

            if current_date <= block.date_from:

                block.delete()

                return JsonResponse(
                    {
                        "type": "full"
                    }
                )

            if (
                block.date_from <
                current_date <=
                block.date_to
            ):

                block.date_to = (
                    current_date -
                    timedelta(days=1)
                )

                block.save()

                return JsonResponse(
                    {
                        "type": "partial"
                    }
                )

            return JsonResponse(
                {
                    "type": "none"
                }
            )

        except Exception as err:

            return JsonResponse(
                {
                    "error": str(err)
                },
                status=400
            )

    return JsonResponse(
        {
            "error": "Method not allowed"
        },
        status=405
    )


# =========================================================
# BOOKING REQUEST LIST
# =========================================================
@csrf_exempt
def booking_request_list(request):

    # ================= GET =================
    if request.method == "GET":

        status = request.GET.get(
            "status"
        )

        qs = get_booking_requests(
            status=status
        )

        data = [
            booking_request_to_dict(r)
            for r in qs
        ]

        return JsonResponse(
            data,
            safe=False,
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    # ================= CREATE =================
    elif request.method == "POST":

        try:

            data = json.loads(
                request.body
            )

            booking_date = datetime.strptime(
                data["date"],
                "%Y-%m-%d"
            ).date()

            request_obj = create_booking_request(
                court_id=int(
                    data.get("court_id") or
                    data.get("court")
                ),

                date=booking_date,

                start=int(
                    data["start"]
                ),

                end=int(
                    data["end"]
                ),

                customer=data.get(
                    "customer",
                    "Khách"
                ),

                phone=data.get(
                    "phone",
                    ""
                ),

                note=data.get(
                    "note",
                    ""
                ),
            )

            return JsonResponse(
                booking_request_to_dict(
                    request_obj
                ),
                json_dumps_params={
                    "ensure_ascii": False
                }
            )

        except ValidationError as err:

            return JsonResponse(
                {
                    "error": str(err)
                },
                status=400
            )

        except Exception:

            return JsonResponse(
                {
                    "error": "Invalid booking request"
                },
                status=400
            )

    return JsonResponse(
        {
            "error": "Method not allowed"
        },
        status=405
    )


# =========================================================
# APPROVE REQUEST
# =========================================================
@csrf_exempt
@require_role("staff", "admin")
def approve_booking_request_view(request, request_id):

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "Method not allowed"
            },
            status=405
        )

    try:

        result = approve_booking_request(
            request_id
        )

        return JsonResponse(
            {
                "success": True,

                "request": booking_request_to_dict(
                    result["request"]
                ),

                "booking": booking_to_dict(
                    result["booking"]
                ),
            },
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    except ValidationError as err:

        return JsonResponse(
            {
                "error": str(err)
            },
            status=400
        )

    except Exception:

        return JsonResponse(
            {
                "error": "Approve failed"
            },
            status=400
        )


# =========================================================
# REJECT REQUEST
# =========================================================
@csrf_exempt
@require_role("staff", "admin")
def reject_booking_request_view(request, request_id):

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "Method not allowed"
            },
            status=405
        )

    try:

        data = json.loads(
            request.body or "{}"
        )

        admin_note = data.get(
            "admin_note",
            ""
        ).strip()

        if not admin_note:

            return JsonResponse(
                {
                    "error": "Reject reason required"
                },
                status=400
            )

        result = reject_booking_request(
            request_id,
            admin_note=admin_note
        )

        return JsonResponse(
            {
                "success": True,

                "request": booking_request_to_dict(
                    result["request"]
                ),
            },
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    except ValidationError as err:

        return JsonResponse(
            {
                "error": str(err)
            },
            status=400
        )

    except Exception:

        return JsonResponse(
            {
                "error": "Reject failed"
            },
            status=400
        )

# =========================================================
# NEWS HELPERS
# =========================================================
def parse_bool(value):
    """
    Safe bool parser
    """

    if isinstance(value, bool):
        return value

    if value is None:
        return False

    return str(value).lower() in [
        "1",
        "true",
        "yes",
        "on",
    ]


def safe_json_body(request):
    """
    Safe JSON body parser
    """

    try:
        return json.loads(
            request.body.decode(
                "utf-8"
            )
        )

    except Exception:
        return {}


def serialize_news(post):
    """
    Standard frontend contract
    """

    return {
        "id": post.id,

        "title": post.title,

        "content": post.content,

        "short_content":
            post.short_content,

        "image_url":
            post.image.url
            if post.image
            else None,

        "is_pinned":
            post.is_pinned,

        "is_active":
            post.is_active,

        "created_by":
            post.created_by.username
            if post.created_by
            else "Unknown",

        "creator_role":
            post.creator_role,

        "created_at":
            post.created_at.strftime(
                "%Y-%m-%d %H:%M"
            ),

        "updated_at":
            post.updated_at.strftime(
                "%Y-%m-%d %H:%M"
            ),
    }



# =========================================================
# NEWS PAGE
# =========================================================
@require_GET
def news_page(request):
    """
    Guest / Staff / Admin
    """

    return render(
        request,
        "booking/news.html",
        {
            "user_role":
                get_user_role(
                    request.user
                )
        }
    )

# from django.http import HttpResponse
# def news_page(request):
#     return render(request, "booking/news.html")

# =========================================================
# NEWS LIST API
# =========================================================
@require_GET
def news_list_api(request):

    role = get_user_role(
        request.user
    )

    queryset = NewsPost.objects.all()

    # Guest:
    # only active
    if role == "guest":
        queryset = queryset.filter(
            is_active=True
        )

    posts = [
        serialize_news(post)
        for post in queryset
    ]

    return JsonResponse(
        {
            "ok": True,
            "role": role,
            "count": len(posts),
            "results": posts,
        },
        json_dumps_params={
            "ensure_ascii": False
        }
    )



# =========================================================
# NEWS DETAIL API
# =========================================================
@require_GET
def news_detail_api(
    request,
    post_id
):

    post = get_object_or_404(
        NewsPost,
        pk=post_id
    )

    role = get_user_role(
        request.user
    )

    # Guest cannot see hidden
    if (
        role == "guest" and
        not post.is_active
    ):
        raise Http404(
            "News not found"
        )

    return JsonResponse(
        {
            "ok": True,
            "result":
                serialize_news(
                    post
                ),
        },
        json_dumps_params={
            "ensure_ascii": False
        }
    )



# =========================================================
# CREATE NEWS
# =========================================================
@require_POST
@login_required
def news_create_api(request):

    denied = require_news_create(
        request
    )

    if denied:
        return denied

    title = (
        request.POST.get(
            "title",
            ""
        ).strip()
    )

    content = (
        request.POST.get(
            "content",
            ""
        ).strip()
    )

    is_pinned = parse_bool(
        request.POST.get(
            "is_pinned"
        )
    )

    is_active = parse_bool(
        request.POST.get(
            "is_active",
            True
        )
    )

    # ===== PIN LOCK =====
    if is_pinned:

        denied = require_news_pin(
            request
        )

        if denied:
            return denied

    try:

        post = NewsPost.objects.create(
            title=title,

            content=content,

            image=request.FILES.get(
                "image"
            ),

            is_pinned=is_pinned,

            is_active=is_active,

            created_by=request.user,
        )

        return JsonResponse(
            {
                "ok": True,

                "message":
                    "Đăng bản tin thành công",

                "result":
                    serialize_news(
                        post
                    ),
            },
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    except Exception as err:

        return JsonResponse(
            {
                "ok": False,
                "error": str(err),
            },
            status=400
        )



# =========================================================
# UPDATE NEWS
# =========================================================
@require_http_methods([
    "PUT",
    "PATCH"
])
@login_required
def news_update_api(
    request,
    post_id
):

    post = get_object_or_404(
        NewsPost,
        pk=post_id
    )

    denied = require_news_edit(
        request,
        post
    )

    if denied:
        return denied

    data = safe_json_body(
        request
    )

    try:

        if "title" in data:
            post.title = (
                data["title"] or ""
            ).strip()

        if "content" in data:
            post.content = (
                data["content"] or ""
            ).strip()

        if "is_active" in data:
            post.is_active = parse_bool(
                data["is_active"]
            )

        if "is_pinned" in data:

            # pin privilege
            if parse_bool(
                data["is_pinned"]
            ):

                denied = require_news_pin(
                    request
                )

                if denied:
                    return denied

            post.is_pinned = parse_bool(
                data["is_pinned"]
            )

        post.save()

        return JsonResponse(
            {
                "ok": True,

                "message":
                    "Cập nhật bản tin thành công",

                "result":
                    serialize_news(
                        post
                    ),
            },
            json_dumps_params={
                "ensure_ascii": False
            }
        )

    except Exception as err:

        return JsonResponse(
            {
                "ok": False,
                "error": str(err),
            },
            status=400
        )



# =========================================================
# DELETE NEWS
# =========================================================
@require_http_methods([
    "DELETE"
])
@login_required
def news_delete_api(
    request,
    post_id
):

    post = get_object_or_404(
        NewsPost,
        pk=post_id
    )

    denied = require_news_delete(
        request,
        post
    )

    if denied:
        return denied

    deleted_title = post.title

    post.delete()

    return JsonResponse(
        {
            "ok": True,

            "message":
                f"Đã xóa bản tin: {deleted_title}",
        },
        json_dumps_params={
            "ensure_ascii": False
        }
    )



# =========================================================
# TOGGLE ACTIVE
# =========================================================
@require_POST
@login_required
def news_toggle_active_api(
    request,
    post_id
):

    post = get_object_or_404(
        NewsPost,
        pk=post_id
    )

    denied = require_news_edit(
        request,
        post
    )

    if denied:
        return denied

    post.is_active = (
        not post.is_active
    )

    post.save()

    return JsonResponse(
        {
            "ok": True,

            "is_active":
                post.is_active,

            "message":
                "Đã cập nhật trạng thái",
        },
        json_dumps_params={
            "ensure_ascii": False
        }
    )



# =========================================================
# TOGGLE PIN
# =========================================================
@require_POST
@login_required
def news_toggle_pin_api(
    request,
    post_id
):

    post = get_object_or_404(
        NewsPost,
        pk=post_id
    )

    denied = require_news_pin(
        request
    )

    if denied:
        return denied

    post.is_pinned = (
        not post.is_pinned
    )

    post.save()

    return JsonResponse(
        {
            "ok": True,

            "is_pinned":
                post.is_pinned,

            "message":
                "Đã cập nhật ghim tin",
        },
        json_dumps_params={
            "ensure_ascii": False
        }
    )