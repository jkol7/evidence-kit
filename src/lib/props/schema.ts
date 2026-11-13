import { z } from "zod";
import type { Prop, UnlockRule } from "./types";

/**
 * Runtime validation for props. Each schema is annotated with its TypeScript
 * type (`z.ZodType<...>`), so if the two ever disagree, typecheck fails.
 */

const nonEmpty = z.string().trim().min(1);
const id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "ids use lowercase letters, numbers and dashes");
const hintAfterAttempts = z.number().int().min(1).max(50).optional();

export const unlockRuleSchema: z.ZodType<UnlockRule> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("none") }),
    z.object({
      type: z.literal("passcode"),
      code: z.string().regex(/^\d{4,8}$/, "passcodes are 4 to 8 digits"),
      hint: nonEmpty.optional(),
      hintAfterAttempts,
    }),
    z.object({
      type: z.literal("keyword"),
      answers: z.array(nonEmpty).min(1),
      prompt: nonEmpty.optional(),
      hint: nonEmpty.optional(),
      hintAfterAttempts,
    }),
    z.object({ type: z.literal("gm"), label: nonEmpty.optional() }),
    z.object({
      type: z.literal("time"),
      at: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "must be an ISO date"),
    }),
    z.object({ type: z.literal("after"), requires: z.array(id).min(1) }),
    z.object({ type: z.literal("all"), rules: z.array(unlockRuleSchema).min(1) }),
    z.object({ type: z.literal("any"), rules: z.array(unlockRuleSchema).min(1) }),
  ]),
);

const lockable = { id, lock: unlockRuleSchema.optional() };
const colorPair = z.tuple([nonEmpty, nonEmpty]);

const phoneContentSchema = z.object({
  ownerName: nonEmpty,
  clock: nonEmpty,
  wallpaper: colorPair,
  threads: z.array(
    z.object({
      ...lockable,
      contact: nonEmpty,
      messages: z.array(
        z.object({ from: z.enum(["owner", "contact"]), text: nonEmpty, at: nonEmpty }),
      ),
    }),
  ),
  photos: z.array(
    z.object({
      ...lockable,
      caption: nonEmpty,
      takenAt: nonEmpty,
      src: z.url().optional(),
      tint: colorPair.optional(),
    }),
  ),
  notes: z.array(z.object({ ...lockable, title: nonEmpty, body: nonEmpty, updatedAt: nonEmpty })),
  calls: z.array(
    z.object({
      contact: nonEmpty,
      direction: z.enum(["incoming", "outgoing", "missed"]),
      at: nonEmpty,
      durationSec: z.number().int().min(0).optional(),
    }),
  ),
  voicemails: z.array(
    z.object({
      ...lockable,
      from: nonEmpty,
      at: nonEmpty,
      transcript: nonEmpty,
      durationSec: z.number().int().min(0),
    }),
  ),
});

export const propSchema: z.ZodType<Prop> = z.object({
  ...lockable,
  schemaVersion: z.literal(1),
  kind: z.literal("phone"),
  title: nonEmpty,
  gmNotes: z.string().optional(),
  content: phoneContentSchema,
});

export type ParseResult = { ok: true; prop: Prop } | { ok: false; errors: string[] };

/** Checks unknown input (an editor save, a JSON import) and returns a prop or readable errors. */
export function parseProp(input: unknown): ParseResult {
  const result = propSchema.safeParse(input);
  if (result.success) return { ok: true, prop: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}