"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";

type VenuePin = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

type SearchMapInnerProps = {
  latitude: number;
  longitude: number;
  venues: VenuePin[];
};

export function SearchMapInner({ latitude, longitude, venues }: SearchMapInnerProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const initialViewState = useMemo(
    () => ({
      latitude,
      longitude,
      zoom: 11,
    }),
    [latitude, longitude],
  );

  if (!token) return null;

  return (
    <div className="h-[320px] w-full lg:h-[480px]">
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-right" />
        <Marker longitude={longitude} latitude={latitude} color="#d97706" />
        {venues.map((v) => (
          <Marker key={v.id} longitude={v.longitude} latitude={v.latitude} anchor="bottom">
            <span className="block max-w-[140px] truncate rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-900 shadow ring-1 ring-zinc-900/20">
              {v.name}
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
