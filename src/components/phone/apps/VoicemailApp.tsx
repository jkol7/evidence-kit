import { formatDuration } from "@/lib/format";
import { LockIcon } from "../icons";
import { LockableCollection } from "../LockableCollection";
import type { AppProps } from "./types";

export function VoicemailApp({ content, session, onHome }: AppProps) {
  return (
    <LockableCollection
      title="Voicemail"
      items={content.voicemails}
      session={session}
      onHome={onHome}
      emptyText="No voicemail."
      itemTitle={(vm) => vm.from}
      renderItem={(vm, open) => (
        <>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{vm.from}</span>
            <span className="block text-sm text-muted">{open ? vm.at : "Locked voicemail"}</span>
          </span>
          <span className="shrink-0 text-xs text-muted">
            {open ? formatDuration(vm.durationSec) : <LockIcon width={14} height={14} />}
          </span>
        </>
      )}
      renderDetail={(vm) => (
        <article className="px-5 py-4">
          <p className="text-sm text-muted">
            {vm.at} · {formatDuration(vm.durationSec)}
          </p>
          <h3 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Transcript</h3>
          <p className="leading-relaxed">{vm.transcript}</p>
        </article>
      )}
    />
  );
}