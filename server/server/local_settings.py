"""
Local development settings
This file should be used for local development and should not be committed to version control
"""

import os
from .settings import *

# Override database settings for local development
# You can set these as environment variables or hardcode them for local development

# Option 1: Use environment variables (recommended)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'railway'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '***REMOVED***'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),  # Use external Railway host
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Option 2: Use SQLite for local development (uncomment if you want to use SQLite locally)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Enable debug for local development
DEBUG = True

# Allow all hosts for local development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# CORS settings for local development
CORS_ALLOW_ALL_ORIGINS = True 