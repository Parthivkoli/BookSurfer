# Deployment Guide - BookSurfer

## Quick Start: Deploy to Vercel

### Option 1: From GitHub (Recommended)

1. **Push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel auto-detects as Next.js

3. **Configure Environment Variables:**
   - Project Settings → Environment Variables
   - Add all variables from `.env.example` (except NEXTAUTH_URL)
   - Vercel auto-sets NEXTAUTH_URL to your domain

4. **Deploy:**
   - Click "Deploy"
   - Automatic deployments on push to main
   - Preview deployments for pull requests

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel
# Follow prompts to connect to GitHub
```

## Environment Variables on Vercel

### Required
- `NEXTAUTH_SECRET` - Generate: `openssl rand -hex 32`
- At least one OAuth provider (Google or GitHub)

### Optional
- `CORE_API_KEY` - For academic paper search
- `SEMANTIC_SCHOLAR_API_KEY` - For paper metadata

### Production Environment (.env.production)
Set different OAuth credentials for production vs preview builds:
```
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=prod-secret-key
GOOGLE_CLIENT_ID=prod-google-id
GOOGLE_CLIENT_SECRET=prod-google-secret
```

## Docker Deployment

### Build Docker Image
```bash
docker build -t booksurfer:latest .
```

### Run Locally
```bash
# Using docker run
docker run -p 3000:3000 -e NEXTAUTH_SECRET=test booksurfer:latest

# Using docker-compose
docker-compose up
```

### Deploy to Docker Registry

#### Docker Hub
```bash
docker login
docker build -t yourusername/booksurfer:latest .
docker push yourusername/booksurfer:latest
```

### Deploy to Cloud Platforms

#### AWS ECS
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {account-id}.dkr.ecr.us-east-1.amazonaws.com
docker build -t booksurfer:latest .
docker tag booksurfer:latest {account-id}.dkr.ecr.us-east-1.amazonaws.com/booksurfer:latest
docker push {account-id}.dkr.ecr.us-east-1.amazonaws.com/booksurfer:latest

# Deploy with ECS task definition
```

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/{project-id}/booksurfer
gcloud run deploy booksurfer \
  --image gcr.io/{project-id}/booksurfer \
  --platform managed \
  --region us-central1 \
  --set-env-vars="NEXTAUTH_SECRET=your-secret"
```

#### Heroku
```bash
heroku login
heroku create booksurfer
heroku config:set NEXTAUTH_SECRET=your-secret
git push heroku main
```

## Pre-Deployment Checklist

### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run build` completes successfully
- [ ] `npm run test` passes (70%+ coverage)
- [ ] No console errors/warnings

### Security
- [ ] Remove hardcoded secrets
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enforced
- [ ] Security headers configured ✅

### Performance
- [ ] Bundle size < 100 kB (shared JS)
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] No blocking resources

### Functionality
- [ ] All routes working
- [ ] Authentication tested
- [ ] Book reader functional
- [ ] ChatBot operational

## Monitoring & Logging

### Vercel Built-in
- Real-time logs: `vercel logs -f`
- Performance metrics in dashboard
- Deployment analytics

### External Monitoring

#### Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:
```javascript
const withSentry = require('@sentry/nextjs').withSentry;
module.exports = withSentry({ /* ... */ });
```

Initialize in `lib/sentry.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

#### Uptime Monitoring
```bash
# Using Vercel's built-in
# Enable "Deployment Protection" for production
```

## Rollback & Disaster Recovery

### Vercel Rollback
1. Project → Deployments
2. Find previous deployment
3. Click "..." → "Redeploy"

### Database Recovery
- Set up regular backups with your database provider
- Test recovery procedures monthly
- Keep database snapshots

## CI/CD Pipeline

GitHub Actions runs on every push:
1. ✅ ESLint check
2. ✅ TypeScript compilation
3. ✅ Build verification
4. ✅ Security audit

See `.github/workflows/ci.yml`

## Health Check

After deployment, verify:
```bash
curl https://yourdomain.vercel.app/api/health
# Response: { "status": "ok", "timestamp": "...", "version": "..." }
```

## Troubleshooting

### Build Fails
```bash
# Clear cache
vercel env pull              # Pull env vars
npm ci                       # Clean install
npm run build                # Build locally to debug
```

### Performance Issues
```bash
# Check bundle size
npm run build
# Check metrics
vercel analytics
```

### Authentication Not Working
- Verify OAuth credentials correct
- Check NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches domain
- Look at Vercel logs

### Database Connection Issues
- Verify DB_URL is correct
- Check IP whitelisting
- Review database logs

## Rollback Procedures

1. **Application Code:**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Vercel auto-deploys
   ```

2. **Database:**
   - Use provider's snapshot feature
   - Or restore from backup
   - Coordinate with team

## Performance Optimization

### On Vercel
```bash
# Enable Image Optimization
# Enable ISR (Incremental Static Regeneration)
# Enable Edge Middleware for caching
```

### Cache Strategy
```javascript
// In API routes
res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
```

---

Need help? Check [ENVIRONMENT.md](./ENVIRONMENT.md) or open an issue on GitHub.
