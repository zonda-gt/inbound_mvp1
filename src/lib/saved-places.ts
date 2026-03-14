import type { SupabaseClient } from '@supabase/supabase-js';

export interface SavedPlace {
  id: string;
  place_type: 'restaurant' | 'attraction';
  place_slug: string;
  place_name: string;
  place_name_cn: string | null;
  place_image: string | null;
  saved_at: string;
}

export async function getSavedPlaces(supabase: SupabaseClient): Promise<SavedPlace[]> {
  const { data, error } = await supabase
    .from('saved_places')
    .select('id, place_type, place_slug, place_name, place_name_cn, place_image, saved_at')
    .order('saved_at', { ascending: false });

  if (error || !data) return [];
  return data as SavedPlace[];
}

export async function savePlace(
  supabase: SupabaseClient,
  place: {
    place_type: 'restaurant' | 'attraction';
    place_slug: string;
    place_name: string;
    place_name_cn?: string;
    place_image?: string;
  },
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from('saved_places').upsert(
    {
      user_id: user.id,
      place_type: place.place_type,
      place_slug: place.place_slug,
      place_name: place.place_name,
      place_name_cn: place.place_name_cn || null,
      place_image: place.place_image || null,
    },
    { onConflict: 'user_id,place_type,place_slug' },
  );

  return !error;
}

export interface SavedPlaceExtra {
  images: string[];
  hook: string;
  price: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
}

/** Batch-fetch extras for saved places from their source tables */
export async function fetchExtrasForSavedPlaces(
  supabase: SupabaseClient,
  places: SavedPlace[],
): Promise<Record<string, SavedPlaceExtra>> {
  const restaurantSlugs = places.filter((p) => p.place_type === 'restaurant').map((p) => p.place_slug);
  const attractionSlugs = places.filter((p) => p.place_type === 'attraction').map((p) => p.place_slug);

  const extraMap: Record<string, SavedPlaceExtra> = {};

  const promises: Promise<void>[] = [];

  if (restaurantSlugs.length > 0) {
    promises.push(
      supabase
        .from('restaurants_v2')
        .select('slug, images, profile, latitude, longitude')
        .in('slug', restaurantSlugs)
        .then(({ data }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data || []).forEach((row: any) => {
            const imgs = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
            const card = row.profile?.layer1_card || {};
            const priceCny = card.price?.price_per_person_cny;
            extraMap[`restaurant:${row.slug}`] = {
              images: imgs.slice(0, 5),
              hook: card.hook || card.verdict || '',
              price: priceCny ? `¥${priceCny}/pp` : null,
              neighborhood: card.identity?.neighborhood_en || null,
              lat: row.latitude ?? null,
              lng: row.longitude ?? null,
            };
          });
        }),
    );
  }

  if (attractionSlugs.length > 0) {
    promises.push(
      supabase
        .from('attractions')
        .select('slug, images, profile')
        .in('slug', attractionSlugs)
        .then(({ data }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data || []).forEach((row: any) => {
            const imgs = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
            const profile = row.profile || {};
            const gi = profile.getting_in || {};
            const priceRaw = gi.price_rmb;
            const price = priceRaw ? (String(priceRaw).startsWith('¥') ? priceRaw : `¥${priceRaw}`) : null;
            const addr = profile.address_cn || '';
            const hood = profile.neighborhood_en || addr.split('区')[0]?.split('市').pop() || null;
            extraMap[`attraction:${row.slug}`] = {
              images: imgs.slice(0, 5),
              hook: profile.card_hook || profile.hook || '',
              price,
              neighborhood: hood,
              lat: profile.latitude ?? null,
              lng: profile.longitude ?? null,
            };
          });
        }),
    );
  }

  await Promise.all(promises);
  return extraMap;
}

export async function unsavePlace(
  supabase: SupabaseClient,
  placeType: string,
  placeSlug: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_places')
    .delete()
    .eq('user_id', user.id)
    .eq('place_type', placeType)
    .eq('place_slug', placeSlug);

  return !error;
}
