/**
 * Auth Fixture — e2e/fixtures/auth.ts
 *
 * Generates a valid HMAC-signed site_access cookie so tests that exercise
 * protected routes never have to go through the /gate password flow.
 *
 * The cookie value uses the same algorithm as src/utils/sessionToken.ts:
 *   base64url(payload) + "." + base64url(HMAC-SHA256(payload, SITE_PASSWORD))
 *
 * The SITE_PASSWORD env var must be set before running E2E tests.
 * In development you can put it in .env.test.local:
 *   SITE_PASSWORD=your_password_here
 */
import { createHmac } from 'crypto';
import { BrowserContext } from '@playwright/test';

const SITE_PASSWORD = process.env.SITE_PASSWORD ?? 'testpassword';

/**
 * Build a signed token that the middleware will accept.
 */
export function buildSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ granted: true, iat: Date.now() })
  ).toString('base64url');

  const sig = createHmac('sha256', SITE_PASSWORD)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

/**
 * Inject the site_access cookie into a Playwright BrowserContext.
 * Call this in a beforeEach or in a custom fixture before navigating.
 */
export async function injectAuthCookie(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name: 'site_access',
      value: buildSessionToken(),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      // 30 days
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    },
  ]);
}
