import type { PhoneProp } from "@/lib/props/types";

/**
 * Sample prop: the phone of a missing bookkeeper. Fictional people, places
 * and businesses only.
 *
 * Puzzle path:
 *   passcode 0614 (daughter's birthday, from a calendar handout)
 *   → most content opens
 *   → "Private" note needs the boat's name ("harbor light"), seen in photos
 *   → solving it releases a second voicemail
 *   → the unknown-number thread is revealed by the GM after the marina scene
 *   → that thread mentions "the lighthouse", the hidden album's password
 */
export const harborLight: PhoneProp = {
  schemaVersion: 1,
  id: "dana-phone",
  kind: "phone",
  title: "Dana Whitlock's phone",
  gmNotes:
    "Passcode 0614 is Lily's birthday, on the fridge calendar handout. Reveal the unknown thread after the marina scene.",
  lock: {
    type: "passcode",
    code: "0614",
    hint: "Families often use a birthday. Check the calendar on the fridge.",
    hintAfterAttempts: 3,
  },
  content: {
    ownerName: "Dana Whitlock",
    clock: "11:42",
    wallpaper: ["#1d3557", "#457b9d"],
    threads: [
      {
        id: "thread-marcus",
        contact: "Marcus Pell",
        messages: [
          { from: "contact", text: "Did you finish the quarter close?", at: "Mon 4:02 PM" },
          { from: "owner", text: "Almost. A few numbers don't add up. Can we talk tomorrow?", at: "Mon 4:15 PM" },
          { from: "contact", text: "Don't overthink it. Just file it as is.", at: "Mon 4:16 PM" },
          { from: "owner", text: "I'm not filing something I can't explain.", at: "Mon 4:31 PM" },
        ],
      },
      {
        id: "thread-lily",
        contact: "Lily",
        messages: [
          { from: "contact", text: "mom can you pick me up at 6 instead", at: "Tue 2:47 PM" },
          { from: "owner", text: "Yes. Love you. Might be late tonight, Aunt Rae is coming by.", at: "Tue 2:50 PM" },
        ],
      },
      {
        id: "thread-unknown",
        contact: "(555) 014-2290",
        lock: { type: "gm", label: "Reveal after the players visit the marina" },
        messages: [
          { from: "contact", text: "You saw the second ledger. We should talk before you do anything.", at: "Tue 8:03 PM" },
          { from: "owner", text: "Who is this?", at: "Tue 8:05 PM" },
          { from: "contact", text: "Someone who knows where it's kept. By the lighthouse. 11.", at: "Tue 8:06 PM" },
        ],
      },
    ],
    photos: [
      { id: "photo-boat", caption: "The Harbor Light at slip 14", takenAt: "Sun 10:12 AM", tint: ["#e9c46a", "#2a9d8f"] },
      { id: "photo-lily", caption: "Lily's recital", takenAt: "Sat 7:30 PM", tint: ["#f4a261", "#e76f51"] },
      {
        id: "photo-ledger",
        caption: "Ledger page, columns circled",
        takenAt: "Tue 6:58 PM",
        tint: ["#adb5bd", "#495057"],
        lock: { type: "keyword", answers: ["lighthouse", "the lighthouse"], prompt: "Hidden album password" },
      },
    ],
    notes: [
      {
        id: "note-groceries",
        title: "Groceries",
        body: "Eggs\nCoffee\nLily: poster board for science fair",
        updatedAt: "Mon",
      },
      {
        id: "note-private",
        title: "Private",
        body: "Pell Marine shows $48,200 in fuel purchases for March. Dock logs show 9 fills. That's maybe $6,000.\n\nTwo ledgers. Same handwriting.\n\nIf something happens, the copies are with R.",
        updatedAt: "Tue",
        lock: {
          type: "keyword",
          answers: ["harbor light", "harbour light"],
          prompt: "This note is locked. Enter the password.",
          hint: "She named everything after the boat.",
          hintAfterAttempts: 2,
        },
      },
    ],
    calls: [
      { contact: "Marcus Pell", direction: "incoming", at: "Tue 9:20 PM", durationSec: 64 },
      { contact: "(555) 014-2290", direction: "missed", at: "Tue 10:51 PM" },
      { contact: "Rae", direction: "outgoing", at: "Tue 10:58 PM", durationSec: 12 },
      { contact: "Lily", direction: "incoming", at: "Tue 2:44 PM", durationSec: 31 },
    ],
    voicemails: [
      {
        id: "vm-marcus",
        from: "Marcus Pell",
        at: "Tue 9:22 PM",
        durationSec: 18,
        transcript: "Dana, it's Marcus. Whatever you think you found, let's handle it in house. Call me back tonight.",
      },
      {
        id: "vm-rae",
        from: "Rae",
        at: "Tue 11:30 PM",
        durationSec: 24,
        transcript: "Got your message. I have the envelope. I'm not opening it unless you tell me to. Where are you?",
        lock: { type: "after", requires: ["note-private"] },
      },
    ],
  },
};