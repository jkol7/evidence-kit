import type { Prop } from "@/lib/props/types";
import { harborLight } from "./harbor-light";

/** Sample props, keyed by URL slug. Replaced by the database later. */
export const samples: Record<string, Prop> = {
  "harbor-light": harborLight,
};

export const getSample = (slug: string): Prop | undefined => samples[slug];