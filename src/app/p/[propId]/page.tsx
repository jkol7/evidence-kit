import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhoneLoader } from "@/components/phone/PhoneLoader";
import { getSample, samples } from "@/data/samples";

interface PageProps {
  params: Promise<{ propId: string }>;
}

export function generateStaticParams() {
  return Object.keys(samples).map((propId) => ({ propId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const prop = getSample((await params).propId);
  return { title: prop ? `${prop.content.ownerName} · Evidence Kit` : "Prop not found" };
}

export default async function PropPage({ params }: PageProps) {
  const { propId } = await params;
  const prop = getSample(propId);
  if (!prop) notFound();

  // Known limitation: the whole prop, answers included, is sent to the browser.
  // Checking answers moves to the server before any public launch.
  return <PhoneLoader prop={prop} />;
}