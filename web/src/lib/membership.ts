import { prisma } from "@/lib/db";

export async function hasArtistAccess(userId: string, artistId: string): Promise<boolean> {
  const row = await prisma.artistMembership.findFirst({
    where: { userId, artistId, isDeleted: false },
  });
  return Boolean(row);
}

export async function hasVenueAccess(userId: string, venueId: string): Promise<boolean> {
  const row = await prisma.venueMembership.findFirst({
    where: { userId, venueId, isDeleted: false },
  });
  return Boolean(row);
}
