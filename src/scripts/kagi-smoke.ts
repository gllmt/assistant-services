import process from "node:process";

import { z } from "zod";

import { env } from "../config/env.js";

const smokeResponseSchema = z.object({
  query: z.string().min(1),
  provider: z.literal("kagi"),
  mode: z.string().min(1),
  count: z.number().int().positive(),
  tookMs: z.number().int().nonnegative(),
  results: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
        description: z.string().optional(),
        published: z.string().optional()
      })
    )
    .min(1)
});

async function main() {
  const query = process.argv[2] ?? "react server components";
  const url = new URL(`http://${env.HOST}:${env.PORT}/search/kagi`);

  url.searchParams.set("q", query);
  url.searchParams.set("count", "3");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(
        `Smoke test failed with ${response.status} ${response.statusText}: ${bodyText || "empty body"}`
      );
    }

    const parsed = smokeResponseSchema.parse(JSON.parse(bodyText));

    process.stdout.write(
      [
        "Kagi smoke test passed",
        `query: ${parsed.query}`,
        `mode: ${parsed.mode}`,
        `results: ${parsed.count}`,
        `top result: ${parsed.results[0]?.title}`
      ].join("\n") + "\n"
    );
  } catch (error) {
    if (controller.signal.aborted) {
      process.stderr.write(
        `Kagi smoke test timed out while calling ${url.toString()}. Ensure the server is running and the Kagi browser session is healthy.\n`
      );
    } else if (error instanceof TypeError) {
      process.stderr.write(
        `Kagi smoke test could not reach ${url.toString()}. Start the service first with pnpm dev or pnpm start.\n`
      );
    } else {
      process.stderr.write(
        `${error instanceof Error ? error.message : "Kagi smoke test failed unexpectedly"}\n`
      );
    }

    process.stderr.write("If Kagi asks for authentication again, run pnpm kagi:login.\n");
    process.exit(1);
  } finally {
    clearTimeout(timeoutId);
  }
}

await main();
