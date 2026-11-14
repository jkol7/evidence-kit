import { describe, expect, it } from "vitest";
import { getSample } from "@/data/samples";
import { parseProp } from "@/lib/props/schema";
import { attempt, buildLockGraph, createPlayState, describeLock, isAccessible, reveal } from "@/lib/unlock";
import { harborLight } from "./harbor-light";

describe("The Harbor Light sample", () => {
  it("passes schema validation", () => {
    expect(parseProp(harborLight)).toMatchObject({ ok: true });
  });

  it("has no duplicate ids, broken references or loops", () => {
    expect(buildLockGraph(harborLight).issues).toEqual([]);
  });

  it("is listed under its URL slug", () => {
    expect(getSample("harbor-light")).toBe(harborLight);
    expect(getSample("no-such-case")).toBeUndefined();
  });

  it("plays through from the locked phone to every secret", () => {
    const { graph } = buildLockGraph(harborLight);
    let state = createPlayState();

    // 1. Everything starts behind the passcode.
    expect(describeLock(graph, state, "note-private")).toEqual({ status: "container-locked" });

    // 2. Three wrong guesses bring up the hint.
    for (const guess of ["1234", "0000", "1111"]) {
      state = attempt(graph, state, "dana-phone", guess).state;
    }
    expect(describeLock(graph, state, "dana-phone")).toMatchObject({
      hint: expect.stringContaining("birthday"),
    });

    // 3. Lily's birthday opens the phone. Rae's voicemail is still waiting.
    state = attempt(graph, state, "dana-phone", "0614").state;
    expect(isAccessible(graph, state, "thread-marcus")).toBe(true);
    expect(isAccessible(graph, state, "vm-rae")).toBe(false);

    // 4. The boat's name opens the Private note, which releases Rae's voicemail.
    const privateNote = attempt(graph, state, "note-private", "Harbour Light");
    expect(privateNote.outcome.result).toBe("unlocked");
    state = privateNote.state;
    expect(isAccessible(graph, state, "vm-rae")).toBe(true);

    // 5. The unknown number stays hidden until the GM reveals it.
    expect(describeLock(graph, state, "thread-unknown")).toMatchObject({ status: "waiting", reason: "gm" });
    state = reveal(state, "thread-unknown");
    expect(isAccessible(graph, state, "thread-unknown")).toBe(true);

    // 6. "By the lighthouse" is the hidden album's password.
    expect(attempt(graph, state, "photo-ledger", "the lighthouse").outcome.result).toBe("unlocked");
  });
});