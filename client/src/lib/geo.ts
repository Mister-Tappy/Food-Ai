import type { GeoPoint } from "../types";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * The app's types use numeric restaurant ids everywhere (favorites,
 * history, route params). OSM ids are strings like "node/123456", so we
 * derive a small, stable, deterministic positive integer from the osmId
 * instead of widening every `id: number` in the codebase to `number | string`.
 * The real osmId is always kept alongside on `restaurant.osmId` for any
 * lookups back against Overpass/Nominatim.
 */
export function hashOsmId(osmId: string): number {
  let hash = 0;
  for (let i = 0; i < osmId.length; i++) {
    hash = (hash * 31 + osmId.charCodeAt(i)) | 0; // 32-bit int, wraps safely
  }
  return 1000000 + (Math.abs(hash) % 1000000000);
}
