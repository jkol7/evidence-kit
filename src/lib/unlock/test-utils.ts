import type { Note, PhoneProp, UnlockRule } from "@/lib/props/types";

/** A note with just enough content to be valid. */
export const note = (id: string, lock?: UnlockRule): Note => ({
  id,
  title: id,
  body: "x",
  updatedAt: "Mon",
  lock,
});

/**
 * A minimal phone whose only contents are the given notes. Tests use notes
 * because they're the simplest lockable item, so each test can focus on one rule.
 */
export function phoneWith(notes: Note[], phoneLock?: UnlockRule): PhoneProp {
  return {
    schemaVersion: 1,
    id: "phone",
    kind: "phone",
    title: "Test phone",
    lock: phoneLock,
    content: {
      ownerName: "Test",
      clock: "12:00",
      wallpaper: ["#000", "#111"],
      threads: [],
      photos: [],
      calls: [],
      voicemails: [],
      notes,
    },
  };
}