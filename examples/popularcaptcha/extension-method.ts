/**
 * Popular Captcha — Extension Method (Playwright + CaptchaSonic Extension)
 * =========================================================================
 * Loads the CaptchaSonic browser extension into Chromium.
 * The extension auto-detects and solves popular captcha challenges.
 *
 * Setup:
 *   1. Copy .env.example to .env and add your API key + extension path
 *   2. npm run popularcaptcha:ext
 * Usage:  npm run popularcaptcha:ext
 */

import { launchWithExtension, waitForExtensionSolve, sleep } from '../../shared/helpers';

const SITE_URL = 'https://accounts.hcaptcha.com/demo';

async function main() {
  console.log('🔊 CaptchaSonic — Popular Captcha Extension Method (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('🌐 Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('⏳ Waiting for extension to solve Popular Captcha...');
    const solved = await waitForExtensionSolve(page, 120_000);

    if (!solved) {
      console.log('  ⚠️  Extension solve timed out');
      return;
    }

    console.log('  ✅ Popular Captcha solved by extension!');
    await page.click('button[type="submit"]').catch(() =>
      page.evaluate(() => (document.querySelector('form') as HTMLFormElement)?.submit())
    );
    await page.waitForTimeout(3000);
    console.log('  ✅ Submitted!');
  } finally {
    await context.close();
  }
}

main().catch(console.error);
