"use client";

import { useState, type ReactNode } from "react";
import { usePlayState } from "@/hooks/usePlayState";
import type { PhoneProp } from "@/lib/props/types";
import { AppHeader } from "./AppHeader";
import { APPS, HomeScreen, type AppId } from "./HomeScreen";
import { LockScreen } from "./LockScreen";
import { NotesApp } from "./apps/NotesApp";
import type { AppProps } from "./apps/types";
import { VoicemailApp } from "./apps/VoicemailApp";
import { MessagesApp } from "./apps/MessagesApp";
import { PhotosApp } from "./apps/PhotosApp";

export function Phone({ prop }: { prop: PhoneProp }) {
  const session = usePlayState(prop);
  const [app, setApp] = useState<AppId | null>(null);
  const { content } = prop;
  const root = session.status(prop.id);

  let screen: ReactNode;
  if (root.status === "needs-input" && root.input === "passcode") {
    screen = (
      <LockScreen
        ownerName={content.ownerName}
        clock={content.clock}
        codeLength={root.codeLength ?? 4}
        hint={root.hint}
        onSubmit={(code) => session.tryUnlock(prop.id, code)}
      />
    );
  } else if (root.status !== "open") {
    screen = <p className="grid flex-1 place-items-center text-white/60">This phone is switched off.</p>;
  } else if (app) {
    screen = renderApp(app, { content, session, onHome: () => setApp(null) });
  } else {
    screen = <HomeScreen clock={content.clock} onOpen={setApp} />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6 max-sm:p-0">
      <div
        className="relative flex h-[800px] max-h-[calc(100dvh-48px)] w-[390px] flex-col overflow-hidden rounded-[46px] border-10 border-[#05070a] shadow-2xl ring-1 ring-[#2a2f38] max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:rounded-none max-sm:border-0 max-sm:ring-0"
        style={{ background: `linear-gradient(160deg, ${content.wallpaper[0]}, ${content.wallpaper[1]})` }}
      >
        <div className="flex shrink-0 justify-between px-6 pt-3 pb-1.5 text-[13px] font-semibold text-white">
          <span>{content.clock}</span>
          <span className="flex items-center gap-1.5 opacity-90" aria-hidden>
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4" rx="1" />
              <rect x="4.5" y="5" width="3" height="6" rx="1" />
              <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
              <rect x="13.5" y="0" width="3" height="11" rx="1" opacity="0.35" />
            </svg>
            41%
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{screen}</div>

        <div className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[9px] tracking-widest text-white/40 uppercase">
          Game prop · fictional
        </div>
      </div>
    </div>
  );
}

function renderApp(app: AppId, props: AppProps): ReactNode {
  switch (app) {
        case "messages":
      return <MessagesApp {...props} />;
    case "photos":
      return <PhotosApp {...props} />;
    case "notes":
      return <NotesApp {...props} />;
    case "voicemail":
      return <VoicemailApp {...props} />;
    default: {
      const label = APPS.find((a) => a.id === app)?.label ?? "App";
      return (
        <div className="flex flex-1 flex-col bg-page text-ink">
          <AppHeader title={label} onBack={props.onHome} />
          <p className="grid flex-1 place-items-center text-muted">Coming soon.</p>
        </div>
      );
    }
  }
}