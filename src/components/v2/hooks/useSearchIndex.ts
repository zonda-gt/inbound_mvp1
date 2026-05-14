import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import {
  type SearchItem,
  buildStaticItems,
  attractionToItem,
  FUSE_OPTIONS,
} from '../data/search-index';
import { ALL_EAT_RESTAURANTS } from '../data/eat-restaurants';
import { apiUrl } from '@/lib/api-client';
import type { CityKey } from './useActiveCity';

const fuseByCity = new Map<CityKey, Fuse<SearchItem>>();

function restaurantApiItemToSearchItem(r: {
  slug: string;
  name_en: string;
  name_cn: string;
  cuisine_label?: string;
  hook?: string;
  image: string | null;
  category: string;
  best_for?: string[];
  price_cny?: number | null;
  rating?: number | null;
}): SearchItem {
  return {
    id: `r:${r.slug}`,
    type: 'restaurant',
    name: r.name_en,
    nameCn: r.name_cn,
    subtitle: r.cuisine_label || '',
    hook: r.hook || '',
    image: r.image,
    emoji: r.category === 'bars' ? '🍸' : '🍜',
    category: r.category,
    tags: [...(r.best_for || []), r.cuisine_label || '', r.category].filter(Boolean),
    slug: r.slug,
    price: r.price_cny ? `¥${r.price_cny}/pp` : null,
    rating: r.rating ?? null,
  };
}

export function useSearchIndex(isOpen: boolean, city: CityKey) {
  const [fuse, setFuse] = useState<Fuse<SearchItem> | null>(fuseByCity.get(city) ?? null);
  const [loading, setLoading] = useState(!fuseByCity.has(city));
  const fetchedRef = useRef<Set<CityKey>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    const cached = fuseByCity.get(city);
    if (cached) {
      setFuse(cached);
      setLoading(false);
      return;
    }
    if (fetchedRef.current.has(city)) return;
    fetchedRef.current.add(city);

    setLoading(true);

    Promise.all([
      fetch(apiUrl(`/api/restaurants-all?city=${encodeURIComponent(city)}`)).then((r) => r.json()).catch(() => ({ restaurants: [] })),
      fetch(apiUrl(`/api/attractions?city=${encodeURIComponent(city)}&limit=100`)).then((r) => r.json()).catch(() => ({ attractions: [] })),
    ]).then(([restaurantsJson, attractionsJson]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const restaurantItems = (restaurantsJson.restaurants || []).map((r: any) => restaurantApiItemToSearchItem(r));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attractionItems = (attractionsJson.attractions || []).map((a: any) => attractionToItem(a));

      // Shanghai: also include the curated collection items + Shanghai-only static fallback restaurants
      const staticItems = city === 'shanghai' ? buildStaticItems() : [];
      // Dedupe restaurants by slug (server > static fallback)
      const seenSlugs = new Set<string>(restaurantItems.map((r: SearchItem) => r.slug));
      const staticRestaurantsFiltered = staticItems.filter(
        (it) => it.type !== 'restaurant' || !seenSlugs.has(it.slug),
      );

      const allItems = [...restaurantItems, ...attractionItems, ...staticRestaurantsFiltered];
      const index = new Fuse(allItems, FUSE_OPTIONS);
      fuseByCity.set(city, index);
      setFuse(index);
      setLoading(false);
    }).catch(() => {
      // Total failure fallback: Shanghai static items only
      const fallbackItems = city === 'shanghai'
        ? buildStaticItems()
        : ALL_EAT_RESTAURANTS.filter(() => false).map(() => ({} as SearchItem));
      const index = new Fuse(fallbackItems, FUSE_OPTIONS);
      fuseByCity.set(city, index);
      setFuse(index);
      setLoading(false);
    });
  }, [isOpen, city]);

  return { fuse, loading };
}
