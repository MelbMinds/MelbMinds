#!/usr/bin/env python
"""
Railway Connection Helper
This script helps you get the correct connection details for your Railway PostgreSQL database
"""

print("=== Railway PostgreSQL Connection Setup ===\n")

print("To fix your database connection, you need to get the EXTERNAL connection details from Railway.\n")

print("📋 Steps to get Railway connection details:")
print("1. Go to your Railway dashboard: https://railway.app/dashboard")
print("2. Select your project")
print("3. Click on your PostgreSQL service")
print("4. Go to the 'Connect' tab")
print("5. Look for 'Connect' or 'External' connection details")
print("6. You'll see something like:")
print("   - Host: viaduct.proxy.rlwy.net")
print("   - Port: 5432")
print("   - Database: railway")
print("   - Username: postgres")
print("   - Password: [your-password]\n")

print("🔧 Once you have the external connection details:")
print("1. Set them as environment variables:")
print("   set DB_HOST=viaduct.proxy.rlwy.net")
print("   set DB_PORT=5432")
print("   set DB_NAME=railway")
print("   set DB_USER=postgres")
print("   set DB_PASSWORD=your-password")
print("")
print("2. Or modify the local_settings.py file directly")
print("")
print("3. Then run: python manage.py shell --settings=server.local_settings")

print("\n💡 Alternative: Use SQLite for local development")
print("If you want to use SQLite locally, uncomment the SQLite configuration in local_settings.py")

print("\n=== End Setup Guide ===") 