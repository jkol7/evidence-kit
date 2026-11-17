import type { LockStatus } from "./engine";

/**
 * Whether an item should appear in a list. Items needing an answer are shown
 * with a lock, because seeing them is part of the puzzle. Items waiting on the
 * GM, a time or another clue stay hidden, so they appear as a reveal moment.
 */
export function isListed(status: LockStatus): boolean {
  return status.status === "open" || status.status === "needs-input";
}