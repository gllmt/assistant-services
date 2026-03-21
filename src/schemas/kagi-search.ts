import { z } from "zod";

export const kagiSearchQuerySchema = z.object({
  q: z.string().min(1, "q is required"),
  count: z.coerce.number().int().min(1).max(10).default(5)
});
