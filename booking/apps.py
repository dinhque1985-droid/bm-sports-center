from django.apps import AppConfig


class BookingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'booking'

    # 👉 tên hiển thị trong admin
    verbose_name = "Quản lý đặt sân"

    def ready(self):
        """
        Hook chạy khi app khởi động.
        Dùng để:
        - đăng ký signals
        - init logic
        """

        # 👉 import signal (nếu có)
        try:
            import booking.signals  # noqa
        except ImportError:
            pass