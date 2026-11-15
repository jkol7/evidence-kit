import { BackIcon } from "./icons";

export function AppHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex shrink-0 items-center gap-1 border-b border-white/10 px-2 py-2.5">
      <button type="button" onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-white/10">
        <BackIcon width={22} height={22} />
      </button>
      <h2 className="text-[17px] font-semibold">{title}</h2>
    </header>
  );
}