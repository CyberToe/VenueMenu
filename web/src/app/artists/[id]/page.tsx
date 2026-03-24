import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaPlayer } from "@/components/MediaPlayer";
import { ShowCard } from "@/components/ShowCard";
import { prisma } from "@/lib/db";

type PageProps = { params: Promise<{ id: string }> };

export default async function ArtistPage({ params }: PageProps) {
  const { id } = await params;

  const artist = await prisma.artist.findFirst({
    where: { id, isDeleted: false },
    include: {
      media: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!artist) notFound();

  const today = new Date();
  const todayDate = new Date(today.toISOString().slice(0, 10) + "T12:00:00.000Z");

  const shows = await prisma.show.findMany({
    where: {
      isDeleted: false,
      isVisible: true,
      date: { gte: todayDate },
      showArtists: {
        some: { artistId: id, isDeleted: false },
      },
    },
    include: {
      venue: { select: { id: true, name: true } },
      showArtists: {
        where: { isDeleted: false },
        include: { artist: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 50,
  });

  const primaryMedia = artist.media[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        <Link href="/search" className="hover:underline">
          ← Search
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{artist.name}</h1>
      {artist.description ? (
        <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">{artist.description}</p>
      ) : null}

      {primaryMedia ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Listen</h2>
          <MediaPlayer videoId={primaryMedia.youtubeVideoId} title={primaryMedia.title} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">No YouTube media yet.</p>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Upcoming shows</h2>
        {shows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No upcoming public shows.</p>
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
