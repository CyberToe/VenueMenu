import { ClaimStatus, ShowArtistSource } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  DashboardApprovals,
  type ArtistApprovalRow,
  type VenueApprovalRow,
} from "@/components/dashboard/DashboardApprovals";
import { DashboardCreateShow } from "@/components/dashboard/DashboardCreateShow";
import { DashboardManage } from "@/components/dashboard/DashboardManage";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [artists, venues, venueSearchList] = await Promise.all([
    prisma.artist.findMany({
      where: { isDeleted: false, memberships: { some: { userId, isDeleted: false } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.venue.findMany({
      where: { isDeleted: false, memberships: { some: { userId, isDeleted: false } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true },
    }),
    prisma.venue.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
      take: 300,
      select: { id: true, name: true },
    }),
  ]);

  const myVenueIds = venues.map((v) => v.id);
  const myArtistIds = artists.map((a) => a.id);

  const venueSideRaw =
    myVenueIds.length === 0
      ? []
      : await prisma.show.findMany({
          where: {
            isDeleted: false,
            venueId: { in: myVenueIds },
            OR: [
              { venueApproved: false },
              {
                showArtists: {
                  some: {
                    isDeleted: false,
                    source: ShowArtistSource.JOIN_REQUEST,
                    artistApproved: false,
                  },
                },
              },
            ],
          },
          include: {
            venue: true,
            showArtists: { where: { isDeleted: false }, include: { artist: true } },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        });

  const venueRowsAll: VenueApprovalRow[] = venueSideRaw.map((s) => ({
    showId: s.id,
    date: s.date.toISOString().slice(0, 10),
    startTime: s.startTime,
    venueName: s.venue?.name ?? "",
    needsVenueBooking: Boolean(s.venueId && !s.venueApproved),
    joinLines: s.showArtists
      .filter((sa) => sa.source === ShowArtistSource.JOIN_REQUEST && !sa.artistApproved)
      .map((sa) => ({ artistId: sa.artistId, artistName: sa.artist.name })),
  }));

  const venueRows = venueRowsAll.filter((r) => r.needsVenueBooking || r.joinLines.length > 0);

  const artistSideRaw =
    myArtistIds.length === 0
      ? []
      : await prisma.show.findMany({
          where: {
            isDeleted: false,
            venueId: { not: null },
            showArtists: {
              some: {
                artistId: { in: myArtistIds },
                isDeleted: false,
                source: ShowArtistSource.LINEUP,
                artistApproved: false,
              },
            },
          },
          include: {
            venue: true,
            showArtists: { where: { isDeleted: false }, include: { artist: true } },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        });

  const artistRows: ArtistApprovalRow[] = artistSideRaw
    .map((s) => ({
      showId: s.id,
      date: s.date.toISOString().slice(0, 10),
      startTime: s.startTime,
      venueName: s.venue?.name ?? "",
      lineupLines: s.showArtists
        .filter(
          (sa) =>
            myArtistIds.includes(sa.artistId) &&
            sa.source === ShowArtistSource.LINEUP &&
            !sa.artistApproved,
        )
        .map((sa) => ({ artistId: sa.artistId, artistName: sa.artist.name })),
    }))
    .filter((r) => r.lineupLines.length > 0);

  const claimsRaw = session.user.isAdmin
    ? await prisma.claim.findMany({
        where: { status: ClaimStatus.PENDING, isDeleted: false },
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const claims = await Promise.all(
    claimsRaw.map(async (c) => {
      let targetName: string | null = null;
      if (c.targetType === "ARTIST") {
        const a = await prisma.artist.findFirst({
          where: { id: c.targetId, isDeleted: false },
          select: { name: true },
        });
        targetName = a?.name ?? null;
      } else {
        const v = await prisma.venue.findFirst({
          where: { id: c.targetId, isDeleted: false },
          select: { name: true },
        });
        targetName = v?.name ?? null;
      }
      return {
        id: c.id,
        targetType: c.targetType,
        targetId: c.targetId,
        targetName,
        userLabel: c.user.email ?? c.user.name,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Manage artists and venues, then clear approvals.</p>

      <div className="mt-10">
        <DashboardManage artists={artists} venues={venues} />
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <DashboardCreateShow
          myVenues={venues.map((v) => ({ id: v.id, name: v.name }))}
          myArtists={artists}
          venueSearchList={venueSearchList}
        />
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <DashboardApprovals venueRows={venueRows} artistRows={artistRows} claims={claims} />
      </div>
    </div>
  );
}
