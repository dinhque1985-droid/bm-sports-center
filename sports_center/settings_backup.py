"""
Django settings for sports_center project.
"""

from pathlib import Path

# ================= BASE =================
BASE_DIR = Path(__file__).resolve().parent.parent


# ================= SECURITY =================
SECRET_KEY = 'django-insecure-change-me-in-production'

DEBUG = False  # ⚠️ đổi False khi deploy

ALLOWED_HOSTS = [
    "yourdomain.com",
    "www.yourdomain.com",
    "your_server_ip"
]

# ================= APPLICATION =================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'booking',
]


# ================= MIDDLEWARE =================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',

    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ================= URL / WSGI =================
ROOT_URLCONF = 'sports_center.urls'

WSGI_APPLICATION = 'sports_center.wsgi.application'


# ================= TEMPLATES =================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        # 👉 template global (base.html, layout)
        'DIRS': [BASE_DIR / 'templates'],

        'APP_DIRS': True,

        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ================= DATABASE =================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ================= PASSWORD =================
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ================= INTERNATIONAL =================
LANGUAGE_CODE = 'vi'  # 👉 phù hợp UI tiếng Việt

TIME_ZONE = 'Asia/Ho_Chi_Minh'

USE_I18N = True
USE_TZ = True


# ================= STATIC FILES =================
STATIC_URL = '/static/'

# 👉 nơi bạn đặt static dev (JS, CSS)
STATICFILES_DIRS = [
    BASE_DIR / "static"
]

# 👉 nơi collectstatic khi deploy
STATIC_ROOT = BASE_DIR / "staticfiles"


# ================= MEDIA (OPTIONAL) =================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ================= DEFAULT PK =================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'