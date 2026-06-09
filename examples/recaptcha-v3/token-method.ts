// reCAPTCHA v3 — Token Method (Playwright + CaptchaSonic)
// Setup: Add your API key to .env (see .env.example)
// Usage: npm run recaptcha-v3

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, extractToken, injectRecaptchaToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php';
const SITE_KEY = '6LdyC2cUAAAAACGuDKpXeDorzUDWXmdqeg-xy696';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — reCAPTCHA v3 Score Token');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  console.log('Solving reCAPTCHA v3...');
  const result = await client.solveRecaptchaV3Token({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const token = extractToken(result);
  console.log(`Token received (${token.length} chars)`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await injectRecaptchaToken(page, token);
    console.log('Token injected');

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });
    await page.waitForTimeout(3000);
    console.log('Submitted!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
