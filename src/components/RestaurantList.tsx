"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import type { POIResult } from "@/lib/amap";
import RestaurantCard from "./RestaurantCard";
import MapView, { type MapMarker } from "./MapView";

export default function RestaurantList({
  places,
  onNavigate,
  userLocation,
}: {
  places: POIResult[];
  onNavigate: (name: string, location: string, address: string) => void;
  userLocation?: [number, number]; // [lng, lat]
}) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const display = places.slice(0, 5);

  const markers: MapMarker[] = useMemo(
    () =>
      display
        .map((place, i) => {
          const [lng, lat] = place.location.split(",").map(Number);
          if (isNaN(lng) || isNaN(lat)) return null;
          return {
            position: [lng, lat] as [number, number],
            label: String(i + 1),
            name: place.name,
          };
        })
        .filter((m): m is MapMarker => m !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [display.map((p) => p.location).join("|")],
  );

  const handleMarkerClick = useCallback((index: number) => {
    setActiveIndex(index);
    const el = cardRefs.current.get(index);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? undefined : index));
  }, []);

  return (
    <div className="my-2">
      {/* Map with numbered markers */}
      {markers.length > 0 && (
        <MapView
          markers={markers}
          activeMarker={activeIndex}
          onMarkerClick={handleMarkerClick}
          userLocation={userLocation}
          isApproximateLocation={!userLocation}
          height="200px"
          className="mb-2.5"
        />
      )}

      {/* Place cards */}
      <div className="flex flex-col gap-2.5">
        {display.map((place, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) cardRefs.current.set(i, el);
            }}
          >
            <RestaurantCard
              place={place}
              onNavigate={onNavigate}
              index={i + 1}
              active={activeIndex === i}
              onCardClick={() => handleCardClick(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
