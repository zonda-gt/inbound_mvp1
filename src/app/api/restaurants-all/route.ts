import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type Category = "chinese" | "asian" | "middle_eastern" | "western" | "bars";

const CHINESE_KEYWORDS = [
  "shanghainese", "shanghai", "benbang", "sichuan", "szechuan", "chongqing",
  "cantonese", "dim sum", "yunnan", "hunan", "guizhou", "xinjiang", "uyghur",
  "ningxia", "halal", "muslim", "noodle", "hot pot", "hotpot", "buddhist",
  "vegetarian", "vegan", "chinese", "dongbei", "northeastern",
  "zhejiang", "fujian", "anhui", "jiangsu", "shandong",
];

const ASIAN_KEYWORDS = [
  "japanese", "sushi", "ramen", "omakase", "kappo", "izakaya",
  "korean", "bbq", "bulgogi", "bibimbap",
  "thai", "vietnamese", "pho", "se asian", "southeast asian",
  "indian", "curry",
];

const MIDDLE_EASTERN_KEYWORDS = [
  "lebanese", "turkish", "mediterranean", "middle eastern", "persian",
  "arabic", "falafel", "kebab", "shisha", "hookah", "russian",
];

const WESTERN_KEYWORDS = [
  "american", "steakhouse", "steak", "cajun", "tex-mex",
  "french", "italian", "spanish", "tapas", "european", "continental",
  "brazilian", "churrascaria", "mexican", "tequila", "mezcal",
  "bistro", "fusion",
];

const BAR_KEYWORDS = [
  "bar", "cocktail", "lounge", "speakeasy", "whisky", "whiskey",
  "wine bar", "pub",
];

function assignCategory(cuisineType: string, venueType: string, cuisineRaw: string): Category {
  const text = `${cuisineType} ${venueType} ${cuisineRaw}`.toLowerCase();

  // Check bars first — venue_type is the strongest signal
  if (BAR_KEYWORDS.some((k) => text.includes(k)) && venueType.toLowerCase().includes("bar")) {
    return "bars";
  }

  // Check specific categories by cuisine keywords
  if (MIDDLE_EASTERN_KEYWORDS.some((k) => text.includes(k))) return "middle_eastern";
  if (WESTERN_KEYWORDS.some((k) => text.includes(k))) return "western";
  if (ASIAN_KEYWORDS.some((k) => text.includes(k))) return "asian";
  if (CHINESE_KEYWORDS.some((k) => text.includes(k))) return "chinese";

  // Bar fallback (if venue_type wasn't "bar" but keywords match)
  if (BAR_KEYWORDS.some((k) => text.includes(k))) return "bars";

  // Default to chinese for Shanghai restaurants
  return "chinese";
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("restaurants_v2")
      .select("slug, name_en, name_cn, images, profile, latitude, longitude")
      .not("profile", "is", null);

    if (error) {
      console.error("[Restaurants All] Query error:", error);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }

    const restaurants = (data || []).map((r) => {
      const card = r.profile?.layer1_card || {};
      const identity = card.identity || {};
      const price = card.price || {};
      const tags = card.tags || {};
      const vibe = card.vibe || {};
      const imgs = r.images || [];

      const cuisineType = identity.cuisine_type || "";
      const cuisineSubtype = identity.cuisine_subtype || "";
      const venueType = identity.venue_type || "";
      const bestFor: string[] = tags.best_for || [];

      return {
        slug: r.slug,
        name_en: r.name_en || identity.name_en || "",
        name_cn: r.name_cn || identity.name_cn || "",
        cuisine_type: cuisineType,
        cuisine_subtype: cuisineSubtype,
        cuisine_label: cuisineSubtype || cuisineType || "",
        venue_type: venueType,
        price_cny: price.price_per_person_cny || null,
        price_tier: price.price_tier || "",
        rating: tags.rating_adjusted || tags.rating || null,
        verdict: (card.verdict || "").slice(0, 100),
        hook: (card.hook || card.verdict || "").slice(0, 120),
        image: imgs[0] || null,
        images: imgs,
        best_for: bestFor,
        vibe_tags: vibe.captions || vibe.tags || [],
        solo_friendly: tags.solo_friendly || false,
        category: assignCategory(cuisineType, venueType, cuisineSubtype || cuisineType || ""),
        lat: r.latitude ?? null,
        lng: r.longitude ?? null,
      };
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("[Restaurants All] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
