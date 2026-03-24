import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasArtistAccess, hasVenueAccess } from "@/lib/membership";
import { applyCreatorAutoApprovals, refreshShowAggregates } from "@/lib/shows/sync-show-state";
import { requireSessionUser } from "@/lib/session";
import { dateOnlySchema, timeSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  actorRole: z.enum(["ARTIST", "VENUE"]),
  venueId: z.string().uuid().nullable().optional(),
  unlinkedVenueName: z.string().min(1).max(200).optional(),
  unlinkedVenueAddress: z.string().min(1).max(500).optional(),
  date: dateOnlySchema,
  startTime: timeSchema,
  endTime: timeSchema.optional(),
  artistIds: z.array(z.string().uuid()).min(1),
});

export async function POST(req: Request): Promise<NextResponse> {
  const user = await requireSessionUser();
  if (!user?.id) return fail("Unauthorized", 401);

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

  const venueId = parsed.data.venueId ?? null;
  const linked = Boolean(venueId);

  if (linked) {
    if (parsed.data.unlinkedVenueName ?? parsed.data.unlinkedVenueAddress) {
      return fail("Unlinked venue fields must be empty when venueId is set", 400);
    }
  } else {
    if (!parsed.data.unlinkedVenueName?.trim() || !parsed.data.unlinkedVenueAddress?.trim()) {
      return fail("unlinkedVenueName and unlinkedVenueAddress required when venueId is null", 400);
    }
  }

  const artistIds = [...new Set(parsed.data.artistIds)];

  const artists = await prisma.artist.findMany({
    where: { id: { in: artistIds }, isDeleted: false },
    select: { id: true },
  });
  if (artists.length !== artistIds.length) {
    return fail("One or more artists were not found", 400);
  }

  const showDate = new Date(`${parsed.data.date}T12:00:00.000Z`);

  if (parsed.data.actorRole === "VENUE") {
    if (!linked) return fail("Venue-managed shows cannot be unlinked", 400);
    if (!venueId) return fail("Venue-managed shows must include venueId", 400);
    const canVenue = await hasVenueAccess(user.id, venueId);
    if (!canVenue) return fail("Forbidden", 403);
  } else {
    for (const aid of artistIds) {
      const okArtist = await hasArtistAccess(user.id, aid);
      if (!okArtist) return fail(`No access to manage artist ${aid}`, 403);
    }
  }

  if (linked && venueId) {
    const venue = await prisma.venue.findFirst({
      where: { id: venueId, isDeleted: false },
      select: { id: true },
    });
    if (!venue) return fail("Venue not found", 404);
  }

  try {
    const show = await prisma.$transaction(async (tx) => {
      const venueApproved = linked && parsed.data.actorRole === "VENUE";

      const created = await tx.show.create({
        data: {
          venueId: linked ? venueId : null,
          unlinkedVenueName: linked ? null : parsed.data.unlinkedVenueName?.trim() ?? null,
          unlinkedVenueAddress: linked ? null : parsed.data.unlinkedVenueAddress?.trim() ?? null,
          date: showDate,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          venueApproved,
          artistApproved: false,
          isVisible: false,
          createdByUserId: user.id,
        },
      });

      for (const aid of artistIds) {
        const lineApproved = !linked || parsed.data.actorRole === "ARTIST";
        await tx.showArtist.create({
          data: {
            showId: created.id,
            artistId: aid,
            artistApproved: lineApproved,
          },
        });
      }

      return created;
    });

    await refreshShowAggregates(show.id);
    await applyCreatorAutoApprovals(show.id, user.id);

    const full = await prisma.show.findFirst({
      where: { id: show.id, isDeleted: false },
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
