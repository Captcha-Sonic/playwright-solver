// Image-to-Text (OCR) — Extension Method (Playwright + CaptchaSonic Extension)
// Setup: Copy .env.example to .env, add API key + extension path
// Usage: npm run image-captcha:ext

import { launchWithExtension, sleep } from '../../shared/helpers';

const SITE_URL = 'https://captcha.com/demos/features/captcha-demo.aspx';
const CAPTCHA_INPUT_SELECTOR = '#captchaCode';
const SUBMIT_SELECTOR = '#validateCaptchaButton';

async function main() {
  console.log('CaptchaSonic — Image OCR Extension Method');
  console.log(`Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('Waiting for extension to solve image captcha...');

    const deadline = Date.now() + 120_000;
    let solved = false;
    while (Date.now() < deadline) {
      try {
        const value = await page.$eval(CAPTCHA_INPUT_SELECTOR, (el) => (el as HTMLInputElement).value);
        if (value.length > 0) {
          console.log(`Extension filled: '${value}'`);
          solved = true;
          break;
        }
        const extSolved = await page.evaluate(() => (window as any).captchaSolved === true);
        if (extSolved) { solved = true; break; }
      } catch { /* keep polling */ }
      await sleep(2000);
    }

    if (solved) {
      console.log('Image captcha solved by extension!');
      await page.click(SUBMIT_SELECTOR);
      await page.waitForTimeout(3000);
      console.log('Submitted!');
    } else {
      console.log('Extension solve timed out');
    }
  } finally {
    await context.close();
  }
}

main().catch(console.error);
