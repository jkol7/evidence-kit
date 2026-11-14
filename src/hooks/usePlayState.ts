"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { loadPlayState, savePlayState } from "@/lib/play/storage";
import type { Prop } from "@/lib/props/types";
import {
  attempt,
  buildLockGraph,
  conceal,
  createPlayState,
  describeLock,
  isAccessible,
  reveal,
  type AttemptOutcome,
  type LockStatus,
  type PlayState,
} from "@/lib/unlock";

type Action =
  | { type: "replace"; state: PlayState }
  | { type: "reveal"; nodeId: string }
  | { type: "conceal"; nodeId: string }
  | { type: "reset" };

function reducer(state: PlayState, action: Action): PlayState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "reveal":
      return reveal(state, action.nodeId);
    case "conceal":
      return conceal(state, action.nodeId);
    case "reset":
      return createPlayState();
  }
}

/** How often time-based rules are re-checked. */
const TICK_MS = 15_000;

/**
 * Connects the unlock engine to React for one prop, saving progress per browser.
 *
 * Browser only: the page loads the phone without server rendering, so the
 * first render can read saved progress directly. Later, this state moves to
 * the server so the GM can see and change it live.
 */
export function usePlayState(prop: Prop) {
  const { graph, issues } = useMemo(() => buildLockGraph(prop), [prop]);
  const [state, dispatch] = useReducer(reducer, prop.id, (id) => loadPlayState(id) ?? createPlayState());
  const [now, setNow] = useState(() => new Date());

  // Save after every change.
  useEffect(() => {
    savePlayState(prop.id, state);
  }, [prop.id, state]);

  // Tick the clock so "time" rules open without a reload.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const tryUnlock = useCallback(
    (nodeId: string, input: string): AttemptOutcome => {
      const result = attempt(graph, state, nodeId, input, new Date());
      dispatch({ type: "replace", state: result.state });
      return result.outcome;
    },
    [graph, state],
  );

  const status = useCallback(
    (nodeId: string): LockStatus => describeLock(graph, state, nodeId, now),
    [graph, state, now],
  );

  const canSee = useCallback(
    (nodeId: string): boolean => isAccessible(graph, state, nodeId, now),
    [graph, state, now],
  );

  const gmActions = useMemo(
    () => ({
      reveal: (nodeId: string) => dispatch({ type: "reveal", nodeId }),
      conceal: (nodeId: string) => dispatch({ type: "conceal", nodeId }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [],
  );

  return { graph, issues, state, status, canSee, tryUnlock, ...gmActions };
}

/** Everything a component gets from usePlayState. */
export type PlaySession = ReturnType<typeof usePlayState>;