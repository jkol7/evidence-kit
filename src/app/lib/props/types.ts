/**
 * Core data model for interactive props.
 *
 * A prop is one in-world object players open on their own device: a suspect's
 * phone today, and websites, inboxes or locked documents. Anything that
 * can be hidden has an `id` and an optional `lock` rule. The unlock engine only
 * looks at ids and rules, so new prop kinds can reuse it unchanged.
 */

/** Rules that decide whether a lockable item is open. */
export type UnlockRule =
  /** Always open. Same as leaving out `lock`. */
  | { type: "none" }
  /** Exact code typed on a keypad, like a phone passcode. */
  | { type: "passcode"; code: string; hint?: string; hintAfterAttempts?: number }
  /** Typed answer, matched forgivingly. Any listed answer works. */
  | { type: "keyword"; answers: string[]; prompt?: string; hint?: string; hintAfterAttempts?: number }
  /** Opens only when the GM reveals it during play. */
  | { type: "gm"; label?: string }
  /** Opens automatically at an ISO-8601 date and time. */
  | { type: "time"; at: string }
  /** Opens once every listed item is unlocked. */
  | { type: "after"; requires: string[] }
  /** Every nested rule must pass. */
  | { type: "all"; rules: UnlockRule[] }
  /** At least one nested rule must pass. */
  | { type: "any"; rules: UnlockRule[] };

export type UnlockRuleType = UnlockRule["type"];

/** Rules that need the player to type something. */
export type ChallengeRule = Extract<UnlockRule, { type: "passcode" | "keyword" }>;

/** Anything that can be hidden behind a lock. */
export interface Lockable {
  id: string;
  lock?: UnlockRule;
}

export interface MessageThread extends Lockable {
  contact: string;
  messages: Array<{
    from: "owner" | "contact";
    text: string;
    /** In-world time shown to players, as free text like "Tue 9:14 PM". */
    at: string;
  }>;
}

export interface Photo extends Lockable {
  caption: string;
  takenAt: string;
  /** Optional image URL. Without one, a colored placeholder is shown. */
  src?: string;
  /** Placeholder gradient colors when there's no image. */
  tint?: [string, string];
}

export interface Note extends Lockable {
  title: string;
  body: string;
  updatedAt: string;
}

/** Call log rows are never hidden, so they don't extend Lockable. */
export interface CallLogEntry {
  contact: string;
  direction: "incoming" | "outgoing" | "missed";
  at: string;
  durationSec?: number;
}

export interface Voicemail extends Lockable {
  from: string;
  at: string;
  transcript: string;
  durationSec: number;
}

export interface PhoneContent {
  ownerName: string;
  /** Status bar clock, in in-world time. */
  clock: string;
  wallpaper: [string, string];
  threads: MessageThread[];
  photos: Photo[];
  notes: Note[];
  calls: CallLogEntry[];
  voicemails: Voicemail[];
}

export interface PhoneProp extends Lockable {
  schemaVersion: 1;
  kind: "phone";
  title: string;
  /** Notes for the GM. Never shown to players. */
  gmNotes?: string;
  content: PhoneContent;
}

/** Every prop kind. Add new kinds here. */
export type Prop = PhoneProp;
export type PropKind = Prop["kind"];