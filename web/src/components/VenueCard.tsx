import Link from "next/link";

export type VenueCardProps = {
  id: string;
  name: string;
  address: string;
  distanceKm?: number;
};

export function VenueCard({ id, name, address, distanceKm }: VenueCardProps) {
  return (
    <Link
      href={`/venues/${id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-400/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{name}</h3>
        {distanceKm !== undefined ? (
          <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
            {distanceKm} km
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{address}</p>
    </Link>
  );
}
