import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasArtistAccess } from "@/lib/membership";
import { refreshShowAggregates } from "@/lib/shows/sync-show-state";
import { requireSessionUser } from "@/lib/session";
import { uuid } from "@/lib/validation/common";
import { ShowArtistSource } from "@prisma/client";

const bodySchema = z.object({
  artistId: z.string().uuid(),
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
    select: { id: true, venueId: true },
  });
  if (!show) return fail("Show not found", 404);
  if (!show.venueId) {
    return fail("Artist join requests only apply to linked shows", 400);
  }

  const canArtist = await hasArtistAccess(user.id, parsed.data.artistId);
  if (!canArtist) return fail("Forbidden", 403);

  try {
    const existing = await prisma.showArtist.findFirst({
      where: {
        showId,
        artistId: parsed.data.artistId,
        isDeleted: false,
      },
    });
    if (existing) return fail("Artist already listed on this show", 409);

    await prisma.showArtist.create({
      data: {
        showId,
        artistId: parsed.data.artistId,
        artistApproved: false,
        source: ShowArtistSource.JOIN_REQUEST,
      },
    });

    await refreshShowAggregates(showId);

    return ok({ joined: true });
  } catch {
    return serverError();
  }
}
