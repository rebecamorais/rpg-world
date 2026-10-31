import { z } from 'zod';

// Shape and sanity limits only. Game rules (name length...) stay in the domain, which reports
// them with translated error codes.

export const partyParamsSchema = z.object({ partyId: z.uuid() });

export const partyNameSchema = z.object({ name: z.string().max(100) });
