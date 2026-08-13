import { z } from "zod";

export const questionsSearchSchema = z.object({
  status: z.enum(["open", "resolved", "dismissed"]).optional(),
});

export type QuestionsSearch = z.infer<typeof questionsSearchSchema>;
