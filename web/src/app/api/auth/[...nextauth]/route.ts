import { handlers } from "@/auth";

/** Prisma + credentials run in Node; avoid Edge on Vercel. */
export const runtime = "nodejs";

export const { GET, POST } = handlers;
