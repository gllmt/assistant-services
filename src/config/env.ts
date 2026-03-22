import "dotenv/config";

import path from "node:path";

import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4318),
  HOST: z.string().default("127.0.0.1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  KAGI_API_KEY: z.string().min(1).optional(),
  KAGI_BASE_URL: z.string().url().default("https://kagi.com/api/v0"),
  KAGI_WEB_BASE_URL: z.string().url().default("https://kagi.com"),
  KAGI_SEARCH_MODE: z.enum(["auto", "api", "browser_session", "session_html"]).default("auto"),
  KAGI_SESSION_LINK: z.string().url().optional(),
  KAGI_SESSION_TOKEN: z.string().min(1).optional(),
  KAGI_BROWSER_EXECUTABLE_PATH: z
    .string()
    .default("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
  KAGI_BROWSER_PROFILE_DIR: z
    .string()
    .default(path.join(process.cwd(), ".profiles", "kagi-browser")),
  KAGI_BROWSER_HEADLESS: booleanFromEnv.default(true)
});

export const env = envSchema.parse(process.env);
