import { z } from "zod";

// Bump this version whenever users need to accept revised terms.
export const CURRENT_TERMS_VERSION = "2026-11-12";
export const acceptTermsRequestSchema = z.object({
  accepted: z.literal(true),
  termsVersion: z.literal(CURRENT_TERMS_VERSION),
}).strict();
export type AcceptTermsRequest = z.infer<typeof acceptTermsRequestSchema>;
