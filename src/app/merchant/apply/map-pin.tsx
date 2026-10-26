"use client";

import { useState } from "react";

/** Map pin without paid APIs: lat/lng inputs, browser geolocation, and an OpenStreetMap preview. */
export function MapPin({ error }: { error?: string }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const la = Number(lat);
  const ln = Number(lng);
  const valid = lat !== "" && lng !== "" && Number.isFinite(la) && Number.isFinite(ln);
  const d = 0.006;
  const embed = valid
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${ln - d},${la - d},${ln + d},${la + d}&layer=mapnik&marker=${la},${ln}`
    : null;

  function useMyLocation() {
    if (!navigator.geolocation) return setGeoMsg("Location not available in this browser");
    setGeoMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoMsg("Pin set from your current location — stand at the shop for best accuracy.");
      },
      () => setGeoMsg("Could not get your location. Enter the coordinates instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <fieldset className="space-y-2 rounded-xl border border-[#0E3B24]/10 p-3">
      <legend className="px-1 text-sm font-semibold">Shop location (map pin) *</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          Latitude
          <input
            name="latitude"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-29.6740"
            className="mt-1 h-11 w-full rounded-xl border border-[#0E3B24]/15 px-3 text-sm"
          />
        </label>
        <label className="text-xs">
          Longitude
          <input
            name="longitude"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="31.0740"
            className="mt-1 h-11 w-full rounded-xl border border-[#0E3B24]/15 px-3 text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        className="text-sm font-semibold text-[#0E3B24] underline"
      >
        Use my current location
      </button>
      <p className="text-xs text-[#0E3B24]/55">
        Or find your shop on{" "}
        <a href="https://www.openstreetmap.org/#map=14/-29.67/31.07" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>
        , right-click it → “Show address”, and copy the coordinates here.
      </p>
      {geoMsg && <p className="text-xs text-[#0E3B24]/70">{geoMsg}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
      {embed && (
        <iframe
          title="Shop location preview"
          src={embed}
          className="h-48 w-full rounded-lg border border-[#0E3B24]/10"
          loading="lazy"
        />
      )}
    </fieldset>
  );
}
