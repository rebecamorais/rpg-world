import { z } from 'zod';

// Shape and sanity limits only. Game rules (name length...) stay in the domain, which reports
// them with translated error codes.

export const partyParamsSchema = z.object({ partyId: z.uuid() });

export const partyNameSchema = z.object({ name: z.string().max(100) });

export const memberParamsSchema = z.object({ partyId: z.uuid(), userId: z.uuid() });

export const inviteCodeParamsSchema = z.object({ code: z.string().regex(/^[a-f0-9]{32}$/) });

// Usernames picked before the a-z0-9_ rule may have other characters: the database finds them
export const inviteUsernameSchema = z.object({ username: z.string().min(1).max(60) });

export const myCharactersSchema = z.object({ characterIds: z.array(z.uuid()).max(20) });
