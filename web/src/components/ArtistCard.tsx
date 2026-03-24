import Link from "next/link";

export type ArtistCardProps = {
  id: string;
  name: string;
  description?: string | null;
};

export function ArtistCard({ id, name, description }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-400/40"
    >
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{name}</h3>
      {description ? (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      ) : null}
    </Link>
  );
}
