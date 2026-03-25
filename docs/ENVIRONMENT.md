/**
 * Environment Variable Setup Guide
 * 
 * This document explains how to set up environment variables for BookSurfer
 * in different environments (local development, staging, production).
 */

## Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your local values:
   ```env
   # NextAuth (required for auth features)
   NEXTAUTH_SECRET=openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth (get from console.cloud.google.com)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret

   # GitHub OAuth (get from github.com/settings/developers)
   GITHUB_ID=your-app-id
   GITHUB_SECRET=your-app-secret

   # Optional: External APIs
   CORE_API_KEY=your-core-api-key
   SEMANTIC_SCHOLAR_API_KEY=your-scholar-key
   ```

3. Start development:
   ```bash
   npm run dev
   ```

## Vercel Deployment

1. Go to Vercel Project Settings → Environment Variables
2. Add all required variables (without NEXTAUTH_URL, it auto-detects)
3. Set `NEXTAUTH_URL=https://yourdomain.vercel.app` only if needed

### For Preview Deployments:
```
NEXTAUTH_URL=https://$VERCEL_URL
GOOGLE_CLIENT_ID=development-or-preview-client-id
GITHUB_ID=preview-app-id
```

## Production Environment

### Required Variables:
These MUST be set in production:
- `NEXTAUTH_SECRET` - Generate: `openssl rand -hex 32`
- `NEXTAUTH_URL` - Your production domain
- At least one OAuth provider (Google or GitHub)

### Optional but Recommended:
- `NODE_ENV=production`
- API keys for enhanced features
- Sentry DSN for error tracking

## Validation

Environment variables are validated on startup using `lib/env.ts`.

If required variables are missing, the application will:
- Log a warning in development
- Fail to start in production (unless optional)
- Gracefully disable features if OAuth is not configured

## Generate NEXTAUTH_SECRET

### Option 1: OpenSSL
```bash
openssl rand -hex 32
```

### Option 2: Online (less secure)
Use https://generate-secret.vercel.app/32

### Option 3: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### "Authentication failed" error:
- Check OAuth credentials are correct
- Verify NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches deployment domain

### Missing API keys errors:
- Optional features will log warnings but app continues
- Check lib/env.ts for which variables are required vs optional

