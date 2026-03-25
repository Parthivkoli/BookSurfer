import { z } from 'zod';

/**
 * Environment variable schema using Zod for validation
 * Ensures all required env vars are present and valid at runtime
 */
const envSchema = z.object({
  // NextAuth variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth providers (optional - gracefully handled if missing)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),

  // External APIs (optional)
  CORE_API_KEY: z.string().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
});

// Validate environment variables at startup
export const env = envSchema.parse(process.env);

// Export a function to check if OAuth is properly configured
export function isOAuthConfigured(): boolean {
  const hasGoogle = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;
  const hasGithub = env.GITHUB_ID && env.GITHUB_SECRET;
  return !!(hasGoogle || hasGithub);
}

// Development warning if OAuth not configured
if (env.NODE_ENV === 'production' && !isOAuthConfigured()) {
  console.warn(
    '[PRODUCTION] OAuth providers not fully configured. Some authentication features may be unavailable.'
  );
}
