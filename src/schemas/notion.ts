import { z } from "zod";

export const notionCreatePageSchema = z.object({
  title: z.string().min(1)
});
