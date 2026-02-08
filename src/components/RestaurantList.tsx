"use client";

import type { POIResult } from "@/lib/amap";
import RestaurantCard from "./RestaurantCard";

export default function RestaurantList({
  places,
  onNavigate,
}: {
  places: POIResult[];
  onNavigate: (name: string, location: string, address: string) => void;
}) {
  const display = places.slice(0, 5);

  return (
    <div className="my-2">
      <div className="flex flex-col gap-2.5">
        {display.map((place, i) => (
          <RestaurantCard key={i} place={place} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
