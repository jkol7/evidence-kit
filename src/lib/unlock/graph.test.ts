import { describe, expect, it } from "vitest";
import type { UnlockRule } from "@/lib/props/types";
import { buildLockGraph } from "./graph";
import { note, phoneWith } from "./test-utils";

describe("buildLockGraph", () => {
  it("creates a node for the phone and each item, with the phone as parent", () => {
    const { graph, issues } = buildLockGraph(phoneWith([note("a")]));
    expect(issues).toEqual([]);
    expect(graph.get("phone")?.parent).toBeUndefined();
    expect(graph.get("a")).toMatchObject({ parent: "phone", label: "Note: a" });
  });

  it("gives unlocked items the 'none' rule", () => {
    const { graph } = buildLockGraph(phoneWith([note("a")]));
    expect(graph.get("a")?.rule).toEqual({ type: "none" });
  });

  it("flags duplicate ids", () => {
    const { issues } = buildLockGraph(phoneWith([note("a"), note("a")]));
    expect(issues.map((i) => i.code)).toEqual(["duplicate-id"]);
  });

  it("flags dependencies on ids that don't exist", () => {
    const { issues } = buildLockGraph(phoneWith([note("a", { type: "after", requires: ["ghost"] })]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: "unknown-dependency", nodeIds: ["a"] });
  });

  it("finds dependencies nested inside all/any rules", () => {
    const rule: UnlockRule = {
      type: "all",
      rules: [{ type: "gm" }, { type: "after", requires: ["missing"] }],
    };
    const { issues } = buildLockGraph(phoneWith([note("a", rule)]));
    expect(issues.map((i) => i.code)).toEqual(["unknown-dependency"]);
  });

  it("flags two items that wait on each other, and reports the loop once", () => {
    const { issues } = buildLockGraph(
      phoneWith([note("a", { type: "after", requires: ["b"] }), note("b", { type: "after", requires: ["a"] })]),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("cycle");
    expect([...(issues[0]?.nodeIds ?? [])].sort()).toEqual(["a", "b"]);
  });

  it("flags a container that waits on its own contents", () => {
    const { issues } = buildLockGraph(phoneWith([note("inside")], { type: "after", requires: ["inside"] }));
    expect(issues.map((i) => i.code)).toEqual(["cycle"]);
  });

});