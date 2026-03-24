import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasArtistAccess, hasVenueAccess } from "@/lib/membership";
import { refreshShowAggregates } from "@/lib/shows/sync-show-state";
import { requireSessionUser } from "@/lib/session";
import { uuid } from "@/lib/validation/common";
import { ShowArtistSource } from "@prisma/client";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm_venue_booking") }),
  z.object({
    action: z.literal("confirm_artist_participation"),
    artistId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("venue_accept_artist"),
    artistId: z.string().uuid(),
  }),
]);

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
    select: { id: true, venueId: true },
  });
  if (!show) return fail("Show not found", 404);
  if (!show.venueId && parsed.data.action !== "confirm_artist_participation") {
    return fail("Only participation approvals apply to unlinked shows", 400);
  }

  try {
    if (parsed.data.action === "confirm_venue_booking") {
      if (!show.venueId) return fail("Show has no venue", 400);
      const allowed = await hasVenueAccess(user.id, show.venueId);
      if (!allowed) return fail("Forbidden", 403);
      await prisma.show.update({
        where: { id: showId },
        data: { venueApproved: true },
      });
    }

    if (parsed.data.action === "confirm_artist_participation") {
      const { artistId } = parsed.data;
      const allowed = await hasArtistAccess(user.id, artistId);
      if (!allowed) return fail("Forbidden", 403);

      const row = await prisma.showArtist.findFirst({
        where: { showId, artistId, isDeleted: false },
      });
      if (!row) return fail("Artist is not on this show", 404);
      if (row.source !== ShowArtistSource.LINEUP) {
        return fail("Artist participation can only be confirmed for lineup slots", 400);
      }

      await prisma.showArtist.update({
        where: { id: row.id },
        data: { artistApproved: true },
      });
    }

    if (parsed.data.action === "venue_accept_artist") {
      if (!show.venueId) return fail("Show has no venue", 400);
      const allowed = await hasVenueAccess(user.id, show.venueId);
      if (!allowed) return fail("Forbidden", 403);

      const { artistId } = parsed.data;
      const row = await prisma.showArtist.findFirst({
        where: { showId, artistId, isDeleted: false },
      });
      if (!row) return fail("Artist is not on this show", 404);
      if (row.source !== ShowArtistSource.JOIN_REQUEST) {
        return fail("Venue can only accept join requests for this action", 400);
      }

      await prisma.showArtist.update({
        where: { id: row.id },
        data: { artistApproved: true },
      });
    }

    await refreshShowAggregates(showId);

    const updated = await prisma.show.findFirst({
      where: { id: showId, isDeleted: false },
      include: {
        venue: true,
        showArtists: { where: { isDeleted: false }, include: { artist: true } },
      },
    });

    return ok({ show: updated });
  } catch {
    return serverError();
  }
}
