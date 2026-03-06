'use client';

import { useState, useEffect } from 'react';
import type { AttractionData } from '@/types/attraction';

// ── localStorage persistence ──
const LS_PREFIX = 'hc-col-v1-';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function lsRead(key: string): AttractionData[] | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) return null;
    return data;
  } catch { return null; }
}

function lsWrite(key: string, data: AttractionData[]): void {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); }
  catch { /* ignore quota errors */ }
}

// ── In-memory cache (instant within same session) ──
const memCache = new Map<string, AttractionData[]>();

async function fetchAttractions(slugs: string[]): Promise<AttractionData[]> {
  const res = await fetch(`/api/attractions?slugs=${encodeURIComponent(slugs.join(','))}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.attractions || [];
}

export function useCollectionData(slugs: string[]) {
  const key = slugs.join(',');
  const [attractions, setAttractions] = useState<AttractionData[]>(() => memCache.get(key) || []);
  const [loading, setLoading] = useState(() => !memCache.has(key));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slugs.length === 0) { setAttractions([]); setLoading(false); return; }

    // 1. Memory hit — already shown via useState initialiser, just revalidate quietly
    if (memCache.has(key)) {
      fetchAttractions(slugs)
        .then((fresh) => { memCache.set(key, fresh); lsWrite(key, fresh); setAttractions(fresh); })
        .catch(() => {});
      return;
    }

    // 2. localStorage hit — show instantly, revalidate in background
    const stored = lsRead(key);
    if (stored) {
      memCache.set(key, stored);
      setAttractions(stored);
      setLoading(false);
      fetchAttractions(slugs)
        .then((fresh) => { memCache.set(key, fresh); lsWrite(key, fresh); setAttractions(fresh); })
        .catch(() => {});
      return;
    }

    // 3. First-ever load — fetch and show
    let cancelled = false;
    setLoading(true);
    fetchAttractions(slugs)
      .then((data) => {
        if (cancelled) return;
        memCache.set(key, data);
        lsWrite(key, data);
        setAttractions(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { attractions, loading, error };
}
