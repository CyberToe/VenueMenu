"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JoinLine = { artistId: string; artistName: string };
type LineupLine = { artistId: string; artistName: string };

export type VenueApprovalRow = {
  showId: string;
  date: string;
  startTime: string;
  venueName: string;
  needsVenueBooking: boolean;
  joinLines: JoinLine[];
};

export type ArtistApprovalRow = {
  showId: string;
  date: string;
  startTime: string;
  venueName: string;
  lineupLines: LineupLine[];
};

type ClaimRow = {
  id: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  userLabel: string | null;
};

export function DashboardApprovals({
  venueRows,
  artistRows,
  claims,
}: {
  venueRows: VenueApprovalRow[];
  artistRows: ArtistApprovalRow[];
  claims: ClaimRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function approve(
    showId: string,
    body: Record<string, string | undefined>,
  ): Promise<void> {
    setBusy(showId + JSON.stringify(body));
    setErr(null);
    try {
      const res = await fetch(`/api/shows/${showId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success === true
      ) {
        router.refresh();
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setErr(String((json as { error: string }).error));
      }
    } finally {
      setBusy(null);
    }
  }

  async function decideClaim(claimId: string, decision: "APPROVE" | "REJECT") {
    setBusy(claimId + decision);
    setErr(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success === true
      ) {
        router.refresh();
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setErr(String((json as { error: string }).error));
      }
    } finally {
      setBusy(null);
    }
  }

  const hasWork = venueRows.length > 0 || artistRows.length > 0 || claims.length > 0;

  return (
    <div className="space-y-8">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Venue approvals</h2>
        {venueRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Nothing pending for your venues.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {venueRows.map((row) => (
              <li
                key={row.showId}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {row.venueName} · {row.date} {row.startTime}
                </p>
                {row.needsVenueBooking ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      void approve(row.showId, { action: "confirm_venue_booking" })
                    }
                    className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                  >
                    Confirm venue booking
                  </button>
                ) : null}
                {row.joinLines.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {row.joinLines.map((j) => (
                      <li key={j.artistId} className="flex flex-wrap items-center gap-2 text-sm">
                        <span>
                          Join request: <strong>{j.artistName}</strong>
                        </span>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            void approve(row.showId, {
                              action: "venue_accept_artist",
                              artistId: j.artistId,
                            })
                          }
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium dark:border-zinc-600"
                        >
                          Accept artist
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Artist confirmations</h2>
        {artistRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No lineup slots need your confirmation.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {artistRows.map((row) => (
              <li
                key={row.showId}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {row.venueName} · {row.date} {row.startTime}
                </p>
                <ul className="mt-2 space-y-2">
                  {row.lineupLines.map((line) => (
                    <li key={line.artistId} className="flex flex-wrap items-center gap-2 text-sm">
                      <span>
                        Lineup: <strong>{line.artistName}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          void approve(row.showId, {
                            action: "confirm_artist_participation",
                            artistId: line.artistId,
                          })
                        }
                        className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white dark:bg-amber-600"
                      >
                        Confirm participation
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {claims.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Admin: claims</h2>
          <ul className="mt-3 space-y-3">
            {claims.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-sm">
                  <strong>{c.targetType}</strong> · {c.targetName ?? c.targetId}
                </p>
                <p className="text-xs text-zinc-500">Requester: {c.userLabel}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void decideClaim(c.id, "APPROVE")}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void decideClaim(c.id, "REJECT")}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!hasWork ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">You are all caught up on approvals.</p>
      ) : null}
    </div>
  );
}
