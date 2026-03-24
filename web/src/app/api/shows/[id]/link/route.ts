import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasArtistAccess } from "@/lib/membership";
import { applyCreatorAutoApprovals, refreshShowAggregates } from "@/lib/shows/sync-show-state";
import { requireSessionUser } from "@/lib/session";
import { uuid } from "@/lib/validation/common";

const bodySchema = z.object({
  venueId: z.string().uuid(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const user = await requireSessionUser();
  if (!user?.id) return fail("Unauthorized", 401);

  const { id: showId } = await ctx.params;
  if (!uuid.safeParse(showId).success) return fail("Invalid id", 400);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  const show = await prisma.show.findFirst({
    where: { id: showId, isDeleted: false },
    include: {
      showArtists: { where: { isDeleted: false }, select: { artistId: true } },
    },
  });
  if (!show) return fail("Show not found", 404);
  if (show.venueId) return fail("Show is already linked to a venue", 400);

  const venue = await prisma.venue.findFirst({
    where: { id: parsed.data.venueId, isDeleted: false },
    select: { id: true },
  });
  if (!venue) return fail("Venue not found", 404);

  const isCreator = show.createdByUserId === user.id;
  let canLink = isCreator;
  if (!canLink) {
    for (const sa of show.showArtists) {
      if (await hasArtistAccess(user.id, sa.artistId)) {
        canLink = true;
        break;
      }
    }
  }
  if (!canLink) return fail("Forbidden", 403);

  try {
    await prisma.$transaction([
      prisma.show.update({
        where: { id: showId },
        data: {
          venueId: parsed.data.venueId,
          unlinkedVenueName: null,
          unlinkedVenueAddress: null,
          venueApproved: false,
        },
      }),
      prisma.showArtist.updateMany({
        where: { showId, isDeleted: false },
        data: { artistApproved: false },
      }),
    ]);

    await applyCreatorAutoApprovals(showId, show.createdByUserId);
    await refreshShowAggregates(showId);

    const full = await prisma.show.findFirst({
      where: { id: showId, isDeleted: false },
      include: {
        venue: true,
        showArtists: { where: { isDeleted: false }, include: { artist: true } },
      },
    });

    return ok({ show: full });
  } catch {
    return serverError();
  }
}
