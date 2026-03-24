import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { uuid } from "@/lib/validation/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) return fail("Invalid id", 400);

  const artist = await prisma.artist.findFirst({
    where: { id, isDeleted: false },
    include: {
      media: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!artist) return fail("Not found", 404);

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
      venue: {
        select: { id: true, name: true, address: true },
      },
      showArtists: {
        where: { isDeleted: false },
        include: {
          artist: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 100,
  });

  return ok({ artist, shows });
}
