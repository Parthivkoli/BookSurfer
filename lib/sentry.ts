// lib/sentry.ts - Sentry error tracking configuration (Optional)
// To use: npm install @sentry/nextjs

let Sentry: any = null;

try {
  Sentry = require('@sentry/nextjs');
} catch (e) {
  // Sentry is optional
}

export function initSentry() {
  if (Sentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
    });
  }
}

export const captureException = Sentry?.captureException || (() => {});
export const captureMessage = Sentry?.captureMessage || (() => {});
