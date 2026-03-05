import { getSupabaseServerClient } from "./supabase";
import type { AttractionData } from "@/types/attraction";

export async function getAllAttractionSlugs(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("attractions")
    .select("slug");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

const STORAGE_BASE = "https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/attraction-images";

/** List all image URLs from Supabase Storage for a given attraction slug */
async function listStorageImages(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  slug: string,
): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data: files, error } = await supabase.storage
      .from("attraction-images")
      .list(slug, { limit: 200, sortBy: { column: "name", order: "asc" } });

    if (error || !files) return [];

    return files
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f.name))
      .map((f) => `${STORAGE_BASE}/${slug}/${f.name}`);
  } catch {
    return [];
  }
}

export async function getAttractionBySlug(
  slug: string,
): Promise<AttractionData | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const [dbResult, storageImages] = await Promise.all([
    supabase
      .from("attractions")
      .select("slug, profile, images")
      .eq("slug", slug)
      .single(),
    listStorageImages(supabase, slug),
  ]);

  const { data, error } = dbResult;
  if (error || !data) return null;

  const profile = data.profile as Omit<AttractionData, "slug" | "images">;
  if (!profile.attraction_name_en || !profile.attraction_name_cn) return null;

  // DB images array is the ordered source of truth (set via admin).
  // Fall back to alphabetical storage listing only if DB array is empty.
  const images = (data.images && data.images.length > 0) ? data.images : storageImages;

  return { ...profile, slug: data.slug, images };
}

export async function getAllAttractions(): Promise<
  Array<{
    slug: string;
    name_en: string;
    name_cn: string;
    hook: string;
    experience_type: string;
    images: string[];
    category: string | null;
  }>
> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("attractions")
    .select("slug, name_en, name_cn, profile, images, category")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn,
    hook: (row.profile as Record<string, unknown>)?.hook as string || "",
    experience_type: (row.profile as Record<string, unknown>)?.experience_type as string || "",
    images: row.images || [],
    category: row.category,
  }));
}

export async function getAttractionsBySlugs(
  slugs: string[],
): Promise<AttractionData[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase || slugs.length === 0) return [];

  const { data, error } = await supabase
    .from("attractions")
    .select("slug, profile, images")
    .in("slug", slugs);

  if (error || !data) return [];

  // Build a map for ordering by the original slugs array
  const map = new Map<string, AttractionData>();
  for (const row of data) {
    const profile = row.profile as Omit<AttractionData, "slug" | "images">;
    if (profile.attraction_name_en && profile.attraction_name_cn) {
      map.set(row.slug, { ...profile, slug: row.slug, images: row.images || [] });
    }
  }

  // Return in the order of the input slugs
  return slugs.filter((s) => map.has(s)).map((s) => map.get(s)!);
}

export type AttractionSummary = {
  slug: string;
  name_en: string;
  name_cn: string;
  hook: string;
  experience_type: string;
  image: string | null;
};

export async function searchCuratedAttractions(query?: string): Promise<{
  summaries: AttractionSummary[];
  slugs: string[];
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { summaries: [], slugs: [] };

  let builder = supabase
    .from("attractions")
    .select("slug, name_en, name_cn, profile, images")
    .order("created_at", { ascending: false })
    .limit(6);

  if (query) {
    builder = builder.or(
      `name_en.ilike.%${query}%,name_cn.ilike.%${query}%,category.ilike.%${query}%`,
    );
  }

  const { data, error } = await builder;
  if (error || !data || data.length === 0) {
    // Fallback: return all attractions if query didn't match
    if (query) {
      const { data: allData } = await supabase
        .from("attractions")
        .select("slug, name_en, name_cn, profile, images")
        .order("created_at", { ascending: false })
        .limit(6);
      if (allData && allData.length > 0) {
        return {
          summaries: allData.map((row) => ({
            slug: row.slug,
            name_en: row.name_en,
            name_cn: row.name_cn,
            hook: (row.profile as Record<string, unknown>)?.hook as string || "",
            experience_type: (row.profile as Record<string, unknown>)?.experience_type as string || "",
            image: (row.images as string[])?.[0] || null,
          })),
          slugs: allData.map((row) => row.slug),
        };
      }
    }
    return { summaries: [], slugs: [] };
  }

  return {
    summaries: data.map((row) => ({
      slug: row.slug,
      name_en: row.name_en,
      name_cn: row.name_cn,
      hook: (row.profile as Record<string, unknown>)?.hook as string || "",
      experience_type: (row.profile as Record<string, unknown>)?.experience_type as string || "",
      image: (row.images as string[])?.[0] || null,
    })),
    slugs: data.map((row) => row.slug),
  };
}
