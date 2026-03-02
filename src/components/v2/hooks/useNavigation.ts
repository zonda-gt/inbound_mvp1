'use client';

import { useState, useEffect, useRef } from 'react';
import type { NavigationResult } from '@/app/api/navigation/route';

export type { NavigationResult };

export function useNavigation(
  destination: string | null,
  origin: string,
  city?: string,
) {
  const [data, setData] = useState<NavigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!destination) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchRoutes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination, origin, city }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const result: NavigationResult = await res.json();
        setData(result);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Navigation failed');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
    return () => controller.abort();
  }, [destination, origin, city]);

  return { data, loading, error };
}
