// Shared helper utilities for CaptchaSonic Playwright examples.

import 'dotenv/config';
import { Page } from 'playwright';

export function getApiKey(): string {
  const key = process.env.CAPTCHASONIC_API_KEY ?? '';
  if (!key) {
    throw new Error(
      'CAPTCHASONIC_API_KEY is not set.\n' +
      'Get your key at: https://captchasonic.com\n' +
      'Then add it to your .env file: CAPTCHASONIC_API_KEY=sonic_your_key_here'
    );
  }
  return key;
}

export async function printBalance(client: any): Promise<void> {
  try {
    const balance: number = await client.getBalance();
    console.log(`Balance: $${balance.toFixed(4)}`);
  } catch (e) {
    console.log(`Could not fetch balance: ${(e as Error).message}`);
  }
}

export function extractToken(result: unknown): string {
  const r = result as Record<string, unknown>;
  const solution = (r.solution ?? r) as Record<string, string>;
  const token =
    solution['gRecaptchaResponse'] ??
    solution['token'] ??
    solution['cf-turnstile-response'] ??
    '';
  if (!token) {
    throw new Error(`No token found in result: ${JSON.stringify(r)}`);
  }
  return token;
}

export async function injectRecaptchaToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    const ta = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement | null;
    if (ta) {
      ta.style.display = 'block';
      ta.value = t;
    }
    document.querySelectorAll<HTMLTextAreaElement>('[name="g-recaptcha-response"]').forEach(
      (el) => { el.value = t; }
    );
  }, token);
}

export async function injectTurnstileToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    document.querySelectorAll<HTMLInputElement>('[name="cf-turnstile-response"]').forEach(
      (el) => { el.value = t; }
    );
  }, token);
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
