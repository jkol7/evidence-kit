import { LockIcon } from "../icons";
import { LockableCollection } from "../LockableCollection";
import type { AppProps } from "./types";

/** First letter of a contact's name, or "#" for a bare number. */
const initial = (name: string) => name.replace(/[^A-Za-z]/g, "").charAt(0) || "#";

export function MessagesApp({ content, session, onHome }: AppProps) {
  return (
    <LockableCollection
      title="Messages"
      items={content.threads}
      session={session}
      onHome={onHome}
      emptyText="No messages."
      itemTitle={(thread) => thread.contact}
      renderItem={(thread, open) => {
        const last = thread.messages.at(-1);
        return (
          <>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-panel font-semibold text-muted">
              {initial(thread.contact)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{thread.contact}</span>
              <span className="block truncate text-sm text-muted">{open ? last?.text : "Locked conversation"}</span>
            </span>
            <span className="shrink-0 text-xs text-muted">
              {open ? last?.at : <LockIcon width={14} height={14} />}
            </span>
          </>
        );
      }}
      renderDetail={(thread) => (
        <ol className="flex flex-col gap-2 px-3 py-4">
          {thread.messages.map((message, i) => {
            const mine = message.from === "owner";
            return (
              <li
                key={i}
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  mine ? "self-end rounded-br-md bg-accent text-page" : "self-start rounded-bl-md bg-panel"
                }`}
              >
                <p className="leading-snug">{message.text}</p>
                <span className={`mt-1 block text-[11px] ${mine ? "text-page/70" : "text-muted"}`}>{message.at}</span>
              </li>
            );
          })}
        </ol>
      )}
    />
  );
}