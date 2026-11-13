import type { Prop, UnlockRule } from "@/lib/props/types";

/** One lockable item, flattened out of the prop. */
export interface LockNode {
  id: string;
  /** Readable label for GM tools and error messages. */
  label: string;
  rule: UnlockRule;
  /** Container that must be open first, like the phone for a note inside it. */
  parent?: string;
}

export type LockGraph = ReadonlyMap<string, LockNode>;

export interface GraphIssue {
  code: "duplicate-id" | "unknown-dependency" | "cycle";
  message: string;
  nodeIds: string[];
}

const NONE: UnlockRule = { type: "none" };

/** Flattens every lockable item in a prop into one map, keyed by id. */
export function buildLockGraph(prop: Prop): { graph: LockGraph; issues: GraphIssue[] } {
  const nodes = new Map<string, LockNode>();
  const issues: GraphIssue[] = [];

  const add = (node: LockNode) => {
    const existing = nodes.get(node.id);
    if (existing) {
      issues.push({
        code: "duplicate-id",
        message: `Id "${node.id}" is used more than once (${existing.label} and ${node.label}).`,
        nodeIds: [node.id],
      });
      return;
    }
    nodes.set(node.id, node);
  };

  add({ id: prop.id, label: prop.title, rule: prop.lock ?? NONE });

  const { threads, photos, notes, voicemails } = prop.content;
  for (const t of threads) add({ id: t.id, label: `Messages: ${t.contact}`, rule: t.lock ?? NONE, parent: prop.id });
  for (const p of photos) add({ id: p.id, label: `Photo: ${p.caption}`, rule: p.lock ?? NONE, parent: prop.id });
  for (const n of notes) add({ id: n.id, label: `Note: ${n.title}`, rule: n.lock ?? NONE, parent: prop.id });
  for (const v of voicemails) add({ id: v.id, label: `Voicemail: ${v.from}`, rule: v.lock ?? NONE, parent: prop.id });

  return { graph: nodes, issues: [...issues, ...validateLockGraph(nodes)] };
}

/** Every id a rule waits on through `after`, including inside all/any. */
export function dependenciesOf(rule: UnlockRule): string[] {
  switch (rule.type) {
    case "after":
      return [...rule.requires];
    case "all":
    case "any":
      return rule.rules.flatMap(dependenciesOf);
    default:
      return [];
  }
}

/**
 * Finds broken references and dependency loops. A node depends on its parent
 * and on everything its `after` rules name. Any loop means some node can
 * never open, so it's reported for the author to fix.
 */
export function validateLockGraph(graph: LockGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const edges = new Map<string, string[]>();

  // Step 1: list each node's outgoing arrows and flag unknown ids.
  for (const node of graph.values()) {
    const deps = dependenciesOf(node.rule);
    for (const dep of deps) {
      if (!graph.has(dep)) {
        issues.push({
          code: "unknown-dependency",
          message: `${node.label} waits for "${dep}", which does not exist.`,
          nodeIds: [node.id],
        });
      }
    }
    const known = deps.filter((d) => graph.has(d));
    edges.set(node.id, node.parent ? [node.parent, ...known] : known);
  }

  // Step 2: depth-first search for loops.
  // 0 = not visited yet, 1 = on the current path, 2 = fully explored.
  const color = new Map<string, 0 | 1 | 2>();
  const path: string[] = [];
  const reported = new Set<string>();

  const visit = (id: string) => {
    color.set(id, 1);
    path.push(id);
    for (const next of edges.get(id) ?? []) {
      const c = color.get(next) ?? 0;
      if (c === 0) {
        visit(next);
      } else if (c === 1) {
        // We reached a node that's already on our path, so we went in a circle.
        const cycle = path.slice(path.indexOf(next));
        const key = [...cycle].sort().join("|");
        if (!reported.has(key)) {
          reported.add(key);
          const labels = cycle.map((n) => graph.get(n)?.label ?? n);
          issues.push({
            code: "cycle",
            message: `These can never open because they wait on each other: ${labels.join(" → ")} → ${labels[0]}.`,
            nodeIds: cycle,
          });
        }
      }
    }
    path.pop();
    color.set(id, 2);
  };

  for (const id of graph.keys()) if ((color.get(id) ?? 0) === 0) visit(id);
  return issues;
}