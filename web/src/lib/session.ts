import { auth } from "@/auth";

export async function requireSessionUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !session.user.isAdmin) return null;
  return session.user;
}
