# CaptchaSonic Playwright Examples — Solve Any Captcha in TypeScript

> **Automate captcha solving** with [Playwright](https://playwright.dev) and the [CaptchaSonic](https://captchasonic.com) API. Works with reCAPTCHA v2, reCAPTCHA v3, Cloudflare Turnstile, Geetest v4, AWS WAF, and image captchas.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Captcha-Sonic/playwright-solver.git
cd captchasonic-playwright-examples
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Configure your API key
cp .env.example .env
# Edit .env and add your API key

# 4. Run any example
npm run recaptcha-v2
```

Get your API key at [captchasonic.com](https://captchasonic.com).

---

## Supported Captcha Types

| Captcha | Token Method | Script Method | Run Command |
|---------|:---:|:---:|---|
| reCAPTCHA v2 | ✅ | ✅ | `npm run recaptcha-v2` |
| reCAPTCHA v3 | ✅ | — | `npm run recaptcha-v3` |
| Cloudflare Turnstile | ✅ | — | `npm run turnstile` |
| Geetest v4 | ✅ | ✅ | `npm run geetest` |
| AWS WAF | ✅ | ✅ | `npm run aws-waf` |
| Image Captcha (OCR) | ✅ | — | `npm run image-captcha` |
| Popular Captcha | ✅ | ✅ | `npm run popularcaptcha` |

---

## Two Ways to Solve

### Token Method (`token-method.ts`)

Uses the CaptchaSonic API to solve captchas **server-side** — no visible browser interaction needed.

```
Your script → CaptchaSonic API → returns token → inject into page → submit
```

Best for: **headless automation**, **CI/CD pipelines**, **maximum speed**

### Script Method (`script-method.ts`)

Injects lightweight JS scripts into the page that detect, extract, and click captcha challenges using the CaptchaSonic image classification API.

```
Inject script → detect captcha → extract images → SDK classifies → inject clicks
```

Best for: **Popular Captcha**, **Geetest**, **AWS WAF**, and any visual challenge captcha

---

## Project Structure

```
captchasonic-playwright-examples/
├── scripts/                            # Vendored JS captcha scripts
│   ├── popularcaptcha.js
│   ├── recaptcha-v2.js
│   ├── geetest.js
│   └── aws-waf.js
├── shared/
│   ├── helpers.ts                      # Reusable utilities
│   └── solver.ts                       # ScriptSolver bridge class
├── examples/
│   ├── recaptcha-v2/
│   │   ├── token-method.ts
│   │   └── script-method.ts
│   ├── recaptcha-v3/
│   │   └── token-method.ts
│   ├── turnstile/
│   │   └── token-method.ts
│   ├── geetest/
│   │   ├── token-method.ts
│   │   └── script-method.ts
│   ├── aws-waf/
│   │   ├── token-method.ts
│   │   └── script-method.ts
│   ├── image-captcha/
│   │   └── token-method.ts
│   └── popularcaptcha/
│       ├── token-method.ts
│       └── script-method.ts
├── package.json
└── tsconfig.json
```

---

## All Commands

```bash
# Token method (API-based)
npm run recaptcha-v2
npm run recaptcha-v3
npm run turnstile
npm run geetest
npm run aws-waf
npm run image-captcha
npm run popularcaptcha

# Script method (JS injection)
npm run recaptcha-v2:script
npm run geetest:script
npm run aws-waf:script
npm run popularcaptcha:script
```

---

## Environment Variables

```bash
cp .env.example .env
```

```env
CAPTCHASONIC_API_KEY=sonic_your_key_here
```

| Variable | Required | Description |
|---|:---:|---|
| `CAPTCHASONIC_API_KEY` | ✅ | Your CaptchaSonic API key (`sonic_xxx`) |

---

## Adapt to Your Site

Each example targets a public demo page. To use on your own site:

1. Open any `token-method.ts`
2. Change `SITE_URL` to your target page
3. Change `SITE_KEY` to the captcha key on that page
4. Run the script

```typescript
const SITE_URL = 'https://yoursite.com/login';
const SITE_KEY = 'your-site-key-here';
```

---

## Requirements

- **Node.js** ≥ 18
- **Playwright** — installed automatically via `npm install`
- **CaptchaSonic API key** — [get one here](https://captchasonic.com)

---

## Resources

- [CaptchaSonic Documentation](https://docs.captchasonic.com)
- [CaptchaSonic Dashboard](https://captchasonic.com)
- [Playwright Documentation](https://playwright.dev)
- [Puppeteer TypeScript Examples](https://github.com/Captcha-Sonic/puppeteer-solver)
- [Selenium Python Examples](https://github.com/Captcha-Sonic/selenium-python-solver)

---

## License

MIT — free to use in commercial projects.
