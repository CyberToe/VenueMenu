import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/auth";
import { fail, ok } from "@/lib/api-response";
import { emailSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return fail("Invalid credentials", 401);
    throw e;
  }

  return ok({ signedIn: true });
}
