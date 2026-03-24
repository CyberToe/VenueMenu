import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { MembershipRole } from "@prisma/client";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
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
    const artist = await prisma.$transaction(async (tx) => {
      const a = await tx.artist.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
        },
      });
      await tx.artistMembership.create({
        data: {
          userId: user.id,
          artistId: a.id,
          role: MembershipRole.OWNER,
        },
      });
      return a;
    });
    return ok({ artist });
  } catch {
    return serverError();
  }
}
