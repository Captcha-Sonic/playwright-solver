/**
 * AWS WAF — Token Method (Playwright + CaptchaSonic)
 * ====================================================
 * Captures AWS WAF captcha tiles, sends to CaptchaSonic for
 * AI classification, and clicks the correct tiles.
 *
 * Setup:  Add your API key to .env (see .env.example)
 * Usage:  npm run aws-waf
 */

import { chromium, Page } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';

const SITE_URL = 'https://efw47fpad9.execute-api.us-east-1.amazonaws.com/latest';

async function getWafTiles(page: Page): Promise<{ tiles: Buffer[]; question: string }> {
  await page.waitForSelector('[id*="captcha"] img, .challenge-image', { timeout: 20000 });

  const question = await page.$eval(
    '[id*="captcha-header"], .challenge-header',
    (el) => el.textContent?.trim() ?? ''
  ).catch(() => '');

  if (!question) {
    console.warn('  ⚠️  Could not extract question text from page — check selectors');
  }

  const tileEls = await page.$$('[id*="captcha"] img, .challenge-image img');
  const tiles: Buffer[] = [];
  for (const el of tileEls) {
    tiles.push(await el.screenshot());
  }

  return { tiles, question };
}

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — AWS WAF Captcha Solver (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    const { tiles, question } = await getWafTiles(page);
    console.log(`  Question: '${question}'`);
    console.log(`  Tiles: ${tiles.length}`);

    console.log('⏳ Sending to CaptchaSonic...');
    const result = await client.solveAwsWaf(tiles, question);

    const r = result as Record<string, unknown>;
    const grid = (r.typedSolution as Record<string, unknown> | undefined)?.grid as Record<string, unknown> | undefined;
    const objects: boolean[] = (grid?.objects as boolean[]) ?? [];
    const clickIndices = objects.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    console.log(`  ✅ Click indices: ${clickIndices}`);

    const tileEls = await page.$$('[id*="captcha"] img, .challenge-image img');
    for (const i of clickIndices) {
      if (i < tileEls.length) {
        await tileEls[i].click();
        await sleep(300);
      }
    }

    await page.click('button[type="submit"], .challenge-submit').catch(() => {});
    await sleep(3000);
    console.log('  ✅ AWS WAF solved!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
