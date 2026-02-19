"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import type { CuratedRestaurant } from "@/lib/curated-restaurants";
import CuratedRestaurantCard from "./CuratedRestaurantCard";
import MapView, { type MapMarker } from "./MapView";

export default function CuratedRestaurantList({
  restaurants,
  onNavigate,
  userLocation,
}: {
  restaurants: CuratedRestaurant[];
  onNavigate: (name: string, location: string, address: string) => void;
  userLocation?: [number, number]; // [lng, lat]
}) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const markers: MapMarker[] = useMemo(
    () =>
      restaurants
        .map((r, i) => {
          if (r.longitude == null || r.latitude == null) return null;

          const lng = Number(r.longitude);
          const lat = Number(r.latitude);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
          return {
            position: [lng, lat] as [number, number],
            label: String(i + 1),
            name: r.name_cn,
            sourceIndex: i,
          };
        })
        .filter((m) => m !== null) as MapMarker[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurants.map((r) => `${r.longitude},${r.latitude}`).join("|")],
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
      {/* Restaurant cards */}
      <div className="flex flex-col gap-2.5 mb-2.5">
        {restaurants.map((restaurant, i) => (
          <div
            key={restaurant.id}
            className="hc-card-enter"
            style={{ animationDelay: `${i * 70}ms` }}
            ref={(el) => {
              if (el) cardRefs.current.set(i, el);
            }}
          >
            <CuratedRestaurantCard
              restaurant={restaurant}
              onNavigate={onNavigate}
              index={i + 1}
              active={activeIndex === i}
              onCardClick={() => handleCardClick(i)}
            />
          </div>
        ))}
      </div>

      {/* Map with numbered markers */}
      {markers.length > 0 && (
        <div className="hc-map-enter" style={{ animationDelay: `${restaurants.length * 70}ms` }}>
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
