import { z } from "zod";

export const watchSourceSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1)
});
