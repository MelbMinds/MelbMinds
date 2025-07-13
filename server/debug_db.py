#!/usr/bin/env python
"""
Database connection diagnostic script
Run this to identify what's causing the database connection to fail
"""

import os
import sys
import django
from pathlib import Path

# Add the server directory to Python path
sys.path.append(str(Path(__file__).parent))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
import psycopg2
import socket

def test_database_connection():
    """Test database connection and provide detailed diagnostics"""
    
    print("=== Database Connection Diagnostics ===\n")
    
    # 1. Check if we can import psycopg2
    try:
        import psycopg2
        print("✅ psycopg2 is available")
    except ImportError as e:
        print(f"❌ psycopg2 import failed: {e}")
        return
    
    # 2. Display database settings (without password)
    db_settings = settings.DATABASES['default']
    print(f"\n📋 Database Configuration:")
    print(f"   Engine: {db_settings.get('ENGINE', 'Not set')}")
    print(f"   Name: {db_settings.get('NAME', 'Not set')}")
    print(f"   User: {db_settings.get('USER', 'Not set')}")
    print(f"   Host: {db_settings.get('HOST', 'Not set')}")
    print(f"   Port: {db_settings.get('PORT', 'Not set')}")
    print(f"   Password: {'*' * len(db_settings.get('PASSWORD', '')) if db_settings.get('PASSWORD') else 'Not set'}")
    
    # 3. Test network connectivity to the database host
    host = db_settings.get('HOST')
    port = db_settings.get('PORT', 5432)
    
    if host:
        print(f"\n🌐 Testing network connectivity to {host}:{port}")
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, int(port)))
            sock.close()
            
            if result == 0:
                print(f"✅ Network connection to {host}:{port} successful")
            else:
                print(f"❌ Network connection to {host}:{port} failed (error code: {result})")
                print("   This could be due to:")
                print("   - Firewall blocking the connection")
                print("   - Database server not running")
                print("   - Wrong host/port configuration")
                print("   - Network connectivity issues")
        except Exception as e:
            print(f"❌ Network test failed: {e}")
    
    # 4. Test direct psycopg2 connection
    print(f"\n🔌 Testing direct psycopg2 connection...")
    try:
        conn = psycopg2.connect(
            host=db_settings.get('HOST'),
            port=db_settings.get('PORT', 5432),
            database=db_settings.get('NAME'),
            user=db_settings.get('USER'),
            password=db_settings.get('PASSWORD'),
            connect_timeout=10
        )
        conn.close()
        print("✅ Direct psycopg2 connection successful")
    except psycopg2.OperationalError as e:
        print(f"❌ Direct psycopg2 connection failed: {e}")
        print("   Common causes:")
        print("   - Invalid credentials")
        print("   - Database doesn't exist")
        print("   - User doesn't have permission")
        print("   - SSL/TLS issues")
    except Exception as e:
        print(f"❌ Unexpected error during psycopg2 connection: {e}")
    
    # 5. Test Django ORM connection
    print(f"\n🐍 Testing Django ORM connection...")
    try:
        db_conn = connections['default']
        db_conn.ensure_connection()
        print("✅ Django ORM connection successful")
    except OperationalError as e:
        print(f"❌ Django ORM connection failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error during Django connection: {e}")
    
    # 6. Check for common Railway-specific issues
    print(f"\n🚂 Railway-specific checks:")
    if 'railway' in host.lower() if host else False:
        print("   - You're using Railway PostgreSQL")
        print("   - Make sure your Railway service is running")
        print("   - Check if you need to use external connection details")
        print("   - Verify your Railway environment variables")
    else:
        print("   - Not using Railway (or host doesn't contain 'railway')")
    
    print(f"\n=== End Diagnostics ===")

if __name__ == "__main__":
    test_database_connection() 