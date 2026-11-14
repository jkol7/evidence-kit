import { describe, expect, it } from "vitest";
import type { PhoneProp, UnlockRule } from "@/lib/props/types";
import { createPlayState, isAccessible, isUnlocked, type PlayState } from "./engine";
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