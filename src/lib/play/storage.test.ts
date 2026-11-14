import { describe, expect, it } from "vitest";
import { createPlayState, type PlayState } from "@/lib/unlock";
import { loadPlayState, parseStoredState, storageKey } from "./storage";

describe("parseStoredState", () => {
  it("returns null when nothing is saved", () => {
    expect(parseStoredState(null)).toBeNull();
  });

  it("restores a saved state exactly", () => {
    const state: PlayState = { solved: ["dana-phone@"], revealed: ["thread-unknown"], attempts: { "dana-phone": 2 } };
    expect(parseStoredState(JSON.stringify(state))).toEqual(state);
  });

  it("restores a fresh state", () => {
    expect(parseStoredState(JSON.stringify(createPlayState()))).toEqual(createPlayState());
  });

  it("rejects text that isn't JSON", () => {
    expect(parseStoredState("{not json")).toBeNull();
  });

  it("rejects data with the wrong shape", () => {
    expect(parseStoredState(JSON.stringify({ solved: "oops", revealed: [] }))).toBeNull();
    expect(parseStoredState(JSON.stringify({ solved: [], revealed: [], attempts: { a: -1 } }))).toBeNull();
  });
});

describe("storage helpers", () => {
  it("versions keys per prop", () => {
    expect(storageKey("dana-phone")).toBe("evidence-kit:play:v1:dana-phone");
  });

  it("loads nothing on the server, where there's no window", () => {
    expect(loadPlayState("dana-phone")).toBeNull();
  });
});