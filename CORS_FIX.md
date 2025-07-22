# CORS and URL Configuration Fix

This update fixes the 400 error issue when your frontend on Vercel sends requests to your backend on Railway.

## What Changed

1. Added environment-aware URLs for email verification and password reset links
2. Enhanced CORS configuration to handle preflight OPTIONS requests
3. Added a custom CORS middleware for better handling of cross-origin requests
4. Fixed error handling in session creation endpoint

## How to Deploy

1. Make sure you have the following environment variables set in Railway:
   - `FRONTEND_URL`: Set to your Vercel deployment URL (`https://melb-minds-one.vercel.app`)
   - `DJANGO_ALLOWED_HOSTS`: Include your Railway app URL (`melbminds-production.up.railway.app`)

2. On your Vercel deployment, make sure you have:
   - `NEXT_PUBLIC_API_URL`: Set to your Railway backend URL (`https://melbminds-production.up.railway.app`)

3. Redeploy your application on Railway to apply these changes.

## Testing

After deploying, test the following flows:
- User registration
- Email verification
- Password reset
- Group creation and joining
- Session creation and management

If you still encounter issues, check the Railway logs for more details on the error.

## Important Notes About Your Vercel Deployment

Your specific Vercel URL `https://melb-minds-one.vercel.app` has been explicitly added to the CORS allowed origins in the Django settings. This means:

1. Your frontend at `https://melb-minds-one.vercel.app` is now explicitly allowed to make cross-origin requests to your Railway backend.
   
2. If you change your Vercel URL in the future, you'll need to update both:
   - The `CORS_ALLOWED_ORIGINS` list in `settings.py`
   - The `FRONTEND_URL` environment variable in Railway

3. For local development, `http://localhost:3000` remains in the allowed origins list.
