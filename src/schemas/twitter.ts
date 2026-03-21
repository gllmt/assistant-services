import { z } from "zod";

export const twitterPostSchema = z.object({
  text: z.string().min(1).max(280)
});
