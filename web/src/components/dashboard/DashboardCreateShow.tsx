"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type IdName = { id: string; name: string };

export function DashboardCreateShow({
  myVenues,
  myArtists,
  venueSearchList,
}: {
  myVenues: IdName[];
  myArtists: IdName[];
  venueSearchList: IdName[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [actorRole, setActorRole] = useState<"ARTIST" | "VENUE">("ARTIST");
  const [mode, setMode] = useState<"linked" | "unlinked">("linked");
  const [venueId, setVenueId] = useState("");
  const [unlinkedName, setUnlinkedName] = useState("");
  const [unlinkedAddress, setUnlinkedAddress] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<Record<string, boolean>>({});

  const artistList = useMemo(
    () => myArtists.filter((a) => selectedArtists[a.id]),
    [myArtists, selectedArtists],
  );

  const venuePickList = actorRole === "VENUE" ? myVenues : venueSearchList;

  function toggleArtist(id: string) {
    setSelectedArtists((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const artistIds = myArtists.filter((a) => selectedArtists[a.id]).map((a) => a.id);
    if (artistIds.length === 0) {
      setError("Select at least one artist.");
      setBusy(false);
      return;
    }

    let body: Record<string, unknown>;

    if (actorRole === "VENUE") {
      if (!venueId) {
        setError("Select your venue.");
        setBusy(false);
        return;
      }
      body = {
        actorRole: "VENUE",
        venueId,
        date,
        startTime,
        endTime: endTime.trim() || undefined,
        artistIds,
      };
    } else if (mode === "unlinked") {
      body = {
        actorRole: "ARTIST",
        venueId: null,
        unlinkedVenueName: unlinkedName.trim(),
        unlinkedVenueAddress: unlinkedAddress.trim(),
        date,
        startTime,
        endTime: endTime.trim() || undefined,
        artistIds,
      };
    } else {
      if (!venueId) {
        setError("Select a venue or switch to manual venue entry.");
        setBusy(false);
        return;
      }
      body = {
        actorRole: "ARTIST",
        venueId,
        date,
        startTime,
        endTime: endTime.trim() || undefined,
        artistIds,
      };
    }

    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success
      ) {
        setSelectedArtists({});
        router.refresh();
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setError(String((json as { error: string }).error));
      } else {
        setError("Could not create show.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (myArtists.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Create an artist profile first to add shows.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create show</h2>
      <form className="mt-4 space-y-4" onSubmit={(e) => void submit(e)}>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Acting as</legend>
          <label className="mr-4 text-sm">
            <input
              type="radio"
              name="actor"
              checked={actorRole === "ARTIST"}
              onChange={() => {
                setActorRole("ARTIST");
                setVenueId("");
              }}
            />{" "}
            Artist
          </label>
          <label className="text-sm">
            <input
              type="radio"
              name="actor"
              checked={actorRole === "VENUE"}
              onChange={() => {
                setActorRole("VENUE");
                setMode("linked");
                setVenueId("");
              }}
            />{" "}
            Venue
          </label>
        </fieldset>

        {actorRole === "ARTIST" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Venue</legend>
            <label className="mr-4 text-sm">
              <input
                type="radio"
                name="vmode"
                checked={mode === "linked"}
                onChange={() => setMode("linked")}
              />{" "}
              Link to directory venue
            </label>
            <label className="text-sm">
              <input
                type="radio"
                name="vmode"
                checked={mode === "unlinked"}
                onChange={() => setMode("unlinked")}
              />{" "}
              Manual venue (unlinked)
            </label>
          </fieldset>
        ) : null}

        {actorRole === "ARTIST" && mode === "unlinked" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              value={unlinkedName}
              onChange={(e) => setUnlinkedName(e.target.value)}
              placeholder="Venue name"
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              required
              value={unlinkedAddress}
              onChange={(e) => setUnlinkedAddress(e.target.value)}
              placeholder="Venue address"
              className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
            />
          </div>
        ) : (
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              {actorRole === "VENUE" ? "Your venue" : "Venue"}
            </span>
            <select
              required={actorRole === "VENUE" || mode === "linked"}
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Select…</option>
              {venuePickList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-sm">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm">
            Start
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm">
            End (optional)
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Artists on bill</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
            {myArtists.map((a) => (
              <li key={a.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedArtists[a.id])}
                    onChange={() => toggleArtist(a.id)}
                  />
                  {a.name}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Create show"}
        </button>
        {artistList.length > 0 ? (
          <p className="text-xs text-zinc-500">
            Selected: {artistList.map((a) => a.name).join(", ")}
          </p>
        ) : null}
      </form>
    </div>
  );
}
