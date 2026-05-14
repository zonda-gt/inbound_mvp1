'use client';

import { useCallback, useEffect, useState } from 'react';

export type CityKey = 'shanghai' | 'chongqing' | 'chengdu';

export const CITY_OPTIONS: Array<{ key: CityKey; label: string }> = [
  { key: 'shanghai', label: 'Shanghai' },
  { key: 'chongqing', label: 'Chongqing' },
  { key: 'chengdu', label: 'Chengdu' },
];

const LS_KEY = 'v2.activeCity';
const EVENT_NAME = 'v2-active-city-changed';
const DEFAULT_CITY: CityKey = 'shanghai';

function isCityKey(v: unknown): v is CityKey {
  return v === 'shanghai' || v === 'chongqing' || v === 'chengdu';
}

function readStored(): CityKey {
  if (typeof window === 'undefined') return DEFAULT_CITY;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return isCityKey(raw) ? raw : DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

export function useActiveCity(): [CityKey, (next: CityKey) => void] {
  const [city, setCityState] = useState<CityKey>(DEFAULT_CITY);

  useEffect(() => {
    setCityState(readStored());
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY && isCityKey(e.newValue)) setCityState(e.newValue);
    }
    function onInTabChange(e: Event) {
      const next = (e as CustomEvent<CityKey>).detail;
      if (isCityKey(next)) setCityState(next);
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onInTabChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onInTabChange as EventListener);
    };
  }, []);

  const setCity = useCallback((next: CityKey) => {
    setCityState(next);
    try { window.localStorage.setItem(LS_KEY, next); } catch { /* quota */ }
    try { window.dispatchEvent(new CustomEvent<CityKey>(EVENT_NAME, { detail: next })); } catch { /* ignore */ }
  }, []);

  return [city, setCity];
}
