import type { Prisma } from "@prisma/client";

type ShowArtistRow = { artistApproved: boolean; isDeleted: boolean };

/**
 * BRD §5: Unlinked → visible. Linked → requires full approval. Fully approved → visible.
 */
export function computeIsVisible(
  venueId: string | null,
  venueApproved: boolean,
  showArtists: ShowArtistRow[],
): boolean {
  if (!venueId) return true;
  const active = showArtists.filter((r) => !r.isDeleted);
  if (active.length === 0) return false;
  return venueApproved && active.every((r) => r.artistApproved);
}

export function computeShowArtistApprovedFlag(showArtists: ShowArtistRow[]): boolean {
  const active = showArtists.filter((r) => !r.isDeleted);
  if (active.length === 0) return false;
  return active.every((r) => r.artistApproved);
}

export const showPublicInclude = {
  venue: true,
  showArtists: {
    where: { isDeleted: false },
    include: { artist: true },
  },
} satisfies Prisma.ShowInclude;

export type ShowPublicPayload = Prisma.ShowGetPayload<{ include: typeof showPublicInclude }>;
