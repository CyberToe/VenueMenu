import { prisma } from "@/lib/db";
import { distanceKm } from "@/lib/geo";

const SHOWS_PER_VENUE = 5;

export type NearbySearchParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  date: Date;
};

export async function findNearbyVenuesWithShows(params: NearbySearchParams) {
  const venues = await prisma.venue.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  });

  const nearby = venues
    .map((v) => ({
      ...v,
      distanceKm: distanceKm(params.lat, params.lng, v.latitude, v.longitude),
    }))
    .filter((v) => v.distanceKm <= params.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const venueIds = nearby.map((v) => v.id);
  if (venueIds.length === 0) return [];

  const shows = await prisma.show.findMany({
    where: {
      isDeleted: false,
      venueId: { in: venueIds },
      date: params.date,
      isVisible: true,
    },
    include: {
      showArtists: {
        where: { isDeleted: false },
        include: {
          artist: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const byVenue = new Map<string, typeof shows>();
  for (const s of shows) {
    if (!s.venueId) continue;
    const list = byVenue.get(s.venueId) ?? [];
    list.push(s);
    byVenue.set(s.venueId, list);
  }

  return nearby.map((v) => ({
    venue: {
      id: v.id,
      name: v.name,
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      distanceKm: Math.round(v.distanceKm * 10) / 10,
    },
    shows: (byVenue.get(v.id) ?? []).slice(0, SHOWS_PER_VENUE),
  }));
}
