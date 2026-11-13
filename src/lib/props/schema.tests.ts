import { describe, expect, it } from "vitest";
import { parseProp } from "./schema";

const validPhone = {
  schemaVersion: 1,
  id: "test-phone",
  kind: "phone",
  title: "Test phone",
  lock: { type: "passcode", code: "1234" },
  content: {
    ownerName: "Sam Rivera",
    clock: "9:41",
    wallpaper: ["#111111", "#222222"],
    threads: [],
    photos: [],
    notes: [
      {
        id: "note-1",
        title: "Groceries",
        body: "Milk, eggs",
        updatedAt: "Mon",
        lock: { type: "keyword", answers: ["blue"] },
      },
    ],
    calls: [],
    voicemails: [],
  },
};

function errorsFor(input: unknown): string[] {
  const result = parseProp(input);
  if (result.ok) throw new Error("expected parseProp to fail");
  return result.errors;
}

describe("parseProp", () => {
  it("accepts a valid phone prop", () => {
    expect(parseProp(validPhone).ok).toBe(true);
  });

  it("accepts nested all/any rules", () => {
    const lock = {
      type: "all",
      rules: [{ type: "gm" }, { type: "any", rules: [{ type: "keyword", answers: ["x"] }] }],
    };
    expect(parseProp({ ...validPhone, lock }).ok).toBe(true);
  });

  it("rejects a passcode that isn't 4 to 8 digits, with a readable path", () => {
    const errors = errorsFor({ ...validPhone, lock: { type: "passcode", code: "12ab" } });
    expect(errors.some((e) => e.startsWith("lock.code:"))).toBe(true);
  });

  it("rejects ids with spaces or capitals", () => {
    const badNote = { id: "Note 1", title: "x", body: "y", updatedAt: "Mon" };
    const errors = errorsFor({ ...validPhone, content: { ...validPhone.content, notes: [badNote] } });
    expect(errors.some((e) => e.startsWith("content.notes.0.id:"))).toBe(true);
  });

  it("rejects an unknown rule type", () => {
    expect(parseProp({ ...validPhone, lock: { type: "magic" } }).ok).toBe(false);
  });
});