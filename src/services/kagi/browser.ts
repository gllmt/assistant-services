import { mkdir } from "node:fs/promises";
import path from "node:path";

import {
  chromium,
  type BrowserContext,
  type Page
} from "playwright-core";

import { AppError, UpstreamError } from "../../lib/errors.js";
import { inspectKagiHtml } from "./html.js";
import { buildKagiSessionBootstrapUrl } from "./session.js";
import type { KagiSearchParams, KagiSearchResult, KagiSearchResultItem } from "./types.js";

type BrowserDebugResult = {
  title: string;
  url: string;
  sampleAnchors: Array<{
    href: string;
    text: string;
    normalizedUrl?: string;
  }>;
  parsedResults: KagiSearchResultItem[];
};

type PersistentContextOptions = NonNullable<
  Parameters<typeof chromium.launchPersistentContext>[1]
>;

let contextPromise: Promise<BrowserContext> | null = null;
let contextKey: string | null = null;
let shutdownHooksInstalled = false;

export async function searchWithKagiBrowser(
  params: KagiSearchParams
): Promise<KagiSearchResult> {
  const startedAt = Date.now();
  const page = await createBrowserPage(params);

  try {
    const debug = await loadSearchPage(page, params);

    if (isKagiSignInPage(debug.title)) {
      throw createUnauthenticatedSessionError(params.browserProfileDir);
    }

    const results = debug.parsedResults.slice(0, params.count);
    if (results.length === 0) {
      throw new UpstreamError(
        "Kagi browser fallback loaded but returned no parsable search results",
        502,
        {
          upstreamBody: JSON.stringify({
            title: debug.title,
            url: debug.url
          })
        }
      );
    }

    return {
      query: params.query,
      provider: "kagi",
      mode: "browser_session",
      count: results.length,
      tookMs: Date.now() - startedAt,
      results,
      warning: "Using Kagi browser-session fallback because Search API access is unavailable."
    };
  } finally {
    await page.close().catch(() => {});
  }
}

export async function debugKagiBrowserSearch(params: KagiSearchParams) {
  const page = await createBrowserPage(params);

  try {
    const debug = await loadSearchPage(page, params);

    return {
      ...debug,
      profileDir: resolveProfileDir(params.browserProfileDir)
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function createBrowserPage(params: KagiSearchParams) {
  const context = await getPersistentContext(params);
  return context.newPage();
}

async function getPersistentContext(params: KagiSearchParams) {
  const profileDir = resolveProfileDir(params.browserProfileDir);
  const key = JSON.stringify({
    executablePath: params.browserExecutablePath,
    profileDir,
    headless: params.browserHeadless
  });

  if (!contextPromise || contextKey !== key) {
    contextKey = key;
    contextPromise = launchPersistentContext(params, profileDir);
  }

  return contextPromise;
}

async function launchPersistentContext(params: KagiSearchParams, profileDir: string) {
  await mkdir(profileDir, { recursive: true });

  const options: PersistentContextOptions = {
    executablePath: params.browserExecutablePath,
    headless: params.browserHeadless,
    viewport: {
      width: 1440,
      height: 1200
    },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  };

  const context = await chromium.launchPersistentContext(profileDir, options);

  if (!shutdownHooksInstalled) {
    shutdownHooksInstalled = true;
    const closeContext = async () => {
      if (!contextPromise) {
        return;
      }

      const activeContext = await contextPromise.catch(() => null);
      contextPromise = null;
      contextKey = null;
      await activeContext?.close().catch(() => {});
    };

    process.once("SIGINT", () => {
      void closeContext();
    });
    process.once("SIGTERM", () => {
      void closeContext();
    });
    process.once("exit", () => {
      void closeContext();
    });
  }

  return context;
}

async function bootstrapSession(page: Page, params: KagiSearchParams) {
  const sessionUrl = buildKagiSessionBootstrapUrl(params.webBaseUrl, params);
  if (!sessionUrl) {
    return;
  }

  await page.goto(sessionUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });

  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
}

async function loadSearchPage(page: Page, params: KagiSearchParams) {
  await navigateToSearch(page, params);

  let debug = await inspectSearchPage(page, params);
  if (!isKagiSignInPage(debug.title)) {
    return debug;
  }

  if (!buildKagiSessionBootstrapUrl(params.webBaseUrl, params)) {
    return debug;
  }

  await bootstrapSession(page, params);
  await navigateToSearch(page, params);
  debug = await inspectSearchPage(page, params);

  return debug;
}

async function navigateToSearch(page: Page, params: KagiSearchParams) {
  const searchUrl = new URL(`${params.webBaseUrl.replace(/\/$/, "")}/search`);
  searchUrl.searchParams.set("q", params.query);

  await page.goto(searchUrl.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });

  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
}

async function inspectSearchPage(
  page: Page,
  params: KagiSearchParams
): Promise<BrowserDebugResult> {
  const html = await page.content();
  const inspection = inspectKagiHtml(html, params.webBaseUrl);

  return {
    title: inspection.title,
    url: page.url(),
    sampleAnchors: inspection.sampleAnchors,
    parsedResults: inspection.parsedResults.slice(0, params.count)
  };
}

function isKagiSignInPage(title: string) {
  return title.toLowerCase().includes("sign in");
}

function createUnauthenticatedSessionError(browserProfileDir: string) {
  return new AppError(
    `Kagi browser session is not authenticated in profile ${resolveProfileDir(
      browserProfileDir
    )}. Run pnpm kagi:login to refresh the dedicated profile. If you need to sign in manually, set KAGI_BROWSER_HEADLESS=false and complete login once in that profile.`,
    502
  );
}

function resolveProfileDir(rawProfileDir: string) {
  if (path.isAbsolute(rawProfileDir)) {
    return rawProfileDir;
  }

  return path.resolve(process.cwd(), rawProfileDir);
}
