'use client';

import { useState, useEffect } from 'react';
import type { AttractionData } from '@/types/attraction';

// Module-level cache to avoid re-fetching
const cache = new Map<string, AttractionData[]>();

function getCacheKey(slugs: string[]): string {
  return slugs.join(',');
}

export function useCollectionData(slugs: string[]) {
  const [attractions, setAttractions] = useState<AttractionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slugs.length === 0) {
      setAttractions([]);
      setLoading(false);
      return;
    }

    const key = getCacheKey(slugs);
    const cached = cache.get(key);
    if (cached) {
      setAttractions(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/attractions?slugs=${encodeURIComponent(slugs.join(','))}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data: AttractionData[] = json.attractions || [];
        if (!cancelled) {
          cache.set(key, data);
          setAttractions(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [slugs.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { attractions, loading, error };
}
