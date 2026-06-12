// Popular Captcha (Popular Captcha) — Script Method (Playwright + CaptchaSonic)
// Usage: npm run popularcaptcha:script

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';
import { ScriptSolver } from '../../shared/solver';

const SITE_URL = 'https://accounts.popularcaptcha.com/demo';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — Popular Captcha Script Method');
  console.log(`Target: ${SITE_URL}`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to: ${SITE_URL}`);
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for Popular Captcha iframe
    await page.waitForSelector('iframe[src*="popularcaptcha"]', { timeout: 15000 });
    console.log('  ✅ Popular Captcha iframe found');

    // Click the checkbox
    const widgetFrame = page.frameLocator('iframe[src*="popularcaptcha"]').first();
    await widgetFrame.locator('#checkbox, #anchor').click({ timeout: 5000 }).catch(() => {});
    console.log('  ✅ Clicked Popular Captcha checkbox');
    await sleep(2000);

    // Find challenge iframe
    const frames = page.frames();
    const challengeFrame = frames.find(f => /popularcaptcha.*challenge|captcha/.test(f.url()) && f.url().includes('popularcaptcha'));

    if (!challengeFrame) {
      console.log('  ❌ Could not find challenge iframe');
      return;
    }

    // Solve using ScriptSolver on the challenge frame
    const solver = new ScriptSolver(challengeFrame, client);
    const result = await solver.solve('popularcaptcha', { timeout: 120, maxRetries: 5 });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`  Result: ${JSON.stringify(result)}`);
    console.log(`${'='.repeat(50)}`);

    if (result.solved) {
      console.log('\n  ✅ Popular Captcha solved!');
    }

    await sleep(5000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
