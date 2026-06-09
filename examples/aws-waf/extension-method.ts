/**
 * AWS WAF — Extension Method (Playwright + CaptchaSonic Extension)
 * =================================================================
 * Loads the CaptchaSonic browser extension into Chromium.
 * The extension auto-detects and solves AWS WAF challenges.
 *
 * Setup:
 *   1. Copy .env.example to .env and add your API key + extension path
 *   2. npm run aws-waf:ext
 */

import { launchWithExtension, sleep } from '../../shared/helpers';

const SITE_URL = 'https://efw47fpad9.execute-api.us-east-1.amazonaws.com/latest';

async function main() {
  console.log('🔊 CaptchaSonic — AWS WAF Extension Method (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('🌐 Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('⏳ Waiting for extension to solve AWS WAF...');

    // First, wait for the AWS WAF challenge to actually appear
    let challengeAppeared = false;
    const challengeDeadline = Date.now() + 15_000;
    while (Date.now() < challengeDeadline) {
      const challenge = await page.$('[id*="captcha"], .challenge-image, #captcha-container');
      if (challenge) { challengeAppeared = true; break; }
      await sleep(1000);
    }

    if (!challengeAppeared) {
      console.log('  ⚠️  AWS WAF challenge did not appear — page may not have a captcha');
    }

    // Now wait for the extension to solve it
    const deadline = Date.now() + 120_000;
    let solved = false;
    while (Date.now() < deadline) {
      try {
        // If challenge appeared but is now gone, it was solved
        if (challengeAppeared) {
          const challenge = await page.$('[id*="captcha"], .challenge-image, #captcha-container');
          if (!challenge) { solved = true; break; }
        }

        const extSolved = await page.evaluate(() => (window as any).captchaSolved === true);
        if (extSolved) { solved = true; break; }
      } catch { /* keep polling */ }
      await sleep(2000);
    }

    if (solved) {
      console.log('  ✅ AWS WAF solved by extension!');
    } else {
      console.log('  ⚠️  Extension solve timed out');
    }
  } finally {
    await context.close();
  }
}

main().catch(console.error);
