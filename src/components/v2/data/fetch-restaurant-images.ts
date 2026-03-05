import { createClient } from '@supabase/supabase-js';
import type { EatRestaurant } from './eat-restaurants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface DbRow {
  slug: string;
  images: string[];
  profile: any;
  foreigner_hook: string | null;
}

// Module-level cache so tab switches don't re-fetch and flash static images
let cachedResult: EatRestaurant[] | null = null;
let inFlight: Promise<EatRestaurant[]> | null = null;

/** Fetch all restaurant images/data from Supabase client-side and enrich static data */
export async function enrichRestaurantsFromDb(restaurants: EatRestaurant[]): Promise<EatRestaurant[]> {
  if (!supabaseUrl || !supabaseAnonKey) return restaurants;

  if (cachedResult) return cachedResult;
  if (inFlight) return inFlight;

  inFlight = (async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('restaurants_v2')
      .select('slug, images, profile, foreigner_hook');

    if (error || !data) return restaurants;

    // Build lookup by slug
    const bySlug = new Map<string, DbRow>();
    for (const row of data as DbRow[]) {
      bySlug.set(row.slug, row);
    }

    const enriched = restaurants.map((r) => {
      if (!r.slug) return r;
      const match = bySlug.get(r.slug);
      if (!match) return r;

      const card = match.profile?.layer1_card || {};
      const tags = card.tags || {};
      const imgs = match.images || [];

      return {
        ...r,
        image: imgs[0] || r.image,
        images: imgs.length > 0 ? imgs.slice(0, 8) : r.images,
        verdict: (card.verdict || '').slice(0, 100) || r.verdict,
        best_for: tags.best_for?.length ? tags.best_for : r.best_for,
      };
    });
    cachedResult = enriched;
    return enriched;
  } catch {
    return restaurants;
  }
  })();

  return inFlight;
}
