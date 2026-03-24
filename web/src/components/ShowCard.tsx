import Link from "next/link";

type ArtistLine = { artist: { id: string; name: string } };

export type ShowCardProps = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string | null;
  unlinkedVenueName?: string | null;
  unlinkedVenueAddress?: string | null;
  venue?: { id: string; name: string } | null;
  artists: ArtistLine[];
};

export function ShowCard({
  id,
  date,
  startTime,
  endTime,
  unlinkedVenueName,
  unlinkedVenueAddress,
  venue,
  artists,
}: ShowCardProps) {
  const venueLabel = venue
    ? venue.name
    : [unlinkedVenueName, unlinkedVenueAddress].filter(Boolean).join(" · ") || "TBA";

  return (
    <article
      id={`show-${id}`}
      className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {date} · {startTime}
          {endTime ? ` – ${endTime}` : null}
        </p>
        {venue ? (
          <Link href={`/venues/${venue.id}`} className="text-sm font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100">
            {venueLabel}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{venueLabel}</span>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {artists.map(({ artist: a }) => (
          <li key={a.id}>
            <Link
              href={`/artists/${a.id}`}
              className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-700"
            >
              {a.name}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
