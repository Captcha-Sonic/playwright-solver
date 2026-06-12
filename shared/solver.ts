/**
 * ScriptSolver — Bridge between browser automation and CaptchaSonic SDK.
 *
 * Orchestrates the detect → extract → SDK solve → inject loop using
 * lightweight JS scripts that run inside the page context.
 *
 * Works with both Playwright and Puppeteer (same Page.evaluate() API).
 *
 * Usage:
 *   import { ScriptSolver } from '../shared/solver';
 *   const solver = new ScriptSolver(page, client);
 *   const result = await solver.solve('popularcaptcha');
 */

import fs from 'fs';
import path from 'path';
import { CaptchaSonic } from 'captchasonic';

type CaptchaType = 'popularcaptcha' | 'recaptcha_v2' | 'geetest' | 'aws_waf';

interface ScriptInfo {
  file: string;
  globalName: string;
}

interface DetectResult {
  found: boolean;
  type: string | null;
  widgetOnly?: boolean;
  solved: boolean;
  question?: string;
  [key: string]: unknown;
}

interface ExtractResult {
  images: string[];
  question: string;
  questionType: string;
  examples?: string[];
  choices?: string[];
  rows?: number;
  cols?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface InjectResult {
  success: boolean;
  solved?: boolean;
  error?: string;
  newChallenge?: boolean;
}

interface SolveResult {
  success: boolean;
  solved?: boolean;
  rounds?: number;
  time?: number;
  error?: string;
}

const SCRIPT_MAP: Record<CaptchaType, ScriptInfo> = {
  popularcaptcha:     { file: 'popularcaptcha.js',      globalName: 'CaptchaSonic_PopularCaptcha' },
  recaptcha_v2: { file: 'recaptcha-v2.js',   globalName: 'CaptchaSonic_RecaptchaV2' },
  geetest:      { file: 'geetest.js',        globalName: 'CaptchaSonic_Geetest' },
  aws_waf:      { file: 'aws-waf.js',        globalName: 'CaptchaSonic_AwsWaf' },
};

const SDK_METHOD_MAP: Record<CaptchaType, string> = {
  popularcaptcha:     'solvePopularCaptcha',
  recaptcha_v2: 'solveRecaptchaV2',
  geetest:      'solveGeetest',
  aws_waf:      'solveAwsWaf',
};

export class ScriptSolver {
  private page: any; // Playwright Page or Puppeteer Page
  private client: CaptchaSonic;
  private scriptsDir: string;
  private scriptCache: Map<string, string> = new Map();

  constructor(page: any, client: CaptchaSonic, scriptsDir?: string) {
    this.page = page;
    this.client = client;
    this.scriptsDir = scriptsDir || path.join(__dirname, '..', 'scripts');
  }

  /**
   * Main solve loop.
   */
  async solve(
    captchaType: CaptchaType,
    options: { timeout?: number; maxRetries?: number } = {},
  ): Promise<SolveResult> {
    const { timeout = 120, maxRetries = 5 } = options;
    const { file, globalName } = SCRIPT_MAP[captchaType];
    const startTime = Date.now();

    // Step 1: Inject script
    this.injectScript(file);
    console.log(`  📜 Script injected: ${file}`);

    // Step 2: Wait for detect
    const detectResult = await this.waitForDetect(globalName, 30_000);
    if (!detectResult?.found) {
      return { success: false, error: 'no_captcha_detected', time: (Date.now() - startTime) / 1000 };
    }
    console.log(`  🔍 Captcha detected: type=${detectResult.type}`);

    // Step 3–6: Extract → Solve → Inject loop
    for (let round = 1; round <= maxRetries; round++) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > timeout) {
        return { success: false, error: 'timeout', rounds: round - 1, time: elapsed };
      }

      console.log(`\n  ── Round ${round}/${maxRetries} ──`);

      // Step 3: Extract
      const data = await this.extract(globalName);
      if (!data || data.error) {
        console.log(`  ❌ Extract failed: ${data?.error || 'null'}`);
        if (round < maxRetries) { await this.sleep(2000); continue; }
        return { success: false, error: data?.error || 'extract_failed', rounds: round, time: (Date.now() - startTime) / 1000 };
      }

      console.log(`  📸 Extracted: ${data.images.length} images, question='${(data.question || '').slice(0, 50)}...', type=${data.questionType}`);

      // Step 4: Call SDK
      let sdkResult: any;
      try {
        sdkResult = await this.callSdk(captchaType, data);
        console.log(`  ✅ SDK response received`);
      } catch (e: any) {
        console.log(`  ❌ SDK error: ${e.message}`);
        if (round < maxRetries) { await this.sleep(2000); continue; }
        return { success: false, error: `sdk_error: ${e.message}`, rounds: round, time: (Date.now() - startTime) / 1000 };
      }

      // Step 5: Parse and inject
      const payload = this.buildInjectionPayload(sdkResult, data.questionType);
      if (!payload) {
        console.log(`  ❌ Could not parse SDK response`);
        if (round < maxRetries) { await this.sleep(2000); continue; }
        return { success: false, error: 'sdk_response_parse_failed', rounds: round, time: (Date.now() - startTime) / 1000 };
      }

      const injectResult = await this.injectSolution(globalName, payload);
      console.log(`  💉 Inject result: ${JSON.stringify(injectResult)}`);

      if (injectResult?.solved) {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`\n  🎉 Solved in ${totalTime.toFixed(1)}s (${round} round${round > 1 ? 's' : ''})`);
        return { success: true, solved: true, rounds: round, time: totalTime };
      }

      if (injectResult?.newChallenge) {
        console.log(`  🔄 New challenge appeared — continuing loop...`);
        await this.sleep(1000);
        this.injectScript(file);
        continue;
      }

      // Check solved after wait
      await this.sleep(2000);
      const check = await this.detect(globalName);
      if (check?.solved) {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`\n  🎉 Solved in ${totalTime.toFixed(1)}s (${round} round${round > 1 ? 's' : ''})`);
        return { success: true, solved: true, rounds: round, time: totalTime };
      }
    }

    return { success: false, error: 'max_retries_exceeded', rounds: maxRetries, time: (Date.now() - startTime) / 1000 };
  }

  // ── Internal Methods ────────────────────────────────────────────────────────

  private injectScript(scriptFile: string): void {
    if (!this.scriptCache.has(scriptFile)) {
      const scriptPath = path.join(this.scriptsDir, scriptFile);
      this.scriptCache.set(scriptFile, fs.readFileSync(scriptPath, 'utf8'));
    }
    this.page.evaluate(this.scriptCache.get(scriptFile)!);
  }

  private async detect(globalName: string): Promise<DetectResult | null> {
    try {
      return await this.page.evaluate(`${globalName}.detect()`);
    } catch { return null; }
  }

  private async waitForDetect(globalName: string, timeoutMs: number): Promise<DetectResult | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = await this.detect(globalName);
      if (result?.found) return result;
      await this.sleep(1000);
    }
    return null;
  }

  private async extract(globalName: string): Promise<ExtractResult | null> {
    try {
      return await this.page.evaluate(`${globalName}.extract()`);
    } catch (e: any) {
      return { error: e.message, images: [], question: '', questionType: '' };
    }
  }

  private async injectSolution(globalName: string, solution: any): Promise<InjectResult | null> {
    try {
      return await this.page.evaluate(
        `${globalName}.inject(${JSON.stringify(solution)})`,
      );
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  private async callSdk(captchaType: CaptchaType, data: ExtractResult): Promise<any> {
    // Convert base64 strings to Buffers for the SDK
    const imageBuffers = data.images.map((b64) => Buffer.from(b64, 'base64'));

    const methodName = SDK_METHOD_MAP[captchaType];
    const method = (this.client as any)[methodName].bind(this.client);

    const params: Record<string, any> = {
      images: imageBuffers,
      question: data.question,
    };

    if (captchaType === 'popularcaptcha') {
      params.questionType = data.questionType;
      if (data.examples?.length) {
        params.examples = data.examples.map((b64) => Buffer.from(b64, 'base64'));
      }
      if (data.metadata?.host) params.websiteURL = data.metadata.host as string;
      if (data.metadata?.sitekey) params.websiteKey = data.metadata.sitekey as string;
    } else if (captchaType === 'recaptcha_v2') {
      params.questionType = data.questionType;
    } else if (captchaType === 'geetest') {
      params.geetestType = data.questionType;
    }

    return method(params);
  }

  private buildInjectionPayload(sdkResult: any, questionType: string): any | null {
    try {
      const typed = sdkResult?.typed_solution || sdkResult?.typedSolution || {};

      if (typed.grid?.objects) return { objects: typed.grid.objects };
      if (typed.click) return { coordinates: typed.click };
      if (typed.drag) return { pairs: typed.drag };
      if (typed.slide) return { distance: typed.slide.distance };

      // Fallback: answers array
      const answers = sdkResult?.answers;
      if (answers) {
        if (questionType === 'objectClassify' || questionType === '33' || questionType === '44' || questionType === 'split_33' || questionType === 'nine') {
          return { objects: answers };
        }
        if (questionType === 'objectTag') return { answer: answers };
        if (questionType === 'objectClick' || questionType === 'click') return { coordinates: answers };
        return { objects: answers };
      }

      return null;
    } catch { return null; }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
