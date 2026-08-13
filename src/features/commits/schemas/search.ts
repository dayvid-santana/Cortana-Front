import { z } from "zod";

export const timelineSearchSchema = z.object({
  branch: z.string().optional(),
  status: z.enum(["pending", "analyzed", "failed"]).optional(),
});

export type TimelineSearch = z.infer<typeof timelineSearchSchema>;
