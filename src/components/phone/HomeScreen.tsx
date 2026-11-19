import type { ComponentType, SVGProps } from "react";
import { CallsIcon, MessagesIcon, NotesIcon, PhotosIcon, VoicemailIcon } from "./icons";

export type AppId = "messages" | "photos" | "notes" | "calls" | "voicemail";

interface AppInfo {
  id: AppId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
}

export const APPS: AppInfo[] = [
  { id: "messages", label: "Messages", icon: MessagesIcon, color: "#2fb36d" },
  { id: "photos", label: "Photos", icon: PhotosIcon, color: "#e8a33d" },
  { id: "notes", label: "Notes", icon: NotesIcon, color: "#d9b84a" },
  { id: "calls", label: "Calls", icon: CallsIcon, color: "#3a86d6" },
  { id: "voicemail", label: "Voicemail", icon: VoicemailIcon, color: "#7b61c9" },
];


export function HomeScreen({
  clock,
  onOpen,
  badges = {},
}: {
  clock: string;
  onOpen: (id: AppId) => void;
  badges?: Partial<Record<AppId, number>>;
}) {
  return (
    <div className="flex-1 px-6 py-10 text-white">
      <div className="mb-12 text-center text-[56px] font-extralight">{clock}</div>
      <ul className="grid grid-cols-4 gap-x-2.5 gap-y-6">
        {APPS.map(({ id, label, icon: Icon, color }) => {
          const badge = badges[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onOpen(id)}
                aria-label={badge ? `${label}, ${badge}` : label}
                className="flex w-full flex-col items-center gap-1.5"
              >
                <span
                  className="relative grid size-[62px] place-items-center rounded-2xl shadow-lg"
                  style={{ background: color }}
                >
                  <Icon />
                  {badge ? (
                    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-xs font-bold">
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}