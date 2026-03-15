'use client';

import { useEffect, useState } from 'react';
import { ALL_EAT_RESTAURANTS, type EatRestaurant } from '../data/eat-restaurants';

let cachedRestaurants: EatRestaurant[] | null = null;
let inFlight: Promise<EatRestaurant[]> | null = null;

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

  for (const restaurant of ALL_EAT_RESTAURANTS) {
    if (!mergedBySlug.has(restaurant.slug)) mergedBySlug.set(restaurant.slug, restaurant);
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

async function fetchEatRestaurants(): Promise<EatRestaurant[]> {
  const res = await fetch('/api/restaurants-all');
  if (!res.ok) throw new Error(`Failed to load restaurants: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.restaurants)) throw new Error('Invalid restaurants payload');
  return mergeWithFallback(json.restaurants as EatRestaurant[]);
}

function loadEatRestaurants(): Promise<EatRestaurant[]> {
  if (cachedRestaurants) return Promise.resolve(cachedRestaurants);
  if (inFlight) return inFlight;

  inFlight = fetchEatRestaurants()
    .then((restaurants) => {
      cachedRestaurants = restaurants;
      return restaurants;
    })
    .catch(() => ALL_EAT_RESTAURANTS)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useEatRestaurants() {
  const [restaurants, setRestaurants] = useState<EatRestaurant[]>(cachedRestaurants || ALL_EAT_RESTAURANTS);
  const [loading, setLoading] = useState(!cachedRestaurants);

  useEffect(() => {
    let cancelled = false;

    loadEatRestaurants().then((nextRestaurants) => {
      if (cancelled) return;
      setRestaurants(nextRestaurants);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { restaurants, loading };
}
