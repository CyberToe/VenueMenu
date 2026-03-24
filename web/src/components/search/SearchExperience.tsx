"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ShowCard } from "@/components/ShowCard";
import { VenueCard } from "@/components/VenueCard";

const MapLazy = dynamic(() => import("./SearchMapInner").then((m) => m.SearchMapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
      Loading map…
    </div>
  ),
});

type SearchShow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  unlinkedVenueName: string | null;
  unlinkedVenueAddress: string | null;
  venue: { id: string; name: string; address: string } | null;
  showArtists: { artist: { id: string; name: string } }[];
};

type SearchVenueBundle = {
  venue: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  };
  shows: SearchShow[];
};

export function SearchExperience() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [radius, setRadius] = useState("25");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchVenueBundle[] | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const runSearch = useCallback(async () => {
    if (lat === null || lng === null) {
      setApiError("Set location using your browser or enter coordinates via geolocation.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const q = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        date,
        radius: radius || "25",
      });
      const res = await fetch(`/api/search?${q.toString()}`);
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: boolean }).success === true &&
        "data" in json
      ) {
        const data = (json as unknown as { data: unknown }).data;
        setResults(Array.isArray(data) ? (data as SearchVenueBundle[]) : []);
      } else if (typeof json === "object" && json !== null && "error" in json) {
        setApiError(String((json as { error: string }).error));
        setResults(null);
      } else {
        setApiError("Unexpected response");
        setResults(null);
      }
    } catch {
      setApiError("Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, date, radius]);

  const useGeo = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setLocError("Could not read your location. Allow permission and try again."),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Search</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Radius (km)</span>
              <input
                type="number"
                min={1}
                max={500}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useGeo}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              Use my location
            </button>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={loading}
              className="rounded-lg border border-amber-600 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          {lat !== null && lng !== null ? (
            <p className="mt-2 text-xs text-zinc-500">
              Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
            </p>
          ) : null}
          {locError ? <p className="mt-2 text-sm text-red-600">{locError}</p> : null}
          {apiError ? <p className="mt-2 text-sm text-red-600">{apiError}</p> : null}
          {!token ? (
            <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
              Add <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">NEXT_PUBLIC_MAPBOX_TOKEN</code> to show
              the map.
            </p>
          ) : null}
        </div>

        <div className="min-h-[320px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {token && lat !== null && lng !== null ? (
            <MapLazy
              latitude={lat}
              longitude={lng}
              venues={
                results?.map((r) => ({
                  id: r.venue.id,
                  latitude: r.venue.latitude,
                  longitude: r.venue.longitude,
                  name: r.venue.name,
                })) ?? []
              }
            />
          ) : (
            <div className="flex h-[320px] items-center justify-center bg-zinc-100 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              Allow location to load the map
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
        {!results ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Run a search to see venues and shows.</p>
        ) : results.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No venues with visible shows in range.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {results.map((row) => (
              <li key={row.venue.id} className="space-y-2">
                <VenueCard
                  id={row.venue.id}
                  name={row.venue.name}
                  address={row.venue.address}
                  distanceKm={row.venue.distanceKm}
                />
                <ul className="space-y-2 pl-1">
                  {row.shows.map((s) => (
                    <li key={s.id}>
                      <ShowCard
                        id={s.id}
                        date={String(s.date).slice(0, 10)}
                        startTime={s.startTime}
                        endTime={s.endTime}
                        unlinkedVenueName={s.unlinkedVenueName}
                        unlinkedVenueAddress={s.unlinkedVenueAddress}
                        venue={s.venue}
                        artists={s.showArtists}
                      />
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/venues/${row.venue.id}`}
                  className="inline-block text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                >
                  Open venue page →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
