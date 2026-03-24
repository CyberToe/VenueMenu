import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { uuid } from "@/lib/validation/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) return fail("Invalid id", 400);

  const venue = await prisma.venue.findFirst({
    where: { id, isDeleted: false },
  });
  if (!venue) return fail("Not found", 404);

  const shows = await prisma.show.findMany({
    where: {
      venueId: id,
      isDeleted: false,
      isVisible: true,
    },
    include: {
      showArtists: {
        where: { isDeleted: false },
        include: {
          artist: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 200,
  });

  return ok({ venue, shows });
}
