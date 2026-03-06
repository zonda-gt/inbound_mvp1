import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import {
  type SearchItem,
  buildStaticItems,
  attractionToItem,
  getAllCollectionSlugs,
  FUSE_OPTIONS,
} from '../data/search-index';

let cachedFuse: Fuse<SearchItem> | null = null;

export function useSearchIndex(isOpen: boolean) {
  const [fuse, setFuse] = useState<Fuse<SearchItem> | null>(cachedFuse);
  const [loading, setLoading] = useState(!cachedFuse);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    fetchedRef.current = true;

    if (cachedFuse) {
      setFuse(cachedFuse);
      setLoading(false);
      return;
    }

    const staticItems = buildStaticItems();

    const allSlugs = getAllCollectionSlugs();
    fetch(`/api/attractions?slugs=${encodeURIComponent(allSlugs.join(','))}`)
      .then((r) => r.json())
      .then((json) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attractionItems = (json.attractions || []).map((a: any) => attractionToItem(a));
        const allItems = [...staticItems, ...attractionItems];
        const index = new Fuse(allItems, FUSE_OPTIONS);
        cachedFuse = index;
        setFuse(index);
        setLoading(false);
      })
      .catch(() => {
        const index = new Fuse(staticItems, FUSE_OPTIONS);
        cachedFuse = index;
        setFuse(index);
        setLoading(false);
      });
  }, [isOpen]);

  return { fuse, loading };
}
