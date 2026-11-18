import type { PlaySession } from "@/hooks/usePlayState";
import type { PhoneContent } from "@/lib/props/types";

/** What every phone app receives from the phone. */
export interface AppProps {
  content: PhoneContent;
  session: PlaySession;
  onHome: () => void;
}