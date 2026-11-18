import { LockIcon } from "../icons";
import { LockableCollection } from "../LockableCollection";
import type { AppProps } from "./types";

export function NotesApp({ content, session, onHome }: AppProps) {
  return (
    <LockableCollection
      title="Notes"
      items={content.notes}
      session={session}
      onHome={onHome}
      itemTitle={(note) => note.title}
      renderItem={(note, open) => (
        <>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{note.title}</span>
            <span className="block truncate text-sm text-muted">
              {open ? note.body.split("\n")[0] : "Locked note"}
            </span>
          </span>
          <span className="shrink-0 text-xs text-muted">
            {open ? note.updatedAt : <LockIcon width={14} height={14} />}
          </span>
        </>
      )}
      renderDetail={(note) => (
        <article className="px-5 py-4">
          <p className="mb-3 text-xs text-muted">Edited {note.updatedAt}</p>
          <p className="leading-relaxed whitespace-pre-line">{note.body}</p>
        </article>
      )}
    />
  );
}