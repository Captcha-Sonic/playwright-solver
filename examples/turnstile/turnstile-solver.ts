/**
 * Cloudflare Turnstile — Token Method (Playwright)
 * =================================================
 * CaptchaSonic solves Turnstile and returns a cf-turnstile-response token.
 * We inject it into the page's hidden input.
 *
 * Usage:
 *   npx ts-node examples/turnstile/turnstile-solver.ts
 */

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, injectTurnstileToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://2captcha.com/demo/cloudflare-turnstile';
const SITE_KEY = '0x4AAAAAAAVrOwQWPlm3DUSA';

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — Cloudflare Turnstile Solver (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey);
  await printBalance(client);

  console.log('⏳ Solving Turnstile...');
  const result = await client.solveTurnstile({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const res = result as Record<string, unknown>;
  const token: string = (res.solution as Record<string, string>)['token'] ?? (res.solution as Record<string, string>)['cf-turnstile-response'];
  console.log(`  ✅ Token received (${token.length} chars)`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    await injectTurnstileToken(page, token);
    console.log('  ✅ Token injected');

    // Submit
    await page.click('button[type="submit"]').catch(() =>
      page.evaluate(() => (document.querySelector('form') as HTMLFormElement)?.submit())
    );

    await page.waitForTimeout(3000);
    console.log('  ✅ Turnstile bypassed!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
