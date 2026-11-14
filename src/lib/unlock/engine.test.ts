import { describe, expect, it } from "vitest";
import type { PhoneProp, UnlockRule } from "@/lib/props/types";
import {
  attempt,
  conceal,
  createPlayState,
  describeLock,
  isAccessible,
  isUnlocked,
  reveal,
  type PlayState,
} from "./engine";
import { buildLockGraph } from "./graph";
import { note, phoneWith } from "./test-utils";

/** Builds the graph and fails the test if the prop itself is broken. */
function graphOf(prop: PhoneProp) {
  const { graph, issues } = buildLockGraph(prop);
  expect(issues).toEqual([]);
  return graph;
}

describe("isUnlocked and isAccessible", () => {
  it("treats items with no lock as open", () => {
    const graph = graphOf(phoneWith([note("a")]));
    expect(isAccessible(graph, createPlayState(), "a")).toBe(true);
  });

  it("returns false for ids that don't exist", () => {
    const graph = graphOf(phoneWith([]));
    expect(isAccessible(graph, createPlayState(), "ghost")).toBe(false);
  });

  it("opens gm items once they're revealed", () => {
    const graph = graphOf(phoneWith([note("secret", { type: "gm" })]));
    expect(isAccessible(graph, createPlayState(), "secret")).toBe(false);
    const state: PlayState = { ...createPlayState(), revealed: ["secret"] };
    expect(isAccessible(graph, state, "secret")).toBe(true);
  });

  it("opens time items at the set moment", () => {
    const graph = graphOf(phoneWith([note("later", { type: "time", at: "2026-12-01T20:00:00Z" })]));
    const state = createPlayState();
    expect(isUnlocked(graph, state, "later", new Date("2026-12-01T19:59:59Z"))).toBe(false);
    expect(isUnlocked(graph, state, "later", new Date("2026-12-01T20:00:00Z"))).toBe(true);
  });

  it("keeps items hidden while their container is locked", () => {
    const graph = graphOf(phoneWith([note("a")], { type: "gm" }));
    const state = createPlayState();
    expect(isUnlocked(graph, state, "a")).toBe(true);
    expect(isAccessible(graph, state, "a")).toBe(false);
    expect(isAccessible(graph, { ...state, revealed: ["phone"] }, "a")).toBe(true);
  });

  it("opens after items once their dependencies are open", () => {
    const graph = graphOf(
      phoneWith([note("first", { type: "gm" }), note("second", { type: "after", requires: ["first"] })]),
    );
    expect(isAccessible(graph, createPlayState(), "second")).toBe(false);
    expect(isAccessible(graph, { ...createPlayState(), revealed: ["first"] }, "second")).toBe(true);
  });

  it("keeps after items waiting when the dependency is inside a locked container", () => {
    const graph = graphOf(
      phoneWith([note("first"), note("second", { type: "after", requires: ["first"] })], { type: "gm" }),
    );
    // "first" has no lock, but the player can't see it yet, so "second" waits.
    expect(isUnlocked(graph, createPlayState(), "second")).toBe(false);
  });

  it("combines rules with all and any", () => {
    const rules: UnlockRule[] = [{ type: "gm" }, { type: "time", at: "2026-12-01T20:00:00Z" }];
    const graph = graphOf(phoneWith([note("both", { type: "all", rules }), note("either", { type: "any", rules })]));
    const state: PlayState = { ...createPlayState(), revealed: ["both", "either"] };
    const before = new Date("2026-11-30T00:00:00Z");
    const after = new Date("2026-12-02T00:00:00Z");
    expect(isUnlocked(graph, state, "either", before)).toBe(true);
    expect(isUnlocked(graph, state, "both", before)).toBe(false);
    expect(isUnlocked(graph, state, "both", after)).toBe(true);
  });
});
describe("attempt", () => {
  const passcodePhone = () => graphOf(phoneWith([], { type: "passcode", code: "0614" }));
  const diaryPhone = () =>
    graphOf(phoneWith([note("diary", { type: "keyword", answers: ["Lighthouse"] })], { type: "passcode", code: "1234" }));

  it("counts wrong attempts without unlocking", () => {
    const graph = passcodePhone();
    const { state, outcome } = attempt(graph, createPlayState(), "phone", "1234");
    expect(outcome).toEqual({ result: "incorrect", attempts: 1 });
    expect(isUnlocked(graph, state, "phone")).toBe(false);
  });

  it("unlocks with the right code, ignoring dashes and spaces", () => {
    const graph = passcodePhone();
    const { state, outcome } = attempt(graph, createPlayState(), "phone", "06-14 ");
    expect(outcome.result).toBe("unlocked");
    expect(isAccessible(graph, state, "phone")).toBe(true);
  });

  it("reports already-open on a second correct attempt", () => {
    const graph = passcodePhone();
    const first = attempt(graph, createPlayState(), "phone", "0614").state;
    expect(attempt(graph, first, "phone", "0614").outcome.result).toBe("already-open");
  });

  it("never changes the state it was given", () => {
    const before = createPlayState();
    attempt(passcodePhone(), before, "phone", "0614");
    expect(before).toEqual(createPlayState());
  });

  it("blocks attempts on items inside a locked container", () => {
    const start = createPlayState();
    const { state, outcome } = attempt(diaryPhone(), start, "diary", "lighthouse");
    expect(outcome.result).toBe("unavailable");
    expect(state).toBe(start);
  });

  it("accepts forgiving keyword answers once the container is open", () => {
    const graph = diaryPhone();
    const open = attempt(graph, createPlayState(), "phone", "1234").state;
    const { state, outcome } = attempt(graph, open, "diary", "  LIGHTHOUSE! ");
    expect(outcome.result).toBe("unlocked");
    expect(isAccessible(graph, state, "diary")).toBe(true);
  });

  it("rejects answers that are empty after normalizing", () => {
    const graph = diaryPhone();
    const open = attempt(graph, createPlayState(), "phone", "1234").state;
    expect(attempt(graph, open, "diary", "  !!! ").outcome.result).toBe("incorrect");
  });

  it("needs every challenge in an all rule, reporting progress in between", () => {
    const graph = graphOf(
      phoneWith([
        note("vault", {
          type: "all",
          rules: [
            { type: "passcode", code: "4321" },
            { type: "keyword", answers: ["anchor"] },
          ],
        }),
      ]),
    );
    const step1 = attempt(graph, createPlayState(), "vault", "4321");
    expect(step1.outcome.result).toBe("progress");
    const step2 = attempt(graph, step1.state, "vault", "anchor");
    expect(step2.outcome.result).toBe("unlocked");
  });

  it("opens an any rule through either branch", () => {
    const graph = graphOf(
      phoneWith([note("door", { type: "any", rules: [{ type: "gm" }, { type: "keyword", answers: ["open sesame"] }] })]),
    );
    expect(isUnlocked(graph, reveal(createPlayState(), "door"), "door")).toBe(true);
    expect(attempt(graph, createPlayState(), "door", "Open, sesame!").outcome.result).toBe("unlocked");
  });

  it("reports no-challenge for GM-only items and unknown-node for missing ids", () => {
    const graph = graphOf(phoneWith([note("secret", { type: "gm" })]));
    expect(attempt(graph, createPlayState(), "secret", "anything").outcome.result).toBe("no-challenge");
    expect(attempt(graph, createPlayState(), "ghost", "anything").outcome.result).toBe("unknown-node");
  });
});

describe("reveal and conceal", () => {
  it("reveals once, ignores repeats and can be undone", () => {
    const shown = reveal(createPlayState(), "secret");
    expect(shown.revealed).toEqual(["secret"]);
    expect(reveal(shown, "secret")).toBe(shown);
    expect(conceal(shown, "secret").revealed).toEqual([]);
  });
});

describe("describeLock", () => {
  it("asks for a passcode and shows the hint only after enough misses", () => {
    const graph = graphOf(phoneWith([], { type: "passcode", code: "0614", hint: "birthday", hintAfterAttempts: 2 }));
    let state = createPlayState();
    expect(describeLock(graph, state, "phone")).toMatchObject({
      status: "needs-input",
      input: "passcode",
      codeLength: 4,
      hint: undefined,
    });
    state = attempt(graph, state, "phone", "1111").state;
    state = attempt(graph, state, "phone", "2222").state;
    expect(describeLock(graph, state, "phone")).toMatchObject({ status: "needs-input", hint: "birthday" });
  });

  it("reports container-locked for items inside a locked phone", () => {
    const graph = graphOf(phoneWith([note("a")], { type: "passcode", code: "1234" }));
    expect(describeLock(graph, createPlayState(), "a")).toEqual({ status: "container-locked" });
  });

  it("reports open once an item is unlocked", () => {
    const graph = graphOf(phoneWith([note("secret", { type: "gm" })]));
    expect(describeLock(graph, reveal(createPlayState(), "secret"), "secret")).toEqual({ status: "open" });
  });

  it("explains why an item is waiting", () => {
    const graph = graphOf(
      phoneWith([
        note("tip", { type: "gm", label: "After the marina" }),
        note("later", { type: "time", at: "2026-12-01T20:00:00Z" }),
      ]),
    );
    const now = new Date("2026-11-01T00:00:00Z");
    expect(describeLock(graph, createPlayState(), "tip", now)).toEqual({
      status: "waiting",
      reason: "gm",
      detail: "After the marina",
    });
    expect(describeLock(graph, createPlayState(), "later", now)).toMatchObject({ status: "waiting", reason: "time" });
  });

  it("moves on to the next challenge in an all rule", () => {
    const graph = graphOf(
      phoneWith([
        note("vault", {
          type: "all",
          rules: [
            { type: "passcode", code: "4321" },
            { type: "keyword", answers: ["anchor"], prompt: "Name the boat" },
          ],
        }),
      ]),
    );
    const afterCode = attempt(graph, createPlayState(), "vault", "4321").state;
    expect(describeLock(graph, afterCode, "vault")).toMatchObject({
      status: "needs-input",
      input: "keyword",
      prompt: "Name the boat",
    });
  });
});