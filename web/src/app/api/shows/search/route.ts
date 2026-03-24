import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { findNearbyVenuesWithShows } from "@/lib/search/nearby-venues";
import { dateOnlySchema } from "@/lib/validation/common";

const querySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
  radius: z.coerce.number().finite().positive().max(500).optional().default(25),
  date: dateOnlySchema,
});

/** BRD alias: same contract as GET /api/search */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radius: url.searchParams.get("radius") ?? undefined,
    date: url.searchParams.get("date"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  const date = new Date(`${parsed.data.date}T12:00:00.000Z`);
  const data = await findNearbyVenuesWithShows({
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    radiusKm: parsed.data.radius,
    date,
  });

  return ok(data);
}
