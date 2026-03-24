import Link from "next/link";
import { notFound } from "next/navigation";
import { ShowCard } from "@/components/ShowCard";
import { prisma } from "@/lib/db";

type PageProps = { params: Promise<{ id: string }> };

export default async function VenuePage({ params }: PageProps) {
  const { id } = await params;

  const venue = await prisma.venue.findFirst({
    where: { id, isDeleted: false },
  });
  if (!venue) notFound();

  const shows = await prisma.show.findMany({
    where: {
      venueId: id,
      isDeleted: false,
      isVisible: true,
    },
    include: {
      venue: { select: { id: true, name: true } },
      showArtists: {
        where: { isDeleted: false },
        include: { artist: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        <Link href="/search" className="hover:underline">
          ← Search
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{venue.name}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{venue.address}</p>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Shows</h2>
        {shows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No public shows listed yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {shows.map((s) => (
              <li key={s.id}>
                <ShowCard
                  id={s.id}
                  date={s.date.toISOString().slice(0, 10)}
                  startTime={s.startTime}
                  endTime={s.endTime}
                  unlinkedVenueName={s.unlinkedVenueName}
                  unlinkedVenueAddress={s.unlinkedVenueAddress}
                  venue={s.venue}
                  artists={s.showArtists}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
