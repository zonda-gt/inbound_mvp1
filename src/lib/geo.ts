export type Coordinates = {
  lat: number;
  lng: number;
};

export type CoordinatesLike =
  | Coordinates
  | {
      lat?: number | null;
      lng?: number | null;
    }
  | null
  | undefined;

export function parseCoordinates(value: string | null | undefined): Coordinates | null {
  if (!value) return null;
  const [lngText, latText] = value.split(',');
  const lng = Number(lngText);
  const lat = Number(latText);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lat, lng };
}

export function getCoordinates(value: CoordinatesLike): Coordinates | null {
  if (!value) return null;
  const lat = value.lat;
  const lng = value.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat: lat as number, lng: lng as number };
}

export function distanceMeters(from: CoordinatesLike, to: CoordinatesLike): number | null {
  const origin = getCoordinates(from);
  const target = getCoordinates(to);
  if (!origin || !target) return null;

  const earthRadiusMeters = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(origin.lat)) * Math.cos(toRad(target.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceCompact(meters: number): string {
  if (meters < 1000) return `${Math.max(50, Math.round(meters / 10) * 10)}m`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function formatDistanceAway(meters: number): string {
  return `${formatDistanceCompact(meters)} away`;
}

export function getDistanceLabel(
  from: CoordinatesLike,
  to: CoordinatesLike,
  style: 'compact' | 'away' = 'compact',
): string | null {
  const meters = distanceMeters(from, to);
  if (meters == null) return null;
  return style === 'away' ? formatDistanceAway(meters) : formatDistanceCompact(meters);
}

export function sortByDistance<T extends { lat?: number | null; lng?: number | null }>(
  items: readonly T[],
  origin: CoordinatesLike,
): T[] {
  const resolvedOrigin = getCoordinates(origin);
  if (!resolvedOrigin) return [...items];

  return [...items].sort((a, b) => {
    const distanceA = distanceMeters(resolvedOrigin, a) ?? Infinity;
    const distanceB = distanceMeters(resolvedOrigin, b) ?? Infinity;
    return distanceA - distanceB;
  });
}
