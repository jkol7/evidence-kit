"use client";

import { useEffect, useState } from "react";
import type { AttemptOutcome } from "@/lib/unlock";
import { LockIcon } from "./icons";

interface Props {
  ownerName: string;
  clock: string;
  codeLength: number;
  hint?: string;
  onSubmit: (code: string) => AttemptOutcome;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;
type Key = (typeof KEYS)[number];

export function LockScreen({ ownerName, clock, codeLength, hint, onSubmit }: Props) {
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(false);

  // After the "wrong code" shake, clear the dots.
  useEffect(() => {
    if (!wrong) return;
    const timer = window.setTimeout(() => {
      setWrong(false);
      setEntry("");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [wrong]);

  const press = (key: Key) => {
    if (wrong) return;
    if (key === "del") {
      setEntry((e) => e.slice(0, -1));
      return;
    }
    if (!key || entry.length >= codeLength) return;
    const next = entry + key;
    setEntry(next);
    if (next.length === codeLength) {
      const outcome = onSubmit(next);
      if (outcome.result === "incorrect") setWrong(true);
      else setEntry("");
    }
  };

  // A laptop keyboard works too, which helps when testing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key as Key);
      if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-black/25 px-6 pt-7 pb-10 text-white backdrop-blur-sm">
      <div className="text-[76px] leading-none font-extralight tracking-tight">{clock}</div>
      <div className="mt-2 flex items-center gap-1.5 text-sm opacity-80">
        <LockIcon width={16} height={16} /> {ownerName}
      </div>

      <p className="mt-9 mb-3.5">Enter passcode</p>
      <div
        className={`flex gap-4 ${wrong ? "animate-shake" : ""}`}
        aria-live="polite"
        aria-label={`${entry.length} of ${codeLength} digits entered`}
      >
        {Array.from({ length: codeLength }, (_, i) => (
          <span
            key={i}
            className={`size-3 rounded-full border-[1.5px] transition-colors ${
              wrong ? "border-red-300 bg-red-300" : i < entry.length ? "border-white bg-white" : "border-white"
            }`}
          />
        ))}
      </div>
      <p className="mt-3.5 min-h-10 max-w-70 text-center text-[13px] opacity-85">{hint}</p>

      <div className="mt-auto grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : key === "del" ? (
            <button key={i} type="button" onClick={() => press(key)} className="text-[15px]">
              Delete
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              className="size-19 rounded-full bg-white/15 text-3xl font-light transition-colors active:bg-white/40"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}