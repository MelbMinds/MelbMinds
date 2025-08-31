# Backend Environment Configuration

This project supports easy switching between local and remote backend environments.

## Quick Setup

### For Local Development (Default)
The project is already configured for local development. Your frontend will connect to `http://localhost:8000`.

1. Make sure your Django server is running:
   ```bash
   cd server
   python manage.py runserver
   ```

2. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```

### Switching Between Environments

#### Method 1: Using npm scripts (Recommended)
```bash
# Switch to local backend (Django on localhost:8000)
npm run env:local

# Switch to remote backend (Railway hosted)
npm run env:remote
```

#### Method 2: Using PowerShell script directly
```bash
# Switch to local backend
pwsh switch-env.ps1 local

# Switch to remote backend  
pwsh switch-env.ps1 remote
```

#### Method 3: Manual configuration
Copy the appropriate environment file:
```bash
# For local development
cp .env.local .env.local

# For remote backend
cp .env.production .env.local
```

## Environment Files

- `.env.local` - Active environment configuration (used by Next.js)
- `.env.production` - Template for remote/production backend
- `.env.example` - Example configuration file

## Important Notes

1. **Update Railway URL**: Before using remote backend, update the URL in `.env.production` with your actual Railway deployment URL.

2. **Django CORS**: The Django server is already configured to accept requests from `localhost:3000` in development.

3. **HTTPS Handling**: The API client automatically converts HTTP to HTTPS for production URLs but preserves HTTP for localhost.

4. **Debugging**: In development mode, the API client logs the backend URL to help with debugging.

## Current Configuration

Check your current backend configuration:
```bash
cat .env.local
```

The API client will log the active backend URL in the browser console when `NEXT_PUBLIC_ENVIRONMENT=development`.
