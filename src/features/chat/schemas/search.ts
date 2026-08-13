import { z } from "zod";

export const chatSearchSchema = z.object({
  commit: z.string().optional(),
  scope: z.enum(["docs", "code"]).default("docs"),
  thread: z.string().optional(),
});

export type ChatSearch = z.infer<typeof chatSearchSchema>;
