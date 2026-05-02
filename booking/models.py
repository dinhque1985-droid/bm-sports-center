from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError


# ======================
# BOOKING
# ======================

class Booking(models.Model):

    court = models.CharField(max_length=10)
    court_id = models.IntegerField()
    date = models.DateField()
    start = models.IntegerField()
    end = models.IntegerField()
    customer = models.CharField(max_length=100, default="Khách")
    phone = models.CharField(max_length=20, blank=True, null=True)
    paid = models.BooleanField(default=False)
    price = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # ===== BOOKING BY =====
    booked_by = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True
    )

    # ======================
    # VALIDATION
    # ======================
    def clean(self):

        # 1. start < end
        if self.start >= self.end:
            raise ValidationError("Thời gian không hợp lệ (start >= end)")

        # 2. giờ hoạt động
        OPEN_MINUTE = 5 * 60
        CLOSE_MINUTE = 23 * 60

        if self.start < OPEN_MINUTE or self.end > CLOSE_MINUTE:
            raise ValidationError("Thời gian ngoài khung hoạt động")

        # 3. check overlap booking
        overlapping_qs = Booking.objects.filter(
            court_id=self.court_id,
            date=self.date
        ).exclude(id=self.id)

        for b in overlapping_qs:
            if not (self.end <= b.start or self.start >= b.end):
                raise ValidationError(
                    f"Trùng lịch với booking #{b.id} ({b.start}-{b.end})"
                )

        # 4. check overlap block
        blocks = CourtBlock.objects.filter(
            court_id=self.court_id,
            date_from__lte=self.date,
            date_to__gte=self.date
        )

        for block in blocks:
            if not (self.end <= block.start or self.start >= block.end):
                raise ValidationError("Booking trùng với block (khung giờ bị khóa)")

    # ======================
    def save(self, *args, **kwargs):
        # 🔥 đồng bộ court_id từ court nếu thiếu
        if self.court and not self.court_id:
            self.court_id = int(self.court)

        # 🔥 đồng bộ ngược (tạm thời)
        if self.court_id and not self.court:
            self.court = str(self.court_id)

        self.clean()
        super().save(*args, **kwargs)

    # ======================
    def duration(self):
        return self.end - self.start

    def time_range(self):
        return f"{self.start} → {self.end}"

    def __str__(self):
        return f"{self.court} | {self.customer} ({self.start}-{self.end})"

    class Meta:
        ordering = ["-date", "start"]
        indexes = [
            models.Index(fields=["date", "court_id"]),
        ]


# ======================
# COURT BLOCK
# ======================

class CourtBlock(models.Model):

    RULE_TYPE_CHOICES = [
        ("normal", "Giờ thường"),
        ("peak", "Cao điểm"),
        ("monthly", "Thuê tháng"),
    ]

    # ===== CORE =====
    court_id = models.IntegerField()

    date_from = models.DateField()
    date_to = models.DateField()

    start = models.IntegerField()
    end = models.IntegerField()

    # ===== PRICING MODE =====
    rule_type = models.CharField(
        max_length=20,
        choices=RULE_TYPE_CHOICES,
        default="normal"
    )

    # 🔥 chỉ là hệ số override (optional)
    pricing_factor = models.FloatField(default=1.0)

    # ===== META =====
    reason = models.CharField(max_length=255, blank=True)

    # 🔥 cache (optional, không phải nguồn sự thật)
    total_price = models.IntegerField(default=0, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)

    # ================= VALIDATION =================
    def clean(self):

        # ===== BASIC =====
        if self.start >= self.end:
            raise ValidationError("Thời gian block không hợp lệ")

        if self.date_from > self.date_to:
            raise ValidationError("Khoảng ngày không hợp lệ")

        # ===== BLOCK OVERLAP =====
        overlapping_blocks = CourtBlock.objects.filter(
            court_id=self.court_id,
            date_from__lte=self.date_to,
            date_to__gte=self.date_from
        ).exclude(id=self.id)

        for b in overlapping_blocks:
            if not (self.end <= b.start or self.start >= b.end):
                raise ValidationError("Block bị chồng với block khác")

        # ===== BOOKING OVERLAP =====
        bookings = Booking.objects.filter(
            court_id=self.court_id,
            date__gte=self.date_from,
            date__lte=self.date_to
        )

        for bk in bookings:
            if not (self.end <= bk.start or self.start >= bk.end):
                raise ValidationError("Block đè lên booking đã tồn tại")

    # ================= SAVE =================
    def save(self, *args, **kwargs):

        self.clean()

        # 🔥 OPTIONAL: auto calculate price (cache)
        from booking.services.block_price_engine import calculate_block_price

        court_type = "badminton" if int(self.court_id) <= 4 else "pickleball"

        try:
            self.total_price = calculate_block_price(
                court_type=court_type,
                start=self.start,
                end=self.end,
                date_from=self.date_from,
                date_to=self.date_to,
                factor=self.pricing_factor
            )

        except Exception as e:
            print("⚠️ BLOCK PRICE ERROR:", e)
            self.total_price = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Block {self.court_id} {self.start}-{self.end} ({self.rule_type})"
# ======================
# PRICE
# ======================

class PriceRule(models.Model):

    COURT_TYPE_CHOICES = [
        ("badminton", "Cầu lông"),
        ("pickleball", "Pickleball"),
    ]

    RULE_TYPE_CHOICES = [
        ("normal", "Giờ thường"),
        ("peak", "Cao điểm"),
    ]

    court_type = models.CharField(max_length=20, choices=COURT_TYPE_CHOICES)

    start_minute = models.IntegerField()
    end_minute = models.IntegerField()

    day_of_week = models.IntegerField(null=True, blank=True)

    price_per_hour = models.IntegerField()

    rule_type = models.CharField(
        max_length=20,
        choices=RULE_TYPE_CHOICES,
        default="normal"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["court_type", "start_minute"]

    def clean(self):   # 🔥 ĐẶT ĐÚNG VỊ TRÍ

        if self.start_minute >= self.end_minute:
            raise ValidationError("start_minute phải nhỏ hơn end_minute")

        qs = PriceRule.objects.filter(
            court_type=self.court_type,
            is_active=True
        )

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        for r in qs:
            if (
                self.start_minute < r.end_minute and
                self.end_minute > r.start_minute and
                self.day_of_week == r.day_of_week
            ):
                raise ValidationError("Rule bị overlap với rule khác")
   

class MonthlyRule(models.Model):

    COURT_TYPE_CHOICES = [
        ("badminton", "Cầu lông"),
        ("pickleball", "Pickleball"),
    ]

    court_type = models.CharField(max_length=20, choices=COURT_TYPE_CHOICES)

    start = models.IntegerField()
    end = models.IntegerField()

    # 🔥 KHÔNG dùng date_from / date_to nữa

    pricing_factor = models.FloatField(default=1.0)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.court_type} {self.start}-{self.end} x{self.pricing_factor}"  


class BookingRequest(models.Model):

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    court = models.CharField(max_length=10)
    court_id = models.IntegerField()

    date = models.DateField()

    start = models.IntegerField()
    end = models.IntegerField()

    customer = models.CharField(max_length=120)

    phone = models.CharField(max_length=20)

    note = models.TextField(blank=True, default="")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    estimated_price = models.IntegerField(default=0)

    admin_note = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "date"]),
        ]

    def save(self, *args, **kwargs):

        if self.court and not self.court_id:
            self.court_id = int(self.court)

        if self.court_id and not self.court:
            self.court = str(self.court_id)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Request #{self.id} - {self.customer}"



class UserProfile(models.Model):

    ROLE_CHOICES = [
        ("guest", "Guest"),
        ("staff", "Staff"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="guest"
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"   


@receiver(post_save, sender=User)
def create_user_profile(
    sender,
    instance,
    created,
    **kwargs
):
    if created:
        UserProfile.objects.create(
            user=instance
        )


# =========================================
# NEWS POST
# =========================================
class NewsPost(models.Model):
    """
    BM_Sport News / Announcement / Activity Feed
    """

    # ===== CONTENT =====
    title = models.CharField(
        max_length=200
    )

    content = models.TextField()

    # ===== MEDIA =====
    image = models.ImageField(
        upload_to="news/",
        blank=True,
        null=True
    )

    # ===== STATE =====
    is_pinned = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    # ===== ROLE CONTROL =====
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="news_posts"
    )

    # ===== AUDIT =====
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # =====================================
    # META
    # =====================================
    class Meta:
        ordering = [
            "-is_pinned",
            "-created_at"
        ]
        verbose_name = "Bản tin"
        verbose_name_plural = "Bản tin BM_Sport"


    # =====================================
    # VALIDATION
    # =====================================
    def clean(self):

        # ===== TITLE =====
        if not self.title or not self.title.strip():
            raise ValidationError(
                "Tiêu đề không được để trống"
            )

        # ===== CONTENT =====
        if not self.content or not self.content.strip():
            raise ValidationError(
                "Nội dung không được để trống"
            )

        # ===== LIMIT PINNED =====
        if self.is_pinned:

            qs = NewsPost.objects.filter(
                is_pinned=True,
                is_active=True
            )

            if self.pk:
                qs = qs.exclude(
                    pk=self.pk
                )

            # V1 LOCK:
            # max 3 pinned posts
            if qs.count() >= 3:
                raise ValidationError(
                    "Chỉ được ghim tối đa 3 bản tin"
                )


    # =====================================
    # SAVE
    # =====================================
    def save(
        self,
        *args,
        **kwargs
    ):

        self.full_clean()

        super().save(
            *args,
            **kwargs
        )


    # =====================================
    # DISPLAY
    # =====================================
    def __str__(self):

        pin = "📌 " if self.is_pinned else ""

        return f"{pin}{self.title}"


    # =====================================
    # HELPERS
    # =====================================
    @property
    def short_content(self):

        if len(self.content) <= 160:
            return self.content

        return self.content[:157] + "..."


    @property
    def creator_role(self):

        """
        Optional helper for frontend:
        admin / staff / guest
        """

        if not self.created_by:
            return "unknown"

        if self.created_by.is_superuser:
            return "admin"

        if (
            self.created_by.groups
            .filter(name="staff")
            .exists()
        ):
            return "staff"

        return "guest"