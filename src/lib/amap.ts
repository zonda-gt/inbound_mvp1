const AMAP_KEY = process.env.AMAP_API_KEY || "";
const BASE = "https://restapi.amap.com/v3";

export type GeoResult = {
  location: string; // "lng,lat"
  formatted_address: string;
  name: string;
};

export type TransitSegment =
  | { type: "walking"; distance: number; duration: number }
  | {
      type: "transit";
      lineName: string;
      departureStop: string;
      arrivalStop: string;
      stopCount: number;
      direction: string;
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
};

// --------------- Geocode ---------------

export async function geocode(
  placeName: string,
  city = "上海",
): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      address: placeName,
      city,
      key: AMAP_KEY,
      output: "JSON",
    });
    const res = await fetch(`${BASE}/geocode/geo?${params}`);
    const data = await res.json();

    if (data.status !== "1" || !data.geocodes?.length) return null;

    const g = data.geocodes[0];
    return {
      location: g.location,
      formatted_address: g.formatted_address,
      name: g.formatted_address,
    };
  } catch (err) {
    console.error("Amap geocode error:", err);
    return null;
  }
}

// --------------- POI Search ---------------

export async function searchPlace(
  keyword: string,
  city = "上海",
): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      keywords: keyword,
      city,
      key: AMAP_KEY,
      extensions: "all",
      output: "JSON",
    });
    const res = await fetch(`${BASE}/place/text?${params}`);
    const data = await res.json();

    if (data.status !== "1" || !data.pois?.length) return null;

    const p = data.pois[0];
    return {
      location: p.location,
      formatted_address: p.address || p.name,
      name: p.name,
    };
  } catch (err) {
    console.error("Amap searchPlace error:", err);
    return null;
  }
}

// --------------- Transit Route ---------------

export async function getTransitRoute(
  origin: string,
  destination: string,
  city = "上海",
): Promise<TransitRoute | null> {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      city,
      key: AMAP_KEY,
      strategy: "0",
      output: "JSON",
    });
    const res = await fetch(`${BASE}/direction/transit/integrated?${params}`);
    const data = await res.json();

    if (
      data.status !== "1" ||
      !data.route?.transits?.length
    )
      return null;

    const transit = data.route.transits[0];
    const segments: TransitSegment[] = [];
    let transferCount = 0;

    for (const seg of transit.segments || []) {
      // Walking part
      if (seg.walking && Number(seg.walking.distance) > 0) {
        segments.push({
          type: "walking",
          distance: Number(seg.walking.distance),
          duration: Math.round(Number(seg.walking.duration) / 60),
        });
      }
      // Bus / metro part
      if (seg.bus?.buslines?.length) {
        const line = seg.bus.buslines[0];
        segments.push({
          type: "transit",
          lineName: line.name || "",
          departureStop: line.departure_stop?.name || "",
          arrivalStop: line.arrival_stop?.name || "",
          stopCount: Number(line.via_num || 0) + 1,
          direction: line.direction || "",
        });
        if (segments.filter((s) => s.type === "transit").length > 1) {
          transferCount++;
        }
      }
    }

    return {
      totalDuration: Math.round(Number(transit.duration) / 60),
      totalWalkingDistance: Number(transit.walking_distance || 0),
      transferCount,
      segments,
      cost: transit.cost ? `¥${Math.ceil(Number(transit.cost))}` : "¥3-5",
    };
  } catch (err) {
    console.error("Amap transit error:", err);
    return null;
  }
}

// --------------- Walking Route ---------------

export async function getWalkingRoute(
  origin: string,
  destination: string,
): Promise<WalkingRoute | null> {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      key: AMAP_KEY,
      output: "JSON",
    });
    const res = await fetch(`${BASE}/direction/walking?${params}`);
    const data = await res.json();

    if (data.status !== "1" || !data.route?.paths?.length) return null;

    const path = data.route.paths[0];
    return {
      distance: Number(path.distance),
      duration: Math.round(Number(path.duration) / 60),
    };
  } catch (err) {
    console.error("Amap walking error:", err);
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePOIResults(pois: any[]): POIResult[] {
  return pois.map((p: Record<string, any>) => ({
    name: (p.name as string) || "",
    address: (p.address as string) || "",
    location: (p.location as string) || "",
    distance: Number(p.distance || 0),
    type: (p.type as string) || "",
    rating: ((p.biz_ext as Record<string, unknown>)?.rating as string) || "",
    tel: (p.tel as string) || "",
    openingHours:
      ((p.biz_ext as Record<string, unknown>)?.open_time as string) || "",
    cost: ((p.biz_ext as Record<string, unknown>)?.cost as string) || "",
  }));
}

export async function searchNearbyRestaurants(
  location: string,
  keyword?: string,
  radius = 1000,
): Promise<POIResult[]> {
  try {
    const params: Record<string, string> = {
      location,
      types: "050000",
      radius: String(radius),
      sortrule: "weight",
      extensions: "all",
      offset: "10",
      key: AMAP_KEY,
      output: "JSON",
    };
    if (keyword) params.keywords = keyword;

    const res = await fetch(
      `${BASE}/place/around?${new URLSearchParams(params)}`,
    );
    const data = await res.json();
    if (data.status !== "1" || !data.pois?.length) return [];
    return parsePOIResults(data.pois);
  } catch (err) {
    console.error("Amap restaurant search error:", err);
    return [];
  }
}

export async function searchNearbyAttractions(
  location: string,
  keyword?: string,
  radius = 1000,
): Promise<POIResult[]> {
  try {
    const params: Record<string, string> = {
      location,
      types: "110000",
      radius: String(radius),
      sortrule: "weight",
      extensions: "all",
      offset: "10",
      key: AMAP_KEY,
      output: "JSON",
    };
    if (keyword) params.keywords = keyword;

    const res = await fetch(
      `${BASE}/place/around?${new URLSearchParams(params)}`,
    );
    const data = await res.json();
    if (data.status !== "1" || !data.pois?.length) return [];
    return parsePOIResults(data.pois);
  } catch (err) {
    console.error("Amap attraction search error:", err);
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
    const params: Record<string, string> = {
      location,
      keywords: keyword,
      radius: String(radius),
      sortrule: "weight",
      extensions: "all",
      offset: "10",
      key: AMAP_KEY,
      output: "JSON",
    };
    if (types) params.types = types;

    const res = await fetch(
      `${BASE}/place/around?${new URLSearchParams(params)}`,
    );
    const data = await res.json();
    if (data.status !== "1" || !data.pois?.length) return [];
    return parsePOIResults(data.pois);
  } catch (err) {
    console.error("Amap POI search error:", err);
    return [];
  }
}

// --------------- Resolve place name → coordinates ---------------

export async function resolveLocation(
  englishName: string,
  chineseName?: string,
  city = "上海",
): Promise<GeoResult | null> {
  // 1. Geocode with Chinese name
  if (chineseName) {
    const geo = await geocode(chineseName, city);
    if (geo) return geo;
  }

  // 2. POI text search with Chinese name
  if (chineseName) {
    const poi = await searchPlace(chineseName, city);
    if (poi) return poi;
  }

  // 3. POI text search with English name
  const poiEn = await searchPlace(englishName, city);
  if (poiEn) return poiEn;

  // 4. Geocode with English name
  const geoEn = await geocode(englishName, city);
  if (geoEn) return geoEn;

  // 5. All failed
  return null;
}

export async function resolvePlace(
  placeName: string,
  city = "上海",
): Promise<GeoResult | null> {
  return resolveLocation(placeName, undefined, city);
}
