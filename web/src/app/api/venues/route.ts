import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { MembershipRole } from "@prisma/client";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
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
    const venue = await prisma.$transaction(async (tx) => {
      const v = await tx.venue.create({ data: parsed.data });
      await tx.venueMembership.create({
        data: {
          userId: user.id,
          venueId: v.id,
          role: MembershipRole.OWNER,
        },
      });
      return v;
    });
    return ok({ venue });
  } catch {
    return serverError();
  }
}
