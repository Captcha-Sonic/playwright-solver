/**
 * reCAPTCHA v3 — Score Token Method (Playwright)
 * ===============================================
 * reCAPTCHA v3 runs invisibly — no images, no checkbox.
 * CaptchaSonic returns a high-score token to inject.
 *
 * Usage:
 *   npx ts-node examples/recaptcha-v3/score-token.ts
 */

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, injectRecaptchaToken, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php';
const SITE_KEY = '6LdyC2cUAAAAACGuDKpXeDorzUDWXmdqeg-xy696';

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — reCAPTCHA v3 Score Token (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey);
  await printBalance(client);

  console.log('⏳ Solving reCAPTCHA v3...');
  const result = await client.solveRecaptchaV3Token({
    websiteURL: SITE_URL,
    websiteKey: SITE_KEY,
  });

  const res = result as Record<string, unknown>;
  const token: string = (res.solution as Record<string, string>)['gRecaptchaResponse'];
  console.log(`  ✅ Token received (${token.length} chars)`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    await injectRecaptchaToken(page, token);
    console.log('  ✅ Token injected');

    // Submit
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });

    await page.waitForTimeout(3000);
    console.log('  ✅ Submitted!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
