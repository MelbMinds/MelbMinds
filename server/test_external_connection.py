#!/usr/bin/env python
"""
Test external Railway connection
This script tests if you have the correct external Railway connection details set up
"""

import os
import sys
from pathlib import Path

# Add the server directory to Python path
sys.path.append(str(Path(__file__).parent))

# Set up Django with local settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.local_settings')

try:
    import django
    django.setup()
    
    from django.conf import settings
    from django.db import connections
    from django.db.utils import OperationalError
    import psycopg2
    
    print("=== Testing External Railway Connection ===\n")
    
    # Check if we're using local settings
    if hasattr(settings, 'DATABASES'):
        db_settings = settings.DATABASES['default']
        print(f"📋 Current Database Configuration:")
        print(f"   Engine: {db_settings.get('ENGINE', 'Not set')}")
        print(f"   Name: {db_settings.get('NAME', 'Not set')}")
        print(f"   User: {db_settings.get('USER', 'Not set')}")
        print(f"   Host: {db_settings.get('HOST', 'Not set')}")
        print(f"   Port: {db_settings.get('PORT', 'Not set')}")
        print(f"   Password: {'*' * len(db_settings.get('PASSWORD', '')) if db_settings.get('PASSWORD') else 'Not set'}")
        
        # Test connection
        print(f"\n🔌 Testing connection...")
        try:
            db_conn = connections['default']
            db_conn.ensure_connection()
            print("✅ Database connection successful!")
            print("🎉 You have the correct external Railway connection details!")
        except OperationalError as e:
            print(f"❌ Database connection failed: {e}")
            print("\n💡 You still need to:")
            print("1. Get the external connection details from Railway dashboard")
            print("2. Set them as environment variables or in local_settings.py")
            print("3. Make sure you're using the external host (not .internal)")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    else:
        print("❌ No database configuration found")
        
except ImportError as e:
    print(f"❌ Error importing Django: {e}")
    print("Make sure you're running this from the server directory")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n=== End Test ===") 