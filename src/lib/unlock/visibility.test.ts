import { describe, expect, it } from "vitest";
import { isListed } from "./visibility";

describe("isListed", () => {
  it("lists open items", () => {
    expect(isListed({ status: "open" })).toBe(true);
  });

  it("lists items that need an answer, so players know there's a puzzle", () => {
    expect(isListed({ status: "needs-input", input: "keyword" })).toBe(true);
  });

  it("hides items waiting on the GM, a time or another clue", () => {
    expect(isListed({ status: "waiting", reason: "gm" })).toBe(false);
    expect(isListed({ status: "waiting", reason: "time" })).toBe(false);
    expect(isListed({ status: "waiting", reason: "after" })).toBe(false);
  });

  it("hides everything while the container is locked", () => {
    expect(isListed({ status: "container-locked" })).toBe(false);
  });
});