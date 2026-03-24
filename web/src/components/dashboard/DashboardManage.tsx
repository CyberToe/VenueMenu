"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Artist = { id: string; name: string };
type Venue = { id: string; name: string; address: string };

export function DashboardManage({ artists, venues }: { artists: Artist[]; venues: Venue[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [artistName, setArtistName] = useState("");
  const [artistDesc, setArtistDesc] = useState("");

  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  async function createArtist(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: artistName, description: artistDesc || undefined }),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success
      ) {
        setArtistName("");
        setArtistDesc("");
        router.refresh();
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setError(String((json as { error: string }).error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function createVenue(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Enter valid latitude and longitude.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: venueName,
          address: venueAddress,
          latitude,
          longitude,
        }),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success
      ) {
        setVenueName("");
        setVenueAddress("");
        setLat("");
        setLng("");
        router.refresh();
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setError(String((json as { error: string }).error));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create artist</h2>
          <form className="mt-3 space-y-2" onSubmit={(e) => void createArtist(e)}>
            <input
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              value={artistDesc}
              onChange={(e) => setArtistDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-600"
            >
              Save artist
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create venue</h2>
          <form className="mt-3 space-y-2" onSubmit={(e) => void createVenue(e)}>
            <input
              required
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Venue name"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              required
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Address"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-600"
            >
              Save venue
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your artists</h2>
          <ul className="mt-2 space-y-2">
            {artists.length === 0 ? (
              <li className="text-sm text-zinc-600 dark:text-zinc-400">None yet.</li>
            ) : (
              artists.map((a) => (
                <li key={a.id}>
                  <Link href={`/artists/${a.id}`} className="text-amber-700 hover:underline dark:text-amber-400">
                    {a.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your venues</h2>
          <ul className="mt-2 space-y-2">
            {venues.length === 0 ? (
              <li className="text-sm text-zinc-600 dark:text-zinc-400">None yet.</li>
            ) : (
              venues.map((v) => (
                <li key={v.id}>
                  <Link href={`/venues/${v.id}`} className="text-amber-700 hover:underline dark:text-amber-400">
                    {v.name}
                  </Link>
                  <span className="text-sm text-zinc-500"> — {v.address}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
