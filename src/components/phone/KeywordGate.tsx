"use client";

import { useId, useState, type FormEvent } from "react";
import type { AttemptOutcome } from "@/lib/unlock";
import { LockIcon } from "./icons";

interface Props {
  title: string;
  prompt?: string;
  hint?: string;
  onSubmit: (answer: string) => AttemptOutcome;
}

const MESSAGES: Partial<Record<AttemptOutcome["result"], string>> = {
  incorrect: "Incorrect password",
  progress: "Correct. There's one more step.",
};

/** Password prompt shown in place of a locked note, photo or message thread. */
export function KeywordGate({ title, prompt, hint, onSubmit }: Props) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const outcome = onSubmit(value);
    setMessage(MESSAGES[outcome.result] ?? null);
    if (outcome.result !== "unlocked") setValue("");
  };

  const isError = message === MESSAGES.incorrect;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col items-center px-7 py-12 text-center">
      <LockIcon width={40} height={40} className="text-muted" />
      <h2 className="mt-3 mb-1 text-xl font-semibold">{title}</h2>
      <label htmlFor={inputId} className="mb-4 text-sm text-muted">
        {prompt ?? "Enter password"}
      </label>

      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={isError || undefined}
        className="w-full max-w-65 rounded-lg border border-white/15 bg-panel px-3 py-2.5 text-center text-base outline-none focus:border-accent aria-invalid:border-danger"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="mt-3 rounded-lg bg-accent px-6 py-2 font-semibold text-page disabled:opacity-40"
      >
        Unlock
      </button>

      <p role="alert" className={`mt-2.5 min-h-5 text-sm ${isError ? "text-danger" : "text-ok"}`}>
        {message}
      </p>
      {hint && <p className="mt-1 text-[13px] text-muted">Hint: {hint}</p>}
    </form>
  );
}