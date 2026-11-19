import { formatDuration } from "@/lib/format";
import type { CallLogEntry } from "@/lib/props/types";
import { AppHeader } from "../AppHeader";
import type { AppProps } from "./types";

const LABELS: Record<CallLogEntry["direction"], string> = {
  incoming: "Incoming",
  outgoing: "Outgoing",
  missed: "Missed",
};

/** The call log. Calls can't be locked, so this is a plain list, newest first as written. */
export function CallsApp({ content, onHome }: AppProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-page text-ink">
      <AppHeader title="Calls" onBack={onHome} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {content.calls.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No recent calls.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {content.calls.map((call, i) => {
              const missed = call.direction === "missed";
              return (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-medium ${missed ? "text-danger" : ""}`}>
                      {call.contact}
                    </span>
                    <span className="block text-sm text-muted">
                      {LABELS[call.direction]}
                      {call.durationSec !== undefined && ` · ${formatDuration(call.durationSec)}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{call.at}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}