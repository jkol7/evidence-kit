"use client";

import dynamic from "next/dynamic";
import type { PhoneProp } from "@/lib/props/types";

const Phone = dynamic(() => import("./Phone").then((m) => m.Phone), {
  ssr: false,
  loading: () => <p className="grid min-h-dvh place-items-center text-muted">Loading…</p>,
});

export function PhoneLoader({ prop }: { prop: PhoneProp }) {
  return <Phone key={prop.id} prop={prop} />;
}