import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { emailSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  username: z.string().min(2).max(64).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
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

  const { email, password, username, firstName, lastName } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email, isDeleted: false },
    select: { id: true },
  });
  if (existing) return fail("Email already registered", 409);

  const passwordHash = await hash(password, 12);
  const display =
    [firstName, lastName].filter(Boolean).join(" ").trim() || username || email.split("@")[0];

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      username,
      firstName,
      lastName,
      name: display,
    },
    select: { id: true, email: true, username: true, name: true },
  });

  return ok({ user });
}
