import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4318),
  HOST: z.string().default("127.0.0.1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  KAGI_API_KEY: z.string().min(1).optional(),
  KAGI_BASE_URL: z.string().url().default("https://kagi.com/api/v0")
});

export const env = envSchema.parse(process.env);
