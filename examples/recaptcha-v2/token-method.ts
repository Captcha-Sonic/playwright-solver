/**
 * reCAPTCHA v2 — Token Method with CaptchaSonic TypeScript SDK
 * =============================================================
 * CaptchaSonic solves reCAPTCHA v2 server-side via its gRPC API
 * and returns a token. We inject it into the page — no clicking required.
 *
 * Why CaptchaSonic wins:
 *   - Native TypeScript SDK with full types
 *   - gRPC transport (zero HTTP overhead, keep-alive connection)
 *   - Single await vs manual polling loops
 *   - Works regardless of Chrome version or extension restrictions
 *
 * Setup:
 *   export CAPTCHASONIC_API_KEY=sonic_your_key_here
 *
 * Usage:
 *   npx ts-node examples/recaptcha-v2/token-method.ts
 */

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, injectRecaptchaToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php';
const SITE_KEY = '6LfW6wATAAAAAHLqO2pb8bDBahxlMxNdo9g947u9';

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — reCAPTCHA v2 Token Method (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  // ── Step 1: Solve with CaptchaSonic SDK ────────────────────────────────────
  const client = new CaptchaSonic(apiKey);
  await printBalance(client);

  console.log('⏳ Solving reCAPTCHA v2...');
  const result = await client.solveRecaptchaV2Token({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const res = result as Record<string, unknown>;
  const token: string = (res.solution as Record<string, string>)['gRecaptchaResponse'];
  console.log(`  ✅ Token received (${token.length} chars)`);
  // ── Step 2: Open Playwright browser and inject token ───────────────────────
  const browser = await chromium.launch({ headless: false }); // set headless: true for CI
  const page = await browser.newPage();

  try {
    console.log('\n🌐 Opening browser...');
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    // Inject the token into the hidden reCAPTCHA textarea
    await injectRecaptchaToken(page, token);
    console.log('  ✅ Token injected');

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('  ✅ Form submitted successfully!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
