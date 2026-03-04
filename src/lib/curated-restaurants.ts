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

// Full profile used by frontend cards (restaurants_v2 table shape)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CuratedRestaurant = {
  slug: string;
  name_cn: string;
  name_en: string;
  latitude: number;
  longitude: number;
  address_cn?: string;
  address?: string;
  city?: string;
  foreigner_hook?: string;
  cuisine?: string;
  images: string[]; // string[] of URLs in v2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any; // nested JSON — layer1_card, layer2_detail, internal
};

// Shape returned by the hybrid search RPC (old restaurants table)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CuratedRestaurantHybridResult = {
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
  images: any[];
  similarity: number;
  [key: string]: any; // allow extra columns from old table
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

const CITY_NAME_MAP: Record<string, string> = {
  上海: "shanghai",
  北京: "beijing",
  广州: "guangzhou",
  深圳: "shenzhen",
  成都: "chengdu",
  杭州: "hangzhou",
  重庆: "chongqing",
  天津: "tianjin",
  西安: "xian",
  苏州: "suzhou",
  南京: "nanjing",
  武汉: "wuhan",
};

/** Normalize any city input (Chinese or English) to the lowercase English key used in the DB */
function normalizeCityKey(city: string): string {
  const trimmed = city.trim().replace(/市$/u, "");
  if (CITY_NAME_MAP[trimmed]) return CITY_NAME_MAP[trimmed];
  const lower = trimmed.toLowerCase().replace(/\bcity\b/g, "").replace(/['\s_-]/g, "");
  for (const eng of Object.values(CITY_NAME_MAP)) {
    if (eng === lower) return eng;
  }
  return lower;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchCuratedRestaurants(filters: {
  cuisine?: string;
  max_price?: number;
  best_for?: string;
  near_lat?: number;
  near_lng?: number;
  max_distance_km?: number;
  query?: string;
  city?: string;
}): Promise<any[]> {
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

  if (filters.city) {
    const normalizedCity = normalizeCityKey(filters.city);
    q = q.eq("city", normalizedCity);
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

  let results = (data || []) as any[];

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

function toVectorLiteral(values: number[]): string {
  const normalized = values.filter((value) => Number.isFinite(value));
  return `[${normalized.join(",")}]`;
}

export async function searchCuratedRestaurantsHybrid(filters: {
  query_embedding: number[];
  filter_category?: "restaurant" | "bar" | null;
  max_price?: number;
  user_lat?: number;
  user_lng?: number;
  max_distance_km?: number;
  match_limit?: number;
  similarity_threshold?: number;
  city?: string;
}): Promise<{ results: CuratedRestaurantHybridResult[]; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn("[CuratedHybrid] Supabase not configured");
    return { results: [], error: "Curated database is not configured." };
  }

  const queryVector = toVectorLiteral(filters.query_embedding);
  if (queryVector === "[]") {
    return { results: [], error: "Query embedding is empty." };
  }

  const { data, error } = await supabase.rpc("search_restaurants_hybrid", {
    query_embedding: queryVector,
    filter_category: filters.filter_category ?? null,
    max_price: filters.max_price ?? null,
    user_lat: filters.user_lat ?? null,
    user_lng: filters.user_lng ?? null,
    max_distance_km: filters.max_distance_km ?? 50,
    match_limit: filters.match_limit ?? 3,
    similarity_threshold: filters.similarity_threshold ?? 0.3,
  });

  if (error) {
    console.error("[CuratedHybrid] RPC error:", error);
    return {
      results: [],
      error:
        "Curated semantic search failed. Falling back to Amap listings is recommended.",
    };
  }

  let results = (data || []) as CuratedRestaurantHybridResult[];

  // Post-filter by city column
  if (filters.city && results.length > 0) {
    const normalizedCity = normalizeCityKey(filters.city);
    const slugs = results.map((r) => r.slug).filter(Boolean);
    if (slugs.length > 0) {
      const { data: cityRows, error: cityError } = await supabase
        .from("restaurants")
        .select("slug,city")
        .in("slug", slugs)
        .eq("city", normalizedCity);

      if (cityError) {
        console.error("[CuratedHybrid] City post-filter error:", cityError);
      } else {
        const allowedSlugs = new Set(
          (cityRows || []).map((row) => (row as { slug: string }).slug),
        );
        results = results.filter((row) => allowedSlugs.has(row.slug));
      }
    }
  }

  return { results };
}

/** Convert a hybrid search result (old table) to a lightweight summary for Claude */
export function toSummary(r: CuratedRestaurantHybridResult): CuratedRestaurantSummary {
  const heroImage = Array.isArray(r.images) ? r.images.find((img: any) => img?.is_hero) : null;
  return {
    slug: r.slug,
    name_en: r.name_en,
    name_cn: r.name_cn,
    cuisine: r.cuisine,
    price_per_person: r.price_per_person,
    rating: r.rating,
    foreigner_hook: r.foreigner_hook,
    english_description: r.english_description,
    best_for: r.best_for || [],
    latitude: r.latitude,
    longitude: r.longitude,
    hero_image_url: heroImage?.url || null,
  };
}

/** Fetch a single restaurant from restaurants_v2 by slug */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRestaurantBySlug(slug: string): Promise<any | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("restaurants_v2")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // Return all columns as-is — the component handles any shape
  return { ...data, images: data.images || [] };
}

/** Get all restaurant slugs from restaurants_v2 */
export async function getAllRestaurantSlugsWithProfile(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("restaurants_v2")
    .select("slug");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

/** Fetch featured restaurants from restaurants_v2 for discover screen cards */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFeaturedRestaurants(limit = 8): Promise<any[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("restaurants_v2")
    .select("slug, name_en, name_cn, images, profile")
    .not("profile", "is", null)
    .limit(limit);

  if (error || !data) return [];

  return data.map((r) => {
    const card = r.profile?.layer1_card || {};
    const identity = card.identity || {};
    const price = card.price || {};
    const tags = card.tags || {};
    const imgs = r.images || [];
    return {
      slug: r.slug,
      name_en: r.name_en,
      name_cn: r.name_cn,
      cuisine: identity.cuisine_type || "",
      price_cny: price.price_per_person_cny || null,
      rating: tags.rating_adjusted || tags.rating || null,
      verdict: (card.verdict || "").slice(0, 80),
      image: imgs[0] || null,
    };
  });
}

/** Fetch full restaurant profiles by slugs — tries restaurants_v2 first, falls back to old restaurants table */
export async function getCuratedRestaurantsBySlugs(
  slugs: string[],
): Promise<CuratedRestaurant[]> {
  if (slugs.length === 0) return [];

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn("[CuratedRestaurants] Supabase not configured");
    return [];
  }

  // 1. Try restaurants_v2 (rich profile data)
  const { data: v2Data, error: v2Error } = await supabase
    .from("restaurants_v2")
    .select("slug, name_en, name_cn, latitude, longitude, address_cn, address, city, foreigner_hook, cuisine, images, profile")
    .in("slug", slugs);

  if (v2Error) {
    console.error("[CuratedRestaurants] v2 fetch error:", v2Error);
  }

  const v2Results = (v2Data || []).map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    profile: row.profile || {},
  })) as CuratedRestaurant[];

  const foundSlugs = new Set(v2Results.map((r) => r.slug));
  const missingSlugs = slugs.filter((s) => !foundSlugs.has(s));
  console.log("[CuratedRestaurants] v2 found:", [...foundSlugs], "| missing (fallback to old):", missingSlugs);

  // 2. Fall back to old restaurants table for any slugs not in v2
  if (missingSlugs.length > 0) {
    const { data: oldData, error: oldError } = await supabase
      .from("restaurants")
      .select("*")
      .in("slug", missingSlugs);

    if (oldError) {
      console.error("[CuratedRestaurants] old table fallback error:", oldError);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldResults = (oldData || []).map((row: any) => {
      // Adapt old flat columns into v2 CuratedRestaurant shape
      const imgs = Array.isArray(row.images)
        ? row.images.map((img: any) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
        : [];
      return {
        slug: row.slug,
        name_en: row.name_en,
        name_cn: row.name_cn,
        latitude: row.latitude,
        longitude: row.longitude,
        address_cn: row.address_cn,
        address: row.address,
        city: row.city,
        foreigner_hook: row.foreigner_hook,
        cuisine: row.cuisine,
        images: imgs,
        profile: {
          layer1_card: {
            hook: row.foreigner_hook || "",
            identity: { cuisine_type: row.cuisine || "" },
            price: { price_per_person_cny: row.price_per_person },
            tags: { rating: row.rating, best_for: row.best_for || [] },
          },
          layer2_detail: {
            what_to_order: {
              top_dishes: Array.isArray(row.signature_dishes)
                ? row.signature_dishes.map((d: any) => ({
                    dish_name_en: d.english_name || d.name,
                    description: d.notes || "",
                    comfort_level: d.foreigner_rating === "green" ? 5 : d.foreigner_rating === "yellow" ? 3 : 1,
                  }))
                : [],
            },
            how_to_order: {
              steps: row.ordering_guide?.for_2_people ? [row.ordering_guide.for_2_people] : [],
              what_visitors_get_wrong: row.common_complaints || [],
            },
            practical: {
              payment: Array.isArray(row.practical_tips) ? row.practical_tips.join(". ") : "",
            },
          },
        },
      } as CuratedRestaurant;
    });

    v2Results.push(...oldResults);
  }

  // Preserve original slug order
  const bySlug = new Map(v2Results.map((r) => [r.slug, r]));
  return slugs.map((s) => bySlug.get(s)).filter((r): r is CuratedRestaurant => r != null);
}
