import { ALL_EAT_RESTAURANTS, type EatRestaurant } from './eat-restaurants';
import { COLLECTION_LIST, type CollectionDef } from './collections-data';

export type SearchItemType = 'restaurant' | 'collection' | 'attraction';

export interface SearchItem {
  id: string;
  type: SearchItemType;
  name: string;
  nameCn: string;
  subtitle: string;
  hook: string;
  image: string | null;
  emoji: string;
  category: string;
  tags: string[];
  slug: string;
  price: string | null;
  rating: number | null;
}

function restaurantToItem(r: EatRestaurant): SearchItem {
  return {
    id: `r:${r.slug}`,
    type: 'restaurant',
    name: r.name_en,
    nameCn: r.name_cn,
    subtitle: r.cuisine_label,
    hook: r.hook || '',
    image: r.image,
    emoji: r.category === 'bars' ? '🍸' : '🍜',
    category: r.category,
    tags: [...(r.best_for || []), r.cuisine_label, r.category],
    slug: r.slug,
    price: r.price_cny ? `¥${r.price_cny}/pp` : null,
    rating: r.rating,
  };
}

function collectionToItem(c: CollectionDef): SearchItem {
  return {
    id: `c:${c.id}`,
    type: 'collection',
    name: c.title,
    nameCn: '',
    subtitle: c.desc,
    hook: c.coverHook,
    image: null,
    emoji: c.emoji,
    category: c.id,
    tags: [c.sectionLabel, ...c.title.toLowerCase().split(/\s+/)],
    slug: c.id,
    price: null,
    rating: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attractionToItem(a: any): SearchItem {
  return {
    id: `a:${a.slug}`,
    type: 'attraction',
    name: a.card_name || a.attraction_name_en || a.slug,
    nameCn: a.attraction_name_cn || '',
    subtitle: a.card_type || a.experience_type || '',
    hook: a.card_hook || a.hook || '',
    image: a.images?.[0] || null,
    emoji: '🎡',
    category: a.experience_type || '',
    tags: [...(a.best_for || []), a.experience_type || '', a.vibe || ''].filter(Boolean),
    slug: a.slug,
    price: null,
    rating: null,
  };
}

export function buildStaticItems(): SearchItem[] {
  const restaurants = ALL_EAT_RESTAURANTS.map(restaurantToItem);
  const collections = COLLECTION_LIST.map(collectionToItem);
  return [...restaurants, ...collections];
}

export function getAllCollectionSlugs(): string[] {
  const slugSet = new Set<string>();
  for (const col of COLLECTION_LIST) {
    for (const slug of col.slugs) {
      slugSet.add(slug);
    }
  }
  return Array.from(slugSet);
}

export const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'nameCn', weight: 0.25 },
    { name: 'hook', weight: 0.15 },
    { name: 'subtitle', weight: 0.1 },
    { name: 'tags', weight: 0.1 },
  ],
  threshold: 0.35,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
};
