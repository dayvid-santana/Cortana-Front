import { z } from "zod";

export const filesSearchSchema = z.object({
  path: z.string().optional(),
  commit: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  view: z.enum(["source", "diff"]).default("source"),
});

export type FilesSearch = z.infer<typeof filesSearchSchema>;
