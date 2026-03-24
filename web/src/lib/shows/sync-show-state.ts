import { prisma } from "@/lib/db";
import { computeIsVisible, computeShowArtistApprovedFlag } from "@/lib/shows/visibility";

export async function refreshShowAggregates(showId: string): Promise<void> {
  const show = await prisma.show.findFirst({
    where: { id: showId, isDeleted: false },
    include: { showArtists: { where: { isDeleted: false } } },
  });
  if (!show) return;

  const artistApproved = computeShowArtistApprovedFlag(show.showArtists);
  const isVisible = computeIsVisible(show.venueId, show.venueApproved, show.showArtists);

  await prisma.show.update({
    where: { id: showId },
    data: { artistApproved, isVisible },
  });
}

/** After linking or membership changes, re-apply creator auto-approvals per BRD. */
export async function applyCreatorAutoApprovals(
  showId: string,
  creatorUserId: string | null,
): Promise<void> {
  if (!creatorUserId) {
    await refreshShowAggregates(showId);
    return;
  }

  const show = await prisma.show.findFirst({
    where: { id: showId, isDeleted: false },
    include: {
      showArtists: { where: { isDeleted: false } },
      venue: true,
    },
  });
  if (!show) return;

  if (show.venueId) {
    const venueOk = await prisma.venueMembership.findFirst({
      where: {
        userId: creatorUserId,
        venueId: show.venueId,
        isDeleted: false,
      },
    });
    if (venueOk) {
      await prisma.show.update({
        where: { id: showId },
        data: { venueApproved: true },
      });
    }
  }

  const artistIds = show.showArtists.map((sa) => sa.artistId);
  if (artistIds.length > 0) {
    const allowed = await prisma.artistMembership.findMany({
      where: {
        userId: creatorUserId,
        artistId: { in: artistIds },
        isDeleted: false,
      },
      select: { artistId: true },
    });
    const allowedSet = new Set(allowed.map((a) => a.artistId));
    for (const sa of show.showArtists) {
      if (allowedSet.has(sa.artistId)) {
        await prisma.showArtist.update({
          where: { id: sa.id },
          data: { artistApproved: true },
        });
      }
    }
  }

  await refreshShowAggregates(showId);
}
