/**
 * Image-to-Text (OCR) Captcha Solver (Playwright)
 * ================================================
 * Extract a captcha image from the page, send to CaptchaSonic OCR,
 * and type the result into the input field.
 *
 * Usage:
 *   npx ts-node examples/image-captcha/image-to-text.ts
 */

import { chromium, Page } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance } from '../../shared/helpers';

const SITE_URL = 'https://captcha.com/demos/features/captcha-demo.aspx';
const CAPTCHA_IMG_SELECTOR = '#demoCaptcha_CaptchaImage';
const CAPTCHA_INPUT_SELECTOR = '#captchaCode';
const SUBMIT_SELECTOR = '#validateCaptchaButton';

async function getCaptchaImageBuffer(page: Page): Promise<Buffer> {
  const imgEl = await page.$(CAPTCHA_IMG_SELECTOR);
  if (!imgEl) throw new Error(`Captcha image not found: ${CAPTCHA_IMG_SELECTOR}`);

  const src = await imgEl.getAttribute('src') ?? '';
  if (src.startsWith('data:')) {
    const b64 = src.split(',')[1];
    return Buffer.from(b64, 'base64');
  }

  return imgEl.screenshot();
}

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — Image-to-Text OCR Solver (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey);
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector(CAPTCHA_IMG_SELECTOR);

    const imgBuffer = await getCaptchaImageBuffer(page);
    console.log(`  📸 Captured captcha (${imgBuffer.length} bytes)`);

    console.log('  ⏳ Sending to CaptchaSonic OCR...');
    const result = await client.solveOcr({ images: [imgBuffer] });

    const r = result as Record<string, unknown>;
    const typed = r.typedSolution as Record<string, unknown> | undefined;
    const captchaText: string = (typed?.text as Record<string, string[]> | undefined)?.texts?.[0] ?? '';
    console.log(`  ✅ Solved: '${captchaText}'`);

    await page.fill(CAPTCHA_INPUT_SELECTOR, captchaText);
    await page.click(SUBMIT_SELECTOR);
    await page.waitForTimeout(3000);
    console.log('  ✅ Submitted!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
