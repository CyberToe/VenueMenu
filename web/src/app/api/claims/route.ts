import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { ClaimStatus, ClaimTargetType } from "@prisma/client";

const bodySchema = z.object({
  targetType: z.nativeEnum(ClaimTargetType),
  targetId: z.string().uuid(),
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

  try {
    if (parsed.data.targetType === ClaimTargetType.ARTIST) {
      const artist = await prisma.artist.findFirst({
        where: { id: parsed.data.targetId, isDeleted: false },
        select: { id: true, isClaimed: true },
      });
      if (!artist) return fail("Artist not found", 404);
      if (artist.isClaimed) return fail("Artist is already claimed", 409);
    } else {
      const venue = await prisma.venue.findFirst({
        where: { id: parsed.data.targetId, isDeleted: false },
        select: { id: true, isClaimed: true },
      });
      if (!venue) return fail("Venue not found", 404);
      if (venue.isClaimed) return fail("Venue is already claimed", 409);
    }

    const pending = await prisma.claim.findFirst({
      where: {
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        status: ClaimStatus.PENDING,
        isDeleted: false,
      },
    });
    if (pending) return fail("A pending claim already exists", 409);

    const claim = await prisma.claim.create({
      data: {
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        status: ClaimStatus.PENDING,
      },
    });

    return ok({ claim });
  } catch {
    return serverError();
  }
}
