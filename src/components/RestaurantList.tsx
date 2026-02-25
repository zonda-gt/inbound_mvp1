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
  const MAX_DISPLAY_RESULTS = 8;
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const display = places.slice(0, MAX_DISPLAY_RESULTS);

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
            sourceIndex: i,
          };
        })
        .filter((m) => m !== null) as MapMarker[],
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
      {/* Place cards - shown first for instant visibility */}
      <div className="flex flex-col gap-2.5 mb-2.5">
        {display.map((place, i) => (
          <div
            key={i}
            className="hc-card-enter"
            style={{ animationDelay: `${i * 70}ms` }}
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

      {/* Map with numbered markers - shown below cards */}
      {markers.length > 0 && (
        <div className="hc-map-enter" style={{ animationDelay: `${display.length * 70}ms` }}>
          <MapView
            markers={markers}
            activeMarker={activeIndex}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
            isApproximateLocation={!userLocation}
            height="200px"
          />
        </div>
      )}
    </div>
  );
}
