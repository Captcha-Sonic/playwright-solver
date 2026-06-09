/**
 * reCAPTCHA v3 — Extension Method (Playwright + CaptchaSonic Extension)
 * =====================================================================
 * Loads the CaptchaSonic browser extension into Chromium.
 * The extension auto-detects and solves reCAPTCHA v3 invisibly.
 *
 * Setup:
 *   1. Copy .env.example to .env and add your API key + extension path
 *   2. npm run recaptcha-v3:ext
 * Usage:  npm run recaptcha-v3:ext
 */

import { launchWithExtension, waitForExtensionSolve, sleep } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php';

async function main() {
  console.log('🔊 CaptchaSonic — reCAPTCHA v3 Extension Method (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('🌐 Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('⏳ Waiting for extension to solve reCAPTCHA v3...');
    const solved = await waitForExtensionSolve(page, 120_000);

    if (!solved) {
      console.log('  ⚠️  Extension solve timed out');
      return;
    }

    console.log('  ✅ reCAPTCHA v3 solved by extension!');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });
    await page.waitForTimeout(3000);
    console.log('  ✅ Submitted!');
  } finally {
    await context.close();
  }
}

main().catch(console.error);
