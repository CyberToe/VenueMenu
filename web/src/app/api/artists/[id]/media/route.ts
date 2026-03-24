import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasArtistAccess } from "@/lib/membership";
import { requireSessionUser } from "@/lib/session";
import { extractYoutubeVideoId, isAllowedYoutubeUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { uuid } from "@/lib/validation/common";

const bodySchema = z.object({
  youtubeUrl: z.string().min(1).max(2048),
  title: z.string().max(300).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const user = await requireSessionUser();
  if (!user?.id) return fail("Unauthorized", 401);

  const { id: artistId } = await ctx.params;
  if (!uuid.safeParse(artistId).success) return fail("Invalid id", 400);

  const allowed = await hasArtistAccess(user.id, artistId);
  if (!allowed) return fail("Forbidden", 403);

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

  if (!isAllowedYoutubeUrl(parsed.data.youtubeUrl)) {
    return fail("Only YouTube URLs are allowed", 400);
  }

  const videoId = extractYoutubeVideoId(parsed.data.youtubeUrl);
  if (!videoId) return fail("Could not parse YouTube video id", 400);

  const artist = await prisma.artist.findFirst({
    where: { id: artistId, isDeleted: false },
    select: { id: true },
  });
  if (!artist) return fail("Artist not found", 404);

  try {
    const media = await prisma.media.create({
      data: {
        artistId,
        youtubeUrl: parsed.data.youtubeUrl.trim(),
        youtubeVideoId: videoId,
        title: parsed.data.title,
        thumbnailUrl: youtubeThumbnailUrl(videoId),
      },
    });
    return ok({ media });
  } catch {
    return serverError();
  }
}
