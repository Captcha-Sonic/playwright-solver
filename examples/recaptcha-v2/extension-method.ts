/**
 * reCAPTCHA v2 — Extension Method (Playwright + CaptchaSonic Extension)
 * =====================================================================
 * Loads the CaptchaSonic browser extension into Chromium.
 * The extension auto-detects and solves reCAPTCHA v2 on the page.
 *
 * Setup:
 *   1. Copy .env.example to .env and add your API key + extension path
 *   2. npm run recaptcha-v2:ext
 * Usage:  npm run recaptcha-v2:ext
 */

import { launchWithExtension, waitForExtensionSolve, sleep } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php';

async function main() {
  console.log('🔊 CaptchaSonic — reCAPTCHA v2 Extension Method (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('🌐 Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('⏳ Waiting for extension to solve reCAPTCHA v2...');
    const solved = await waitForExtensionSolve(page, 120_000);

    if (!solved) {
      console.log('  ⚠️  Extension solve timed out');
      return;
    }

    console.log('  ✅ reCAPTCHA v2 solved by extension!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  ✅ Form submitted successfully!');
  } finally {
    await context.close();
  }
}

main().catch(console.error);
