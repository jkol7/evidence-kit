import Link from "next/link";
import { samples } from "@/data/samples";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Evidence Kit</h1>
      <p className="mt-3 text-muted">
        Interactive props players open on their own phones: locked devices, hidden notes and messages that appear
        when the story is ready.
      </p>

      <section className="mt-10 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-medium">Sample props</h2>
        <ul className="mt-4 space-y-2">
          {Object.entries(samples).map(([slug, prop]) => (
            <li key={slug}>
              <Link href={`/p/${slug}`} className="text-accent hover:underline">
                {prop.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}