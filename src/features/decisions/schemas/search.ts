import { z } from "zod";

export const decisionsSearchSchema = z.object({
  status: z.enum(["active", "superseded", "revoked", "candidate"]).optional(),
  explicitness: z.enum(["explicit", "inferred", "user_confirmed"]).optional(),
});

export type DecisionsSearch = z.infer<typeof decisionsSearchSchema>;
