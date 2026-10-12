import {
  distanceKm,
  nearestMerchantsWithinRadius,
  parseZoneGeo,
  rankMerchantsByDistance,
} from "./geo";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const cornubia = { lat: -29.7005, lng: 31.0685 };
const near = { lat: -29.702, lng: 31.07 }; // ~0.2–0.3 km
const far = { lat: -29.75, lng: 31.12 }; // well beyond 3 km

const nearDist = distanceKm(cornubia, near);
const farDist = distanceKm(cornubia, far);
assert(nearDist < 1, `near store should be under 1km, got ${nearDist}`);
assert(farDist > 3, `far store should be over 3km, got ${farDist}`);

const geo = parseZoneGeo(
  JSON.stringify({
    type: "radius",
    center: cornubia,
    radiusKm: 3,
  }),
);
assert(geo.radiusKm === 3, "radius from config");

const ranked = nearestMerchantsWithinRadius(
  [
    { id: "far", latitude: far.lat, longitude: far.lng },
    { id: "near", latitude: near.lat, longitude: near.lng },
    { id: "nocoords", latitude: null, longitude: null },
  ],
  cornubia,
  3,
);

assert(ranked.length === 1, "only nearest-in-radius merchant");
assert(ranked[0].id === "near", "nearest first");

const all = rankMerchantsByDistance(
  [
    { id: "far", latitude: far.lat, longitude: far.lng },
    { id: "near", latitude: near.lat, longitude: near.lng },
  ],
  cornubia,
  3,
);
assert(all[0].id === "near", "sorted by distance");
assert(all[1].withinRadius === false, "far marked outside radius");

console.log("geo.test.ts: all assertions passed");
