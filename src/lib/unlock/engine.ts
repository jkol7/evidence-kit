import type { ChallengeRule, UnlockRule } from "@/lib/props/types";
import type { LockGraph } from "./graph";
import { normalizeAnswer, normalizePasscode } from "./normalize";

/**
 * A player's progress through one prop. Unlock status is never stored here:
 * it's worked out from this state plus the rules, so editing a rule or undoing
 * a GM reveal can never leave a stale "unlocked" flag behind.
 */
export interface PlayState {
  /** Solved challenges, keyed by `${nodeId}@${rulePath}`. */
  readonly solved: readonly string[];
  /** Node ids the GM has revealed. */
  readonly revealed: readonly string[];
  /** Wrong attempts per node id, used to time hints. */
  readonly attempts: Readonly<Record<string, number>>;
}

export const createPlayState = (): PlayState => ({ solved: [], revealed: [], attempts: {} });

const solvedKey = (nodeId: string, path: string) => `${nodeId}@${path}`;

/** Position of a nested rule: "" for the root, "0", "1", then "1.0" and so on. */
const childPath = (path: string, i: number) => (path ? `${path}.${i}` : `${i}`);

interface EvalContext {
  graph: LockGraph;
  state: PlayState;
  now: Date;
  /** Nodes being evaluated right now, so a loop can't recurse forever. */
  visiting: Set<string>;
}

function evaluate(nodeId: string, rule: UnlockRule, path: string, ctx: EvalContext): boolean {
  switch (rule.type) {
    case "none":
      return true;
    case "passcode":
    case "keyword":
      return ctx.state.solved.includes(solvedKey(nodeId, path));
    case "gm":
      return ctx.state.revealed.includes(nodeId);
    case "time": {
      const at = Date.parse(rule.at);
      return !Number.isNaN(at) && ctx.now.getTime() >= at;
    }
    case "after":
      return rule.requires.every((dep) => accessible(dep, ctx));
    case "all":
      return rule.rules.every((r, i) => evaluate(nodeId, r, childPath(path, i), ctx));
    case "any":
      return rule.rules.some((r, i) => evaluate(nodeId, r, childPath(path, i), ctx));
  }
}

function unlocked(nodeId: string, ctx: EvalContext): boolean {
  const node = ctx.graph.get(nodeId);
  if (!node || ctx.visiting.has(nodeId)) return false;
  ctx.visiting.add(nodeId);
  try {
    return evaluate(nodeId, node.rule, "", ctx);
  } finally {
    ctx.visiting.delete(nodeId);
  }
}

function accessible(nodeId: string, ctx: EvalContext): boolean {
  const node = ctx.graph.get(nodeId);
  if (!node) return false;
  if (node.parent && !accessible(node.parent, ctx)) return false;
  return unlocked(nodeId, ctx);
}

const context = (graph: LockGraph, state: PlayState, now: Date): EvalContext => ({
  graph,
  state,
  now,
  visiting: new Set(),
});

/** True when the item's own rule passes, ignoring its container. */
export function isUnlocked(graph: LockGraph, state: PlayState, nodeId: string, now = new Date()): boolean {
  return unlocked(nodeId, context(graph, state, now));
}

/** True when players can actually see the item: it and every container are open. */
export function isAccessible(graph: LockGraph, state: PlayState, nodeId: string, now = new Date()): boolean {
  return accessible(nodeId, context(graph, state, now));
}


interface Located<R extends UnlockRule = UnlockRule> {
  rule: R;
  path: string;
}

/** Every passcode or keyword challenge inside a rule, with its position. */
export function challengesIn(rule: UnlockRule, path = ""): Located<ChallengeRule>[] {
  switch (rule.type) {
    case "passcode":
    case "keyword":
      return [{ rule, path }];
    case "all":
    case "any":
      return rule.rules.flatMap((r, i) => challengesIn(r, childPath(path, i)));
    default:
      return [];
  }
}

function challengeMatches(rule: ChallengeRule, input: string): boolean {
  if (rule.type === "passcode") return normalizePasscode(input) === rule.code;
  const given = normalizeAnswer(input);
  return given.length > 0 && rule.answers.some((a) => normalizeAnswer(a) === given);
}

export type AttemptOutcome =
  | { result: "unlocked" }
  /** A challenge was solved, but something else still blocks the item. */
  | { result: "progress" }
  | { result: "incorrect"; attempts: number }
  | { result: "already-open" }
  /** The item's container is still locked. */
  | { result: "unavailable" }
  | { result: "no-challenge" }
  | { result: "unknown-node" };

/** Applies a player's passcode or answer to an item. Returns a new state. */
export function attempt(
  graph: LockGraph,
  state: PlayState,
  nodeId: string,
  input: string,
  now = new Date(),
): { state: PlayState; outcome: AttemptOutcome } {
  const node = graph.get(nodeId);
  if (!node) return { state, outcome: { result: "unknown-node" } };
  if (node.parent && !isAccessible(graph, state, node.parent, now)) {
    return { state, outcome: { result: "unavailable" } };
  }
  if (isUnlocked(graph, state, nodeId, now)) return { state, outcome: { result: "already-open" } };

  const open = challengesIn(node.rule).filter((c) => !state.solved.includes(solvedKey(nodeId, c.path)));
  if (open.length === 0) return { state, outcome: { result: "no-challenge" } };

  const matched = open.filter((c) => challengeMatches(c.rule, input));
  if (matched.length === 0) {
    const attempts = (state.attempts[nodeId] ?? 0) + 1;
    return {
      state: { ...state, attempts: { ...state.attempts, [nodeId]: attempts } },
      outcome: { result: "incorrect", attempts },
    };
  }

  const next: PlayState = {
    ...state,
    solved: [...state.solved, ...matched.map((c) => solvedKey(nodeId, c.path))],
  };
  return {
    state: next,
    outcome: { result: isUnlocked(graph, next, nodeId, now) ? "unlocked" : "progress" },
  };
}

/** GM action: reveal an item. Revealing twice changes nothing. */
export function reveal(state: PlayState, nodeId: string): PlayState {
  return state.revealed.includes(nodeId) ? state : { ...state, revealed: [...state.revealed, nodeId] };
}

/** GM action: undo a reveal. */
export function conceal(state: PlayState, nodeId: string): PlayState {
  return { ...state, revealed: state.revealed.filter((id) => id !== nodeId) };
}