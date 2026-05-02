"""
ASGI config for sports_center project.
"""

import os
from django.core.asgi import get_asgi_application

# 👉 set settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_center.settings')

# 👉 Django ASGI app
application = get_asgi_application()