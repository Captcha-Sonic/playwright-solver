// AWS WAF — Extension Method (Playwright + CaptchaSonic Extension)
// Setup: Copy .env.example to .env, add API key + extension path
// Usage: npm run aws-waf:ext

import { launchWithExtension, sleep } from '../../shared/helpers';

const SITE_URL = 'https://efw47fpad9.execute-api.us-east-1.amazonaws.com/latest';

async function main() {
  console.log('CaptchaSonic — AWS WAF Extension Method');
  console.log(`Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('Waiting for extension to solve AWS WAF...');

    let challengeAppeared = false;
    const challengeDeadline = Date.now() + 15_000;
    while (Date.now() < challengeDeadline) {
      const challenge = await page.$('[id*="captcha"], .challenge-image, #captcha-container');
      if (challenge) { challengeAppeared = true; break; }
      await sleep(1000);
    }

    if (!challengeAppeared) {
      console.log('AWS WAF challenge did not appear — page may not have a captcha');
    }

    const deadline = Date.now() + 120_000;
    let solved = false;
    while (Date.now() < deadline) {
      try {
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
      console.log('AWS WAF solved by extension!');
    } else {
      console.log('Extension solve timed out');
    }
  } finally {
    await context.close();
  }
}

main().catch(console.error);
