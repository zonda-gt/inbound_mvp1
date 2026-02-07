"use client";

import { useState } from "react";
import type { POIResult } from "@/lib/amap";

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km away`;
  return `${meters}m away`;
}

export default function RestaurantCard({
  place,
  onNavigate,
}: {
  place: POIResult;
  onNavigate: (name: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${place.name}\n${place.address}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cuisineTag = place.type
    ? place.type.split(";").pop() || place.type
    : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {/* Top row: name + rating */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold leading-snug text-gray-900">
          {place.name}
        </h4>
        {place.rating && place.rating !== "0" && (
          <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
            ⭐ {place.rating}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {place.distance > 0 && <span>{formatDistance(place.distance)}</span>}
        {cuisineTag && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
            {cuisineTag}
          </span>
        )}
        {place.cost && place.cost !== "0" && (
          <span>~¥{place.cost}/person</span>
        )}
      </div>

      {/* Opening hours */}
      {place.openingHours && (
        <p className="mt-1 text-xs text-gray-400">{place.openingHours}</p>
      )}

      {/* Action buttons */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onNavigate(place.name)}
          className="flex-1 rounded-lg bg-[#2563EB] py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          🧭 Navigate
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? "✅ Copied!" : "📋 Copy Name"}
        </button>
      </div>
    </div>
  );
}
