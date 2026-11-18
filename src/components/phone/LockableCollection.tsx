"use client";

import { useState, type ReactNode } from "react";
import type { PlaySession } from "@/hooks/usePlayState";
import type { Lockable } from "@/lib/props/types";
import { isListed } from "@/lib/unlock";
import { AppHeader } from "./AppHeader";
import { KeywordGate } from "./KeywordGate";

interface Props<T extends Lockable> {
  /** App name shown in the list header, like "Notes". */
  title: string;
  items: T[];
  session: PlaySession;
  onHome: () => void;
  /** Name for one item, used in its header and password gate. `open` is false while it's locked. */
  itemTitle: (item: T, open: boolean) => string;
  /** How one item looks in the list. `open` is false while it's locked. */
  renderItem: (item: T, open: boolean) => ReactNode;
  /** The item's content once it's open. */
  renderDetail: (item: T) => ReactNode;
  layout?: "list" | "grid";
  emptyText?: string;
}

/**
 * The shared pattern behind Messages, Photos, Notes and Voicemail: list what
 * the player may see, let them pick an item, then show its content or a
 * password gate. Each app only describes how its items look.
 */
export function LockableCollection<T extends Lockable>({
  title,
  items,
  session,
  onHome,
  itemTitle,
  renderItem,
  renderDetail,
  layout = "list",
  emptyText = "Nothing here yet.",
}: Props<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listed = items.filter((item) => isListed(session.status(item.id)));
  const selected = listed.find((item) => item.id === selectedId);

  if (selected) {
    const status = session.status(selected.id);
    const name = itemTitle(selected, status.status === "open");
    return (
      <section className="flex min-h-0 flex-1 flex-col bg-page text-ink">
        <AppHeader title={name} onBack={() => setSelectedId(null)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-6">
          {status.status === "open"
            ? renderDetail(selected)
            : status.status === "needs-input" && (
                <KeywordGate
                  key={selected.id}
                  title={name}
                  prompt={status.prompt}
                  hint={status.hint}
                  onSubmit={(answer) => session.tryUnlock(selected.id, answer)}
                />
              )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-page text-ink">
      <AppHeader title={title} onBack={onHome} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {listed.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className={layout === "grid" ? "grid grid-cols-3 gap-1 p-1" : "divide-y divide-white/10"}>
            {listed.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={
                    layout === "grid"
                      ? "block w-full"
                      : "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  }
                >
                  {renderItem(item, session.status(item.id).status === "open")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}