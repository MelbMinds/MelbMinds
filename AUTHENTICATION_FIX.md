# Authentication Token Issue Fix

## Problem
Users were experiencing authentication issues where they would be logged out after a short period and had to log back in to access protected pages like groups, profile, etc.

## Root Cause
The Django backend was missing proper JWT token configuration. The `rest_framework_simplejwt` package was installed but no JWT-specific settings were configured in `settings.py`, causing tokens to expire very quickly (using default 5-minute lifetime).

## Solution

### 1. Backend Changes (server/server/settings.py)

#### Added JWT Configuration:
```python
# JWT Token Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # 24 hours instead of default 5 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # 7 days
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    'JTI_CLAIM': 'jti',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(hours=24),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=7),
}
```

#### Added Token Blacklist App:
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'rest_framework_simplejwt.token_blacklist',
    'server',
]
```

### 2. Frontend Changes

#### Created API Client (client/lib/api.ts)
- Automatic token refresh functionality
- Centralized error handling
- Automatic redirect to login on authentication failure
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- File upload support

#### Updated UserContext (client/components/UserContext.tsx)
- Integrated with API client
- Automatic token management

#### Updated Profile Page (client/app/profile/page.tsx)
- Example of using the new API client
- Simplified error handling
- Automatic token refresh

### 3. Database Migration
Applied token blacklist migrations:
```bash
python manage.py migrate
```

## Benefits

1. **Longer Token Lifetime**: Access tokens now last 24 hours instead of 5 minutes
2. **Automatic Refresh**: Tokens are automatically refreshed when they expire
3. **Better Error Handling**: Centralized error handling with proper user feedback
4. **Seamless Experience**: Users won't be unexpectedly logged out
5. **Security**: Token rotation and blacklisting for better security

## Usage

### Using the API Client:
```typescript
import { apiClient } from "@/lib/api"

// GET request
const response = await apiClient.get("/profile/")
if (response.error) {
  // Handle error
} else {
  // Use response.data
}

// POST request
const response = await apiClient.post("/groups/", groupData)

// PUT request
const response = await apiClient.put("/profile/", profileData)

// DELETE request
const response = await apiClient.delete("/groups/123/")

// File upload
const formData = new FormData()
formData.append('file', file)
const response = await apiClient.uploadFile("/groups/123/files/", formData)
```

## Testing

1. Start the backend server
2. Start the frontend development server
3. Log in to the application
4. Navigate between pages - you should no longer be logged out unexpectedly
5. The session should persist for 24 hours (access token) or 7 days (refresh token)

## Notes

- The API client automatically handles token refresh
- If a token refresh fails, users are redirected to the login page
- All existing functionality remains the same, just with better token management
- The fix is backward compatible with existing code 