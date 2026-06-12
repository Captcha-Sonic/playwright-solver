// reCAPTCHA v2 — Script Method (Playwright + CaptchaSonic)
// Usage: npm run recaptcha-v2:script

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';
import { ScriptSolver } from '../../shared/solver';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — reCAPTCHA v2 Script Method');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('iframe[src*="recaptcha"]', { timeout: 15000 });
    console.log('  ✅ reCAPTCHA iframe found');

    // Click checkbox
    const anchorFrame = page.frameLocator('iframe[src*="anchor"]').first();
    await anchorFrame.locator('#recaptcha-anchor').click({ timeout: 5000 }).catch(() => {});
    console.log('  ✅ Clicked reCAPTCHA checkbox');
    await sleep(2000);

    // Find bframe (challenge iframe)
    const frames = page.frames();
    const bframe = frames.find(f => f.url().includes('bframe'));

    if (!bframe) {
      console.log('  ❌ Could not find challenge bframe');
      return;
    }

    const solver = new ScriptSolver(bframe, client);
    const result = await solver.solve('recaptcha_v2', { timeout: 120, maxRetries: 5 });

    console.log(`\n  Result: ${JSON.stringify(result)}`);
    if (result.solved) console.log('\n  ✅ reCAPTCHA solved!');
    await sleep(5000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
