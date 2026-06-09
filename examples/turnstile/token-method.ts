// Cloudflare Turnstile — Token Method (Playwright + CaptchaSonic)
// Setup: Add your API key to .env (see .env.example)
// Usage: npm run turnstile

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, extractToken, injectTurnstileToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://2captcha.com/demo/cloudflare-turnstile';
const SITE_KEY = '0x4AAAAAAAVrOwQWPlm3DUSA';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — Cloudflare Turnstile Token Method');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  console.log('Solving Turnstile...');
  const result = await client.solveTurnstile({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const token = extractToken(result);
  console.log(`Token received (${token.length} chars)`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await injectTurnstileToken(page, token);
    console.log('Token injected');

    await page.click('button[type="submit"]').catch(() =>
      page.evaluate(() => (document.querySelector('form') as HTMLFormElement)?.submit())
    );
    await page.waitForTimeout(3000);
    console.log('Turnstile bypassed!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
