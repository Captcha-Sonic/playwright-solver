// Popular Captcha — Token Method (Playwright + CaptchaSonic)
// Setup: Add your API key to .env (see .env.example)
// Usage: npm run popularcaptcha

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, extractToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://www.popularcaptcha.com/demo';
const SITE_KEY = 'a5f74b19-9e45-40e0-b45d-47ff91b7a6c2';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — Popular Captcha Token Method');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  console.log('Solving Popular Captcha...');
  const result = await client.solvePopularCaptchaToken({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const token = extractToken(result);
  console.log(`Token received (${token.length} chars)`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    await page.evaluate((t) => {
      document.querySelectorAll<HTMLTextAreaElement>('[name="h-captcha-response"], [name="g-recaptcha-response"]').forEach(
        (el) => { el.value = t; }
      );
    }, token);
    console.log('Token injected');

    await page.click('button[type="submit"]').catch(() =>
      page.evaluate(() => (document.querySelector('form') as HTMLFormElement)?.submit())
    );
    await page.waitForTimeout(3000);
    console.log('Submitted!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
