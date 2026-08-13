import { z } from "zod";

export const addProjectSchema = z.object({
  path: z.string().trim().min(1, "A repository path is required."),
  name: z.string().trim().optional(),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;
