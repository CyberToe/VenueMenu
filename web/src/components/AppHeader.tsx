import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Venue <span className="text-amber-600 dark:text-amber-400">Menu</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/search" className="text-zinc-700 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-400">
            Find venue
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
