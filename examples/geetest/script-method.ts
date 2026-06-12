// Geetest v4 — Script Method (Playwright + CaptchaSonic)
// Usage: npm run geetest:script

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';
import { ScriptSolver } from '../../shared/solver';

const SITE_URL = 'https://gt4.geetest.com/static/test.html';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — Geetest v4 Script Method');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // Click Geetest trigger
    await page.click('.geetest_btn, button[class*="geetest"], .btn').catch(() => {});
    console.log('  ✅ Clicked Geetest trigger');
    await sleep(2000);

    // Geetest runs in the main page context (no iframes)
    const solver = new ScriptSolver(page, client);
    const result = await solver.solve('geetest', { timeout: 120, maxRetries: 5 });

    console.log(`\n  Result: ${JSON.stringify(result)}`);
    if (result.solved) console.log('\n  ✅ Geetest solved!');
    await sleep(5000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
