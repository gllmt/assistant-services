import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";

import { chromium } from "playwright-core";

import { env } from "../config/env.js";
import { buildKagiSessionBootstrapUrl } from "../services/kagi/session.js";

async function main() {
  const profileDir = resolveProfileDir(env.KAGI_BROWSER_PROFILE_DIR);
  await mkdir(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: env.KAGI_BROWSER_EXECUTABLE_PATH,
    headless: false,
    viewport: {
      width: 1440,
      height: 1200
    },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  const page = await context.newPage();
  const bootstrapUrl =
    buildKagiSessionBootstrapUrl(env.KAGI_WEB_BASE_URL, {
      sessionLink: env.KAGI_SESSION_LINK,
      sessionToken: env.KAGI_SESSION_TOKEN
    }) ??
    new URL("/search", env.KAGI_WEB_BASE_URL).toString();

  try {
    await page.goto(bootstrapUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });

    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    process.stdout.write(`Kagi profile opened at ${profileDir}\n`);
    process.stdout.write("Finish sign-in if needed, then press Enter here to close the browser.\n");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await rl.question("");
    rl.close();
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

function resolveProfileDir(rawProfileDir: string) {
  if (path.isAbsolute(rawProfileDir)) {
    return rawProfileDir;
  }

  return path.resolve(process.cwd(), rawProfileDir);
}

await main().catch((error) => {
  console.error(error);
  process.exit(1);
});
