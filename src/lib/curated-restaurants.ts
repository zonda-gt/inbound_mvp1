import { getSupabaseServerClient } from "@/lib/supabase";

// Lightweight summary sent to Claude for decision-making (~5KB for 8 restaurants)
export type CuratedRestaurantSummary = {
  slug: string;
  name_en: string;
  name_cn: string;
  cuisine: string;
  price_per_person: number;
  rating: number;
  foreigner_hook: string;
  english_description: string;
  best_for: string[];
  latitude: number;
  longitude: number;
  hero_image_url: string | null;
};

// Full profile used by frontend cards
export type CuratedRestaurant = {
  id: string;
  slug: string;
  name_cn: string;
  name_en: string;
  address: string;
  phone: string;
  cuisine: string;
  price_per_person: number;
  rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  foreigner_hook: string;
  english_description: string;
  vibe: string;
  best_for: string[];
  value_for_money: string | null;
  signature_dishes: Array<{
    english_name: string;
    chinese_name: string;
    description: string;
    foreigner_rating: string;
    notes: string;
  }>;
  ordering_guide: {
    how_to_order: string;
    for_2_people: { suggested_order: string; estimated_spend_rmb: string; notes: string };
    for_4_people: { suggested_order: string; estimated_spend_rmb: string; notes: string };
  };
  common_complaints: Array<{ complaint: string; practical_note: string }>;
  practical_tips: string[];
  concierge_opportunities: string | null;
  dining_style_note: string;
  spice_and_dietary_notes: Record<string, string>;
  images: Array<{ url: string; is_hero: boolean; category: string }>;
  created_at: string;
};

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CITY_ADDRESS_ALIASES: Record<string, string[]> = {
  上海: ["上海", "上海市", "shanghai"],
  北京: ["北京", "北京市", "beijing"],
  广州: ["广州", "广州市", "guangzhou", "canton"],
  深圳: ["深圳", "深圳市", "shenzhen"],
  成都: ["成都", "成都市", "chengdu"],
  杭州: ["杭州", "杭州市", "hangzhou"],
  重庆: ["重庆", "重庆市", "chongqing"],
  天津: ["天津", "天津市", "tianjin"],
  西安: ["西安", "西安市", "xian", "xi'an"],
  苏州: ["苏州", "苏州市", "suzhou"],
  南京: ["南京", "南京市", "nanjing"],
  武汉: ["武汉", "武汉市", "wuhan"],
};

function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/市$/u, "")
    .replace(/\bcity\b/g, "")
    .replace(/['’\s_-]/g, "")
    .trim();
}

function resolveCityAddressTokens(city: string): string[] {
  const normalized = normalizeCity(city);
  const entry = Object.entries(CITY_ADDRESS_ALIASES).find(([cn, aliases]) => {
    if (normalizeCity(cn) === normalized) return true;
    return aliases.some((alias) => normalizeCity(alias) === normalized);
  });

  if (!entry) {
    return [city.toLowerCase()];
  }

  const [cn, aliases] = entry;
  return Array.from(new Set([cn, `${cn}市`, ...aliases].map((token) => token.toLowerCase())));
}

function addressMatchesCity(address: string | null | undefined, city: string): boolean {
  if (!address) return false;
  const loweredAddress = address.toLowerCase();
  const tokens = resolveCityAddressTokens(city);
  return tokens.some((token) => loweredAddress.includes(token));
}

export async function searchCuratedRestaurants(filters: {
  cuisine?: string;
  max_price?: number;
  best_for?: string;
  near_lat?: number;
  near_lng?: number;
  max_distance_km?: number;
  query?: string;
  city?: string;
}): Promise<CuratedRestaurant[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn("[CuratedRestaurants] Supabase not configured");
    return [];
  }

  let q = supabase.from("restaurants").select("*");

  if (filters.cuisine) {
    q = q.ilike("cuisine", `%${filters.cuisine}%`);
  }

  if (filters.max_price) {
    q = q.lte("price_per_person", filters.max_price);
  }

  if (filters.best_for) {
    q = q.contains("best_for", [filters.best_for]);
  }

  if (filters.query) {
    const normalized = filters.query.trim().replace(/\s+/g, "%");
    const term = `%${normalized}%`;
    const clauses = [
      `name_en.ilike.${term}`,
      `name_cn.ilike.${term}`,
      `cuisine.ilike.${term}`,
      `foreigner_hook.ilike.${term}`,
      `english_description.ilike.${term}`,
    ];

    // Chinese queries often omit middle characters; allow loose matching like 卿庭%火锅
    if (/[\u4e00-\u9fff]/.test(filters.query)) {
      const compact = filters.query.replace(/\s+/g, "");
      if (compact.length >= 2) {
        const fuzzyCjk = `%${compact.split("").join("%")}%`;
        clauses.push(`name_cn.ilike.${fuzzyCjk}`);
      }
    }

    q = q.or(clauses.join(","));
  }

  // Default sort by rating
  q = q.order("rating", { ascending: false });

  const { data, error } = await q;

  if (error) {
    console.error("[CuratedRestaurants] Query error:", error);
    return [];
  }

  let results = (data || []) as CuratedRestaurant[];

  const cityFilter = filters.city;
  if (cityFilter) {
    results = results.filter((r) => addressMatchesCity(r.address, cityFilter));
  }

  // Proximity filter + sort if coordinates provided
  if (filters.near_lat != null && filters.near_lng != null) {
    const maxDistanceKm = filters.max_distance_km ?? 5;
    results = results
      .map((r) => ({
        restaurant: r,
        distance: haversineDistance(
          filters.near_lat!,
          filters.near_lng!,
          r.latitude,
          r.longitude,
        ),
      }))
      .filter((r) => r.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .map((r) => r.restaurant);
  }

  return results;
}

/** Convert a full restaurant to a lightweight summary for Claude */
export function toSummary(r: CuratedRestaurant): CuratedRestaurantSummary {
  const heroImage = r.images?.find((img) => img.is_hero);
  return {
    slug: r.slug,
    name_en: r.name_en,
    name_cn: r.name_cn,
    cuisine: r.cuisine,
    price_per_person: r.price_per_person,
    rating: r.rating,
    foreigner_hook: r.foreigner_hook,
    english_description: r.english_description,
    best_for: r.best_for,
    latitude: r.latitude,
    longitude: r.longitude,
    hero_image_url: heroImage?.url || null,
  };
}

/** Fetch full restaurant profiles by slugs (for frontend card rendering) */
export async function getCuratedRestaurantsBySlugs(
  slugs: string[],
): Promise<CuratedRestaurant[]> {
  if (slugs.length === 0) return [];

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn("[CuratedRestaurants] Supabase not configured");
    return [];
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .in("slug", slugs);

  if (error) {
    console.error("[CuratedRestaurants] Fetch by slugs error:", error);
    return [];
  }

  return (data || []) as CuratedRestaurant[];
}
