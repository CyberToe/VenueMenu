import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ClaimStatus, ClaimTargetType, MembershipRole } from "@prisma/client";
import { uuid } from "@/lib/validation/common";

const bodySchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin?.id) return fail("Forbidden", 403);

  const { id: claimId } = await ctx.params;
  if (!uuid.safeParse(claimId).success) return fail("Invalid id", 400);

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

  const claim = await prisma.claim.findFirst({
    where: { id: claimId, isDeleted: false },
  });
  if (!claim) return fail("Claim not found", 404);
  if (claim.status !== ClaimStatus.PENDING) {
    return fail("Claim is not pending", 409);
  }

  try {
    if (parsed.data.decision === "REJECT") {
      await prisma.claim.update({
        where: { id: claimId },
        data: { status: ClaimStatus.REJECTED },
      });
      return ok({ status: ClaimStatus.REJECTED });
    }

    if (claim.targetType === ClaimTargetType.ARTIST) {
      const artist = await prisma.artist.findFirst({
        where: { id: claim.targetId, isDeleted: false },
        select: { id: true, isClaimed: true },
      });
      if (!artist) return fail("Artist not found", 404);
      if (artist.isClaimed) return fail("Artist is already claimed", 409);

      await prisma.$transaction([
        prisma.claim.update({
          where: { id: claimId },
          data: { status: ClaimStatus.APPROVED },
        }),
        prisma.artist.update({
          where: { id: artist.id },
          data: { isClaimed: true },
        }),
        prisma.artistMembership.upsert({
          where: {
            userId_artistId: { userId: claim.userId, artistId: artist.id },
          },
          create: {
            userId: claim.userId,
            artistId: artist.id,
            role: MembershipRole.OWNER,
          },
          update: {
            role: MembershipRole.OWNER,
            isDeleted: false,
          },
        }),
      ]);
    } else {
      const venue = await prisma.venue.findFirst({
        where: { id: claim.targetId, isDeleted: false },
        select: { id: true, isClaimed: true },
      });
      if (!venue) return fail("Venue not found", 404);
      if (venue.isClaimed) return fail("Venue is already claimed", 409);

      await prisma.$transaction([
        prisma.claim.update({
          where: { id: claimId },
          data: { status: ClaimStatus.APPROVED },
        }),
        prisma.venue.update({
          where: { id: venue.id },
          data: { isClaimed: true },
        }),
        prisma.venueMembership.upsert({
          where: {
            userId_venueId: { userId: claim.userId, venueId: venue.id },
          },
          create: {
            userId: claim.userId,
            venueId: venue.id,
            role: MembershipRole.OWNER,
          },
          update: {
            role: MembershipRole.OWNER,
            isDeleted: false,
          },
        }),
      ]);
    }

    return ok({ status: ClaimStatus.APPROVED });
  } catch {
    return serverError();
  }
}
