"use client";

import type { POIResult } from "@/lib/amap";
import RestaurantCard from "./RestaurantCard";

export default function RestaurantList({
  places,
  keyword,
  onNavigate,
}: {
  places: POIResult[];
  keyword?: string;
  onNavigate: (name: string, location: string, address: string) => void;
}) {
  const display = places.slice(0, 5);

  return (
    <div className="my-2">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        🍜 {keyword ? `${keyword} restaurants nearby` : "Restaurants near you"}
      </p>
      <div className="flex flex-col gap-2">
        {display.map((place, i) => (
          <RestaurantCard key={i} place={place} onNavigate={onNavigate} />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Want more options? Try asking for a specific cuisine.
      </p>
    </div>
  );
}
