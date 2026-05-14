'use client';

import { useEffect, useState } from 'react';
import { ALL_EAT_RESTAURANTS, type EatRestaurant } from '../data/eat-restaurants';
import { apiUrl } from '@/lib/api-client';
import type { CityKey } from './useActiveCity';

const cacheByCity = new Map<CityKey, EatRestaurant[]>();
const inFlightByCity = new Map<CityKey, Promise<EatRestaurant[]>>();

function mergeWithFallback(serverRestaurants: EatRestaurant[]): EatRestaurant[] {
  const fallbackBySlug = new Map(ALL_EAT_RESTAURANTS.map((restaurant) => [restaurant.slug, restaurant]));
  const mergedBySlug = new Map<string, EatRestaurant>();

  for (const restaurant of serverRestaurants) {
    const fallback = fallbackBySlug.get(restaurant.slug);
    mergedBySlug.set(restaurant.slug, {
      ...fallback,
      ...restaurant,
      image: restaurant.image || fallback?.image || null,
      images: restaurant.images?.length ? restaurant.images : (fallback?.images || []),
      hook: restaurant.hook || fallback?.hook,
      verdict: restaurant.verdict || fallback?.verdict,
      best_for: restaurant.best_for?.length ? restaurant.best_for : fallback?.best_for,
    });
  }

  const fallbackOrder = new Map(ALL_EAT_RESTAURANTS.map((restaurant, index) => [restaurant.slug, index]));

  return Array.from(mergedBySlug.values()).sort((a, b) => {
    const aOrder = fallbackOrder.get(a.slug);
    const bOrder = fallbackOrder.get(b.slug);
    if (aOrder != null && bOrder != null) return aOrder - bOrder;
    if (aOrder != null) return -1;
    if (bOrder != null) return 1;
    return a.name_en.localeCompare(b.name_en);
  });
}

async function fetchEatRestaurants(city: CityKey): Promise<EatRestaurant[]> {
  const res = await fetch(apiUrl(`/api/restaurants-all?city=${encodeURIComponent(city)}`));
  if (!res.ok) throw new Error(`Failed to load restaurants: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.restaurants)) throw new Error('Invalid restaurants payload');
  const merged = city === 'shanghai'
    ? mergeWithFallback(json.restaurants as EatRestaurant[])
    : (json.restaurants as EatRestaurant[]);
  return merged;
}

function loadEatRestaurants(city: CityKey): Promise<EatRestaurant[]> {
  const cached = cacheByCity.get(city);
  if (cached) return Promise.resolve(cached);
  const inFlight = inFlightByCity.get(city);
  if (inFlight) return inFlight;

  const p = fetchEatRestaurants(city)
    .then((restaurants) => {
      cacheByCity.set(city, restaurants);
      return restaurants;
    })
    .catch(() => (city === 'shanghai' ? ALL_EAT_RESTAURANTS : []))
    .finally(() => { inFlightByCity.delete(city); });

  inFlightByCity.set(city, p);
  return p;
}

export function useEatRestaurants(city: CityKey) {
  const initial = cacheByCity.get(city) ?? (city === 'shanghai' ? ALL_EAT_RESTAURANTS : []);
  const [restaurants, setRestaurants] = useState<EatRestaurant[]>(initial);
  const [loading, setLoading] = useState(!cacheByCity.has(city));

  useEffect(() => {
    let cancelled = false;
    setLoading(!cacheByCity.has(city));
    setRestaurants(cacheByCity.get(city) ?? (city === 'shanghai' ? ALL_EAT_RESTAURANTS : []));

    loadEatRestaurants(city).then((nextRestaurants) => {
      if (cancelled) return;
      setRestaurants(nextRestaurants);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [city]);

  return { restaurants, loading };
}
