/**
 * Distance helpers for nearest-store ranking within a configurable zone radius.
 * Uses haversine kilometres. Coordinates come from saved addresses / merchant profiles.
 */

import {
  DEFAULT_DURBAN_RADIUS_KM,
  DURBAN_CENTER,
} from "@/lib/zones-constants";

export type LatLng = { lat: number; lng: number };

export type ZoneGeoConfig = {
  type?: string;
  center?: LatLng;
  radiusKm?: number;
  allowedSuburbs?: string[];
  allowedCities?: string[];
  note?: string;
};

const EARTH_KM = 6371;

export function parseZoneGeo(boundaryJson: string | null | undefined): ZoneGeoConfig {
  if (!boundaryJson) {
    return {
      type: "radius",
      center: { ...DURBAN_CENTER },
      radiusKm: DEFAULT_DURBAN_RADIUS_KM,
      allowedCities: ["durban"],
    };
  }
  try {
    const parsed = JSON.parse(boundaryJson) as ZoneGeoConfig;
    return {
      type: parsed.type ?? "radius",
      center: parsed.center ?? { ...DURBAN_CENTER },
      radiusKm:
        typeof parsed.radiusKm === "number" && parsed.radiusKm > 0
          ? parsed.radiusKm
          : DEFAULT_DURBAN_RADIUS_KM,
      allowedSuburbs: parsed.allowedSuburbs,
      allowedCities: parsed.allowedCities,
      note: parsed.note,
    };
  } catch {
    return {
      type: "radius",
      center: { ...DURBAN_CENTER },
      radiusKm: DEFAULT_DURBAN_RADIUS_KM,
      allowedCities: ["durban"],
    };
  }
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number): string {
  if (km < 0.1) return "< 100 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export type MerchantLocation = {
  id: string;
  latitude: number | null;
  longitude: number | null;
};

export type RankedMerchant<T extends MerchantLocation> = T & {
  distanceKm: number | null;
  withinRadius: boolean;
};

/**
 * Rank merchants by distance from an origin point.
 * Merchants without coordinates are kept but marked outside ranking (null distance).
 */
export function rankMerchantsByDistance<T extends MerchantLocation>(
  merchants: T[],
  origin: LatLng,
  radiusKm: number,
): RankedMerchant<T>[] {
  return merchants
    .map((m) => {
      if (m.latitude == null || m.longitude == null) {
        return {
          ...m,
          distanceKm: null,
          withinRadius: false,
        };
      }
      const d = distanceKm(origin, { lat: m.latitude, lng: m.longitude });
      return {
        ...m,
        distanceKm: d,
        withinRadius: d <= radiusKm,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

export function nearestMerchantsWithinRadius<T extends MerchantLocation>(
  merchants: T[],
  origin: LatLng,
  radiusKm: number,
): RankedMerchant<T>[] {
  return rankMerchantsByDistance(merchants, origin, radiusKm).filter(
    (m) => m.withinRadius,
  );
}

export function resolveCustomerOrigin(params: {
  addressLat?: number | null;
  addressLng?: number | null;
  zoneBoundaryJson?: string | null;
}): { origin: LatLng; source: "address" | "zone_center"; radiusKm: number } {
  const geo = parseZoneGeo(params.zoneBoundaryJson);
  const radiusKm = geo.radiusKm ?? DEFAULT_DURBAN_RADIUS_KM;
  if (
    typeof params.addressLat === "number" &&
    typeof params.addressLng === "number"
  ) {
    return {
      origin: { lat: params.addressLat, lng: params.addressLng },
      source: "address",
      radiusKm,
    };
  }
  return {
    origin: geo.center ?? { ...DURBAN_CENTER },
    source: "zone_center",
    radiusKm,
  };
}
