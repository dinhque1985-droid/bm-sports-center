from django.core.exceptions import ValidationError
from django.utils import timezone

from booking.models import BookingRequest, Booking
from booking.services.price_engine import calculate_price


# ======================================================
# HELPERS
# ======================================================

def validate_request_payload(
    court_id,
    date,
    start,
    end,
    customer,
    phone,
):
    """
    Core validation for guest booking request.
    Does NOT create Booking yet.
    """

    if not court_id:
        raise ValidationError("Thiếu court_id")

    if not date:
        raise ValidationError("Thiếu ngày")

    if start is None or end is None:
        raise ValidationError("Thiếu thời gian")

    if start >= end:
        raise ValidationError("Khung giờ không hợp lệ")

    if not customer:
        raise ValidationError("Thiếu tên khách")

    if not phone:
        raise ValidationError("Thiếu số điện thoại")

    # ===== FUTURE CHECK =====
    today = timezone.localdate()

    if date < today:
        raise ValidationError("Không thể đặt lịch trong quá khứ")



def get_court_type(court_id):
    """
    Temporary architecture-safe mapping.
    Can be replaced later by real Court model.
    """

    return "badminton" if int(court_id) <= 4 else "pickleball"


# ======================================================
# CREATE REQUEST
# ======================================================

def create_booking_request(
    court_id,
    date,
    start,
    end,
    customer,
    phone,
    note="",
):
    """
    Guest creates pending booking request.

    Flow:
    Guest -> Pending only
    No real Booking created here.
    """

    validate_request_payload(
        court_id=court_id,
        date=date,
        start=start,
        end=end,
        customer=customer,
        phone=phone,
    )

    # ===== ESTIMATE PRICE =====
    court_type = get_court_type(court_id)

    try:
        estimated_price = calculate_price(
            court_type=court_type,
            start=start,
            end=end,
            date=date,
        )
    except Exception:
        estimated_price = 0

    request_obj = BookingRequest.objects.create(
        court=str(court_id),
        court_id=int(court_id),
        date=date,
        start=start,
        end=end,
        customer=customer,
        phone=phone,
        note=note or "",
        estimated_price=estimated_price,
        status=BookingRequest.STATUS_PENDING,
    )

    return request_obj


# ======================================================
# APPROVE REQUEST
# ======================================================

def approve_booking_request(request_id):
    """
    Admin approves request.

    Flow:
    Pending Request -> Booking -> Approved

    IMPORTANT:
    Booking.save() already enforces:
    - overlap booking
    - overlap block
    - open-close
    """

    try:
        request_obj = BookingRequest.objects.get(id=request_id)
    except BookingRequest.DoesNotExist:
        raise ValidationError("Yêu cầu không tồn tại")

    if request_obj.status != BookingRequest.STATUS_PENDING:
        raise ValidationError("Yêu cầu không còn ở trạng thái pending")

    # ===== CREATE REAL BOOKING =====
    booking = Booking(
        court=request_obj.court,
        court_id=request_obj.court_id,
        date=request_obj.date,
        start=request_obj.start,
        end=request_obj.end,

        # ===== BUSINESS =====
        customer=request_obj.customer,
        phone=request_obj.phone,

        # ===== TRACE =====
        booked_by=request_obj.customer,

        # ===== STATUS =====
        paid=False,

        # ===== PRICE =====
        price=request_obj.estimated_price,
    )
    
    # 🔥 Booking.clean() authoritative
    booking.save()

    # ===== UPDATE REQUEST =====
    request_obj.status = BookingRequest.STATUS_APPROVED
    request_obj.reviewed_at = timezone.now()
    request_obj.save()

    return {
        "success": True,
        "request": request_obj,
        "booking": booking,
    }


# ======================================================
# REJECT REQUEST
# ======================================================

def reject_booking_request(request_id, admin_note=""):
    """
    Admin rejects pending request.
    """

    try:
        request_obj = BookingRequest.objects.get(id=request_id)
    except BookingRequest.DoesNotExist:
        raise ValidationError("Yêu cầu không tồn tại")

    if request_obj.status != BookingRequest.STATUS_PENDING:
        raise ValidationError("Yêu cầu không còn ở trạng thái pending")

    request_obj.status = BookingRequest.STATUS_REJECTED
    request_obj.admin_note = admin_note or ""
    request_obj.reviewed_at = timezone.now()
    request_obj.save()

    return {
        "success": True,
        "request": request_obj,
    }


# ======================================================
# FETCH REQUESTS
# ======================================================

def get_booking_requests(status=None):
    """
    Admin fetch booking requests.
    Default: all
    """

    qs = BookingRequest.objects.all().order_by("-created_at")

    if status:
        qs = qs.filter(status=status)

    return qs

