import { describe, expect, it } from "vitest";
import { normalizeAnswer, normalizePasscode } from "./normalize";

describe("normalizeAnswer", () => {
  it("ignores case, accents, punctuation and extra spaces", () => {
    expect(normalizeAnswer("  The  Café, at St. Mary's! ")).toBe("the cafe at st mary s");
  });

  it("treats different typings of the same answer as equal", () => {
    expect(normalizeAnswer("LIGHTHOUSE")).toBe(normalizeAnswer(" lighthouse! "));
  });
});

describe("normalizePasscode", () => {
  it("keeps only digits", () => {
    expect(normalizePasscode("06-14 ")).toBe("0614");
  });
});