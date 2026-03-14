import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { EatRestaurant } from './eat-restaurants';

interface DbRow {
  slug: string;
  images: string[];
  profile: any;
  foreigner_hook: string | null;
}

// ── localStorage persistence (survives page reloads) ──
const LS_KEY = 'hc-restaurants-v2';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function lsRead(): EatRestaurant[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) return null;
    return data;
  } catch { return null; }
}

function lsWrite(data: EatRestaurant[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data })); }
  catch { /* ignore quota errors */ }
}

// ── In-memory cache (instant within same session) ──
let memCache: EatRestaurant[] | null = null;
let inFlight: Promise<EatRestaurant[]> | null = null;

async function fetchFromSupabase(restaurants: EatRestaurant[]): Promise<EatRestaurant[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('restaurants_v2')
      .select('slug, images, profile, foreigner_hook');

    if (error || !data) return restaurants;

    const bySlug = new Map<string, DbRow>();
    for (const row of data as DbRow[]) bySlug.set(row.slug, row);

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

    memCache = enriched;
    lsWrite(enriched);
    return enriched;
  } catch {
    return restaurants;
  }
}

/** Returns cached data instantly, then revalidates from Supabase in the background */
export async function enrichRestaurantsFromDb(restaurants: EatRestaurant[]): Promise<EatRestaurant[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return restaurants;

  // 1. Memory cache — instant
  if (memCache) {
    // Silently revalidate in background (stale-while-revalidate)
    fetchFromSupabase(restaurants).catch(() => {});
    return memCache;
  }

  // 2. localStorage cache — fast (no network)
  const stored = lsRead();
  if (stored) {
    memCache = stored;
    // Revalidate in background without blocking
    fetchFromSupabase(restaurants).catch(() => {});
    return stored;
  }

  // 3. First-ever load — fetch from Supabase (slow, but only happens once)
  if (inFlight) return inFlight;
  inFlight = fetchFromSupabase(restaurants).finally(() => { inFlight = null; });
  return inFlight;
}
