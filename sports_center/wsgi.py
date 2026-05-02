"""
WSGI config for sports_center project.
"""

import os
from django.core.wsgi import get_wsgi_application

# 👉 set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_center.settings')

# 👉 WSGI application
application = get_wsgi_application()