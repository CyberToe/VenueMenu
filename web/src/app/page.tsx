import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Discovery-first
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50">
        Find live music near you
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Browse venues and artists by date and location. Linked listings stay hidden until artists and venues agree, so
        what you see is deliberate—not noise.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/search"
          className="rounded-full bg-amber-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
        >
          Find venue
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-zinc-300 px-8 py-3 text-base font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Sign in to manage shows
        </Link>
      </div>
    </div>
  );
}
