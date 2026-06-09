// Cloudflare Turnstile — Extension Method (Playwright + CaptchaSonic Extension)
// Setup: Copy .env.example to .env, add API key + extension path
// Usage: npm run turnstile:ext

import { launchWithExtension, waitForExtensionSolve, sleep } from '../../shared/helpers';

const SITE_URL = 'https://2captcha.com/demo/cloudflare-turnstile';

async function main() {
  console.log('CaptchaSonic — Cloudflare Turnstile Extension Method');
  console.log(`Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    console.log('Waiting for extension to solve Turnstile...');
    const solved = await waitForExtensionSolve(page, 120_000);

    if (!solved) {
      console.log('Extension solve timed out');
      return;
    }

    console.log('Turnstile solved by extension!');
    await page.click('button[type="submit"]').catch(() =>
      page.evaluate(() => (document.querySelector('form') as HTMLFormElement)?.submit())
    );
    await page.waitForTimeout(3000);
    console.log('Submitted!');
  } finally {
    await context.close();
  }
}

main().catch(console.error);
