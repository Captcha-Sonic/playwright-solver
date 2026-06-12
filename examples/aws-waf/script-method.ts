// AWS WAF — Script Method (Playwright + CaptchaSonic)
// Usage: npm run aws-waf:script

import { chromium } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';
import { ScriptSolver } from '../../shared/solver';

const SITE_URL = 'https://efw47fpad9.execute-api.us-east-1.amazonaws.com/latest';

async function main() {
  const apiKey = getApiKey();
  console.log('CaptchaSonic — AWS WAF Script Method');
  console.log(`Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    const solver = new ScriptSolver(page, client);
    const result = await solver.solve('aws_waf', { timeout: 120, maxRetries: 5 });

    console.log(`\n  Result: ${JSON.stringify(result)}`);
    if (result.solved) console.log('\n  ✅ AWS WAF solved!');
    await sleep(5000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
