"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNav() {
  const { data } = useSession();

  if (!data?.user) {
    return (
      <Link href="/login" className="text-zinc-700 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-400">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="text-zinc-700 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-400"
      >
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Sign out
      </button>
    </>
  );
}
