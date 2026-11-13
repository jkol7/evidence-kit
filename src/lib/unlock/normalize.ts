/**
 * Normalizes a free-text answer so "Lighthouse!", " lighthouse " and
 * "LIGHTHOUSE" all match. Accents are removed ("café" → "cafe") and
 * punctuation is treated as a space ("st. mary's" → "st mary s").
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keeps digits only, so "06-14" and "0614" count as the same passcode. */
export function normalizePasscode(input: string): string {
  return input.replace(/\D/g, "");
}