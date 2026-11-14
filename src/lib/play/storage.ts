import { z } from "zod";
import type { PlayState } from "@/lib/unlock";

/** Bump the version if PlayState's shape ever changes, so old saves are ignored. */
const KEY_PREFIX = "evidence-kit:play:v1:";

export const storageKey = (propId: string) => `${KEY_PREFIX}${propId}`;

const playStateSchema = z.object({
  solved: z.array(z.string()),
  revealed: z.array(z.string()),
  attempts: z.record(z.string(), z.number().int().min(0)),
});

/** Turns saved text back into a PlayState, or null if it's missing or damaged. */
export function parseStoredState(raw: string | null): PlayState | null {
  if (!raw) return null;
  try {
    const result = playStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    // Not valid JSON.
    return null;
  }
}

export function loadPlayState(propId: string): PlayState | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredState(window.localStorage.getItem(storageKey(propId)));
  } catch {
    // Storage blocked, e.g. some private browsing modes.
    return null;
  }
}

export function savePlayState(propId: string, state: PlayState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(propId), JSON.stringify(state));
  } catch {
    // Storage blocked or full: progress just won't survive a reload.
  }
}