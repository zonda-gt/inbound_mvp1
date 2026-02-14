const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const BASE = "https://maps.googleapis.com/maps/api";
const PLACES_BASE = "https://places.googleapis.com/v1";

export type GeoResult = {
  location: string; // "lng,lat"
  formatted_address: string;
  name: string;
};

export type TransitSegment =
  | { type: "walking"; distance: number; duration: number; polyline?: string }
  | {
      type: "transit";
      lineName: string;
      departureStop: string;
      arrivalStop: string;
      stopCount: number;
      direction: string;
      polyline?: string;
    };

export type TransitRoute = {
  totalDuration: number; // minutes
  totalWalkingDistance: number; // meters
  transferCount: number;
  segments: TransitSegment[];
  cost: string;
};

export type WalkingRoute = {
  distance: number; // meters
  duration: number; // minutes
  polyline?: string; // "lng,lat;lng,lat;..." for map display
};

// --------------- Reverse Geocode (Get city from coordinates) ---------------

export type ReverseGeoResult = {
  city: string;
  district: string;
  province: string;
  formatted_address: string;
};

export async function reverseGeocode(
  location: string, // "lng,lat"
): Promise<ReverseGeoResult | null> {
  try {
    const [lng, lat] = location.split(",");
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`, // Google uses lat,lng order
      key: GOOGLE_KEY,
      language: "en",
    });
    const res = await fetch(`${BASE}/geocode/json?${params}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const result = data.results[0];
    const components = result.address_components || [];

    let city = "";
    let district = "";
    let province = "";

    for (const comp of components) {
      const types: string[] = comp.types || [];
      if (types.includes("locality")) city = comp.long_name;
      if (types.includes("sublocality") || types.includes("sublocality_level_1"))
        district = comp.long_name;
      if (types.includes("administrative_area_level_1"))
        province = comp.long_name;
    }

    return {
      city: city || province || "",
      district,
      province,
      formatted_address: result.formatted_address || "",
    };
  } catch (err) {
    console.error("Google reverse geocode error:", err);
    return null;
  }
}

// --------------- Geocode ---------------

// Haversine distance in km between two "lng,lat" strings
function distanceKm(loc1: string, loc2: string): number {
  const [lng1, lat1] = loc1.split(",").map(Number);
  const [lng2, lat2] = loc2.split(",").map(Number);
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocode(
  placeName: string,
  city?: string,
): Promise<GeoResult | null> {
  try {
    const address = city ? `${placeName}, ${city}` : placeName;
    const params = new URLSearchParams({
      address,
      key: GOOGLE_KEY,
      language: "en",
      // Bias results to Japan/Korea region
      region: "jp",
    });
    const res = await fetch(`${BASE}/geocode/json?${params}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const g = data.results[0];
    const loc = g.geometry.location;
    return {
      location: `${loc.lng},${loc.lat}`,
      formatted_address: g.formatted_address,
      name: g.formatted_address,
    };
  } catch (err) {
    console.error("Google geocode error:", err);
    return null;
  }
}

// --------------- Places Text Search ---------------

export async function searchPlace(
  keyword: string,
  city?: string,
): Promise<GeoResult | null> {
  try {
    const query = city ? `${keyword} in ${city}` : keyword;
    const params = new URLSearchParams({
      query,
      key: GOOGLE_KEY,
      language: "en",
    });
    const res = await fetch(`${BASE}/place/textsearch/json?${params}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const p = data.results[0];
    const loc = p.geometry.location;
    return {
      location: `${loc.lng},${loc.lat}`,
      formatted_address: p.formatted_address || p.name,
      name: p.name,
    };
  } catch (err) {
    console.error("Google searchPlace error:", err);
    return null;
  }
}

// --------------- Directions API helpers ---------------

// Decode Google's encoded polyline format to "lng,lat;lng,lat;..." format
function decodePolyline(encoded: string): string {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points.map(([ln, la]) => `${ln},${la}`).join(";");
}

// --------------- Transit Route ---------------

export async function getTransitRoute(
  origin: string,
  destination: string,
  _city?: string,
): Promise<TransitRoute | null> {
  try {
    const [oLng, oLat] = origin.split(",");
    const [dLng, dLat] = destination.split(",");

    const params = new URLSearchParams({
      origin: `${oLat},${oLng}`,
      destination: `${dLat},${dLng}`,
      mode: "transit",
      key: GOOGLE_KEY,
      language: "en",
      alternatives: "false",
    });
    const res = await fetch(`${BASE}/directions/json?${params}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.routes?.length) return null;

    const route = data.routes[0];
    const leg = route.legs[0];
    const segments: TransitSegment[] = [];
    let transferCount = 0;
    let totalWalkingDistance = 0;

    for (const step of leg.steps || []) {
      if (step.travel_mode === "WALKING") {
        const walkDist = step.distance?.value || 0;
        totalWalkingDistance += walkDist;
        segments.push({
          type: "walking",
          distance: walkDist,
          duration: Math.round((step.duration?.value || 0) / 60),
          polyline: step.polyline?.points
            ? decodePolyline(step.polyline.points)
            : undefined,
        });
      } else if (step.travel_mode === "TRANSIT") {
        const td = step.transit_details;
        if (td) {
          const lineName = td.line?.short_name || td.line?.name || "";
          const vehicleType = td.line?.vehicle?.type || "";
          // Format line name for metro/subway
          const isMetro =
            vehicleType === "SUBWAY" ||
            vehicleType === "METRO_RAIL" ||
            vehicleType === "HEAVY_RAIL";
          const displayName = isMetro ? `${lineName}` : lineName;

          segments.push({
            type: "transit",
            lineName: displayName,
            departureStop: td.departure_stop?.name || "",
            arrivalStop: td.arrival_stop?.name || "",
            stopCount: td.num_stops || 1,
            direction: td.headsign || "",
            polyline: step.polyline?.points
              ? decodePolyline(step.polyline.points)
              : undefined,
          });

          if (segments.filter((s) => s.type === "transit").length > 1) {
            transferCount++;
          }
        }
      }
    }

    // Estimate cost for Japan/Korea transit
    const fare = leg.fare;
    const cost = fare
      ? `${fare.text}`
      : "Check local fare";

    return {
      totalDuration: Math.round((leg.duration?.value || 0) / 60),
      totalWalkingDistance,
      transferCount,
      segments,
      cost,
    };
  } catch (err) {
    console.error("Google transit directions error:", err);
    return null;
  }
}

// --------------- Walking Route ---------------

export async function getWalkingRoute(
  origin: string,
  destination: string,
): Promise<WalkingRoute | null> {
  try {
    const [oLng, oLat] = origin.split(",");
    const [dLng, dLat] = destination.split(",");

    const params = new URLSearchParams({
      origin: `${oLat},${oLng}`,
      destination: `${dLat},${dLng}`,
      mode: "walking",
      key: GOOGLE_KEY,
      language: "en",
    });
    const res = await fetch(`${BASE}/directions/json?${params}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.routes?.length) return null;

    const leg = data.routes[0].legs[0];
    const polyline = data.routes[0].overview_polyline?.points
      ? decodePolyline(data.routes[0].overview_polyline.points)
      : undefined;

    return {
      distance: leg.distance?.value || 0,
      duration: Math.round((leg.duration?.value || 0) / 60),
      polyline,
    };
  } catch (err) {
    console.error("Google walking directions error:", err);
    return null;
  }
}

// --------------- Nearby POI Search ---------------

export type POIResult = {
  name: string;
  address: string;
  location: string;
  distance: number;
  type: string;
  rating: string;
  tel: string;
  openingHours: string;
  cost: string;
  // AI-enriched fields (populated after initial render)
  englishName?: string;
  description?: string;
};

// Haversine distance in meters between two points
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGooglePlaceResults(results: any[], centerLng: number, centerLat: number): POIResult[] {
  return results.slice(0, 10).map((p: Record<string, any>) => {
    const loc = p.geometry?.location;
    const lng = loc?.lng || 0;
    const lat = loc?.lat || 0;
    const dist = distanceMeters(centerLat, centerLng, lat, lng);

    return {
      name: (p.name as string) || "",
      address: (p.vicinity as string) || (p.formatted_address as string) || "",
      location: `${lng},${lat}`,
      distance: Math.round(dist),
      type: ((p.types as string[]) || []).join(";"),
      rating: p.rating ? String(p.rating) : "",
      tel: "",
      openingHours: p.opening_hours?.open_now != null
        ? (p.opening_hours.open_now ? "Open now" : "Closed")
        : "",
      cost: p.price_level != null
        ? ["Budget", "Moderate", "Pricey", "Luxury"][Math.min(p.price_level, 3)] || ""
        : "",
    };
  });
}

export async function searchNearbyRestaurants(
  location: string,
  keyword?: string,
  radius = 1000,
): Promise<POIResult[]> {
  try {
    const [lng, lat] = location.split(",");
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      type: "restaurant",
      key: GOOGLE_KEY,
      language: "en",
    });
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(
      `${BASE}/place/nearbysearch/json?${params}`,
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return [];
    return parseGooglePlaceResults(data.results, Number(lng), Number(lat));
  } catch (err) {
    console.error("Google restaurant search error:", err);
    return [];
  }
}

export async function searchNearbyAttractions(
  location: string,
  keyword?: string,
  radius = 1000,
): Promise<POIResult[]> {
  try {
    const [lng, lat] = location.split(",");
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      type: "tourist_attraction",
      key: GOOGLE_KEY,
      language: "en",
    });
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(
      `${BASE}/place/nearbysearch/json?${params}`,
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return [];
    return parseGooglePlaceResults(data.results, Number(lng), Number(lat));
  } catch (err) {
    console.error("Google attraction search error:", err);
    return [];
  }
}

export async function searchNearbyPOI(
  location: string,
  keyword: string,
  types?: string,
  radius = 1000,
): Promise<POIResult[]> {
  try {
    const [lng, lat] = location.split(",");
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      keyword,
      key: GOOGLE_KEY,
      language: "en",
    });
    if (types) params.set("type", types);

    const res = await fetch(
      `${BASE}/place/nearbysearch/json?${params}`,
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return [];
    return parseGooglePlaceResults(data.results, Number(lng), Number(lat));
  } catch (err) {
    console.error("Google POI search error:", err);
    return [];
  }
}

// --------------- Resolve place name → coordinates ---------------

// City center coordinates for distance validation
const CITY_CENTERS: Record<string, string> = {
  "Tokyo": "139.6917,35.6895",
  "東京": "139.6917,35.6895",
  "Osaka": "135.5023,34.6937",
  "大阪": "135.5023,34.6937",
  "Kyoto": "135.7681,35.0116",
  "京都": "135.7681,35.0116",
  "Seoul": "126.9780,37.5665",
  "서울": "126.9780,37.5665",
  "Busan": "129.0756,35.1796",
  "부산": "129.0756,35.1796",
  "Nagoya": "136.9066,35.1815",
  "名古屋": "136.9066,35.1815",
  "Fukuoka": "130.4017,33.5904",
  "福岡": "130.4017,33.5904",
  "Sapporo": "141.3469,43.0621",
  "札幌": "141.3469,43.0621",
  "Yokohama": "139.6380,35.4437",
  "横浜": "139.6380,35.4437",
  "Hiroshima": "132.4596,34.3853",
  "広島": "132.4596,34.3853",
  "Incheon": "126.7052,37.4563",
  "인천": "126.7052,37.4563",
  "Jeju": "126.5312,33.4996",
  "제주": "126.5312,33.4996",
};

const MAX_LOCAL_DISTANCE_KM = 200;

export async function resolveLocation(
  englishName: string,
  localName?: string,
  city?: string,
  referenceLocation?: string,
): Promise<GeoResult | null> {
  // For LOCAL searches (city specified), validate that results are nearby
  const isLocal = !!city;
  const refPoint = referenceLocation || (city && CITY_CENTERS[city]) || undefined;

  function isValidResult(result: GeoResult): boolean {
    if (!isLocal || !refPoint || !result.location) return true;
    const dist = distanceKm(result.location, refPoint);
    return dist <= MAX_LOCAL_DISTANCE_KM;
  }

  // 1. Text search with local name (Japanese/Korean) if provided
  if (localName) {
    const poi = await searchPlace(localName, city);
    if (poi && isValidResult(poi)) return poi;
  }

  // 2. Geocode with local name
  if (localName) {
    const geo = await geocode(localName, city);
    if (geo && isValidResult(geo)) return geo;
  }

  // 3. Text search with English name
  const poiEn = await searchPlace(englishName, city);
  if (poiEn && isValidResult(poiEn)) return poiEn;

  // 4. Geocode with English name
  const geoEn = await geocode(englishName, city);
  if (geoEn && isValidResult(geoEn)) return geoEn;

  // 5. All failed
  return null;
}

export async function resolvePlace(
  placeName: string,
  city?: string,
): Promise<GeoResult | null> {
  return resolveLocation(placeName, undefined, city);
}
