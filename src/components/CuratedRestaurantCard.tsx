"use client";

import { useEffect, useState } from "react";
import type { CuratedRestaurant } from "@/lib/curated-restaurants";

function getRatingEmoji(foreigner_rating?: string | null): string {
  const rating = typeof foreigner_rating === "string" ? foreigner_rating : "";
  if (rating.startsWith("🟢")) return "🟢";
  if (rating.startsWith("🟡")) return "🟡";
  if (rating.startsWith("🔴")) return "🔴";
  return "⚪";
}

// Simplify long cuisine strings to 2-3 words max for the info line
function simplifyCuisine(cuisine?: string | null): string {
  if (typeof cuisine !== "string" || cuisine.trim().length === 0) {
    return "Restaurant";
  }
  // Take the first meaningful segment before a dash or comma
  const simplified = cuisine.split(/\s*[—–-]\s*/)[0].split(/,/)[0].trim();
  if (!simplified) return "Restaurant";
  // If still long, take first 4 words
  const words = simplified.split(/\s+/);
  if (words.length > 4) return words.slice(0, 4).join(" ");
  return simplified;
}

// Pick top 3 dishes with variety of foreigner ratings
function pickTopDishes(dishes: CuratedRestaurant["signature_dishes"]): CuratedRestaurant["signature_dishes"] {
  if (!dishes || dishes.length <= 3) return dishes || [];

  const greens = dishes.filter((d) => d.foreigner_rating.startsWith("🟢"));
  const yellows = dishes.filter((d) => d.foreigner_rating.startsWith("🟡"));
  const reds = dishes.filter((d) => d.foreigner_rating.startsWith("🔴"));

  const picks: CuratedRestaurant["signature_dishes"] = [];

  // Try to get one of each for variety
  if (greens.length > 0) picks.push(greens[0]);
  if (yellows.length > 0) picks.push(yellows[0]);
  if (reds.length > 0) picks.push(reds[0]);

  // Fill remaining slots from whichever has more, preserving original order
  if (picks.length < 3) {
    for (const dish of dishes) {
      if (picks.length >= 3) break;
      if (!picks.includes(dish)) picks.push(dish);
    }
  }

  return picks.slice(0, 3);
}

// Build the "Heads up" warning text from complaints + dietary notes
function buildHeadsUp(restaurant: CuratedRestaurant): string | null {
  const parts: string[] = [];

  // Top complaint
  if (restaurant.common_complaints && restaurant.common_complaints.length > 0) {
    const top = restaurant.common_complaints[0];
    parts.push(top.practical_note || top.complaint);
  }

  // Spice/flavor warnings from dietary notes
  const notes = restaurant.spice_and_dietary_notes;
  if (notes) {
    if (notes.sweetness_warning) parts.push(notes.sweetness_warning);
    if (notes.spice_details && notes.overall_spice_level) {
      const level = notes.overall_spice_level.toLowerCase();
      if (level.includes("hot") || level.includes("spicy")) {
        parts.push(notes.spice_details);
      }
    }
  }

  if (parts.length === 0) return null;
  // Limit to ~3 sentences worth
  return parts.slice(0, 2).join(" ");
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export default function CuratedRestaurantCard({
  restaurant,
  onNavigate,
  index,
  active,
  onCardClick,
  userLocation,
}: {
  restaurant: CuratedRestaurant;
  onNavigate: (name: string, location: string, address: string) => void;
  index?: number;
  active?: boolean;
  onCardClick?: () => void;
  userLocation?: [number, number]; // [lng, lat]
}) {
  const [expanded, setExpanded] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const orderedImages = [...(restaurant.images || [])]
    .filter((img) => typeof img.url === "string" && img.url.trim().length > 0)
    .sort((a, b) => Number(b.is_hero) - Number(a.is_hero));
  const galleryImages = orderedImages.slice(0, 5);
  const heroImage = galleryImages[0];
  const collageImages = galleryImages.slice(0, 3);
  const hasCollage = collageImages.length >= 3;
  const location = `${restaurant.longitude},${restaurant.latitude}`;
  const distanceKm =
    userLocation && restaurant.latitude != null && restaurant.longitude != null
      ? haversineDistance(userLocation[1], userLocation[0], restaurant.latitude, restaurant.longitude)
      : null;
  const topDishes = pickTopDishes(restaurant.signature_dishes);
  const headsUp = buildHeadsUp(restaurant);
  const orderGuide = restaurant.ordering_guide?.for_2_people;
  const actionableTips = (restaurant.practical_tips || []).slice(0, 4);
  const extraCount = Math.max(0, galleryImages.length - 3);

  const openLightbox = (idx: number) => {
    if (galleryImages.length === 0) return;
    setLightboxIndex(Math.min(Math.max(idx, 0), galleryImages.length - 1));
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);
  const showPrev = () =>
    setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () =>
    setLightboxIndex((prev) => (prev + 1) % galleryImages.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, galleryImages.length]);

  return (
    <>
      <div
        className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
          active
            ? "border-blue-400 ring-2 ring-blue-100"
            : "border-gray-200"
        }`}
        onClick={onCardClick}
      >
        {/* ── Hero / collage image block ── */}
        {heroImage ? (
          <div className="relative w-full overflow-hidden bg-gray-100">
            {hasCollage ? (
              <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1 bg-white/80">
                <button
                  type="button"
                  className="group relative col-span-2 row-span-2 overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(0);
                  }}
                  aria-label="Open photo gallery"
                >
                  <img
                    src={collageImages[0].url}
                    alt={`${restaurant.name_en} photo 1`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>

                {collageImages.slice(1).map((img, idx) => {
                  const galleryIdx = idx + 1;
                  const showExtra = idx === 1 && extraCount > 0;
                  return (
                    <button
                      key={`${img.url}-${galleryIdx}`}
                      type="button"
                      className="group relative overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(galleryIdx);
                      }}
                      aria-label={`Open photo ${galleryIdx + 1}`}
                    >
                      <img
                        src={img.url}
                        alt={`${restaurant.name_en} photo ${galleryIdx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      {showExtra && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-lg font-semibold text-white">
                          +{extraCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                className="group block w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
                aria-label="Open photo gallery"
              >
                <img
                  src={heroImage.url}
                  alt={restaurant.name_en}
                  className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </button>
            )}
            {index != null && (
              <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md">
                {index}
              </span>
            )}
          </div>
        ) : (
          <div className="relative flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
            <span className="text-5xl">🍽️</span>
            {index != null && (
              <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md">
                {index}
              </span>
            )}
          </div>
        )}

        {/* ── Name + Chinese name ── */}
        <div className="px-4 pt-4 pb-1">
          <h4 className="text-[17px] font-bold leading-snug text-gray-900">
            {restaurant.name_en}
          </h4>
          <p className="mt-0.5 text-[13px] text-gray-400">{restaurant.name_cn}</p>
        </div>

        {/* ── Foreigner hook — the star of the card ── */}
        <p className="px-4 pt-2 pb-3 text-[14px] italic leading-relaxed text-gray-600">
          &ldquo;{restaurant.foreigner_hook}&rdquo;
        </p>

        {/* ── Info line: price · rating · cuisine · distance ── */}
        <div className="px-4 pb-4 text-[13px] text-gray-500">
          <span className="font-medium text-gray-700">¥{restaurant.price_per_person}/person</span>
          <span className="mx-1.5">·</span>
          <span>⭐ {restaurant.rating}</span>
          <span className="mx-1.5">·</span>
          <span>{simplifyCuisine(restaurant.cuisine)}</span>
          {distanceKm != null && (
            <>
              <span className="mx-1.5">·</span>
              <span>📍 {formatDistance(distanceKm)}</span>
            </>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2.5 px-4 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(restaurant.name_cn, location, restaurant.address);
            }}
            className="flex-1 rounded-lg bg-[#16a34a] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-green-700"
          >
            🧭 Navigate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBooking(!showBooking);
            }}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Book for me 🔒
          </button>
        </div>

        {/* ── Booking toast ── */}
        {showBooking && (
          <div className="mx-4 mb-3 rounded-lg bg-blue-50 px-3.5 py-3 text-[13px] leading-relaxed text-blue-800">
            Booking service coming soon! Tell us the restaurant, date, time, and group size in chat — we&apos;ll help you reserve.
          </div>
        )}

        {/* ── Expand toggle ── */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 py-3 text-[13px] font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          {expanded ? "▲ Collapse" : "▼ See what to order"}
        </button>

        {/* ── Expanded: What to order ── */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* Dishes section */}
            {topDishes.length > 0 && (
              <div className="px-4 pt-4 pb-1">
                <h5 className="text-[15px] font-bold text-gray-900">What to order</h5>
                <p className="mt-1 mb-4 text-[12px] text-gray-400">
                  🟢 Familiar&ensp;&ensp;🟡 Try it&ensp;&ensp;🔴 Bold
                </p>

                <div className="flex flex-col gap-4">
                  {topDishes.map((dish, i) => (
                    <div key={i}>
                      <p className="text-[14px] font-semibold text-gray-900">
                        {getRatingEmoji(dish.foreigner_rating)} {dish.english_name}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                        {dish.notes || dish.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ordering guide */}
            {orderGuide && (
              <div className="mx-4 mt-5 border-t border-gray-100 pt-4">
                <h5 className="text-[14px] font-bold text-gray-900">How to order (for 2 people)</h5>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                  {orderGuide.suggested_order}
                </p>
                <p className="mt-1 text-[13px] font-medium text-gray-700">
                  ~¥{orderGuide.estimated_spend_rmb}
                </p>
              </div>
            )}

            {/* Tips */}
            {actionableTips.length > 0 && (
              <div className="mx-4 mt-5 border-t border-gray-100 pt-4">
                <h5 className="text-[14px] font-bold text-gray-900">Tips</h5>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {actionableTips.map((tip, i) => (
                    <li key={i} className="text-[13px] leading-relaxed text-gray-500">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Heads up */}
            {headsUp && (
              <div className="mx-4 mt-5 border-t border-gray-100 pt-4 pb-1">
                <h5 className="text-[14px] font-bold text-gray-900">⚠️ Heads up</h5>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                  {headsUp}
                </p>
              </div>
            )}

            {/* Collapse button at bottom */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              className="mt-3 flex w-full items-center justify-center border-t border-gray-100 py-3 text-[13px] font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            >
              ▲ Collapse
            </button>
          </div>
        )}
      </div>

      {lightboxOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/85 px-3 py-4 sm:px-6 sm:py-6"
          onClick={closeLightbox}
        >
          <div
            className="mx-auto flex h-full w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between text-white">
              <span className="text-sm font-medium">
                {lightboxIndex + 1} / {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                className="rounded-md bg-white/15 px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-white/25"
              >
                Close
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-1 z-10 rounded-full bg-white/20 px-3 py-2 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:left-3"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
              )}

              <img
                src={galleryImages[lightboxIndex].url}
                alt={`${restaurant.name_en} large photo ${lightboxIndex + 1}`}
                className="max-h-full w-auto max-w-full rounded-xl object-contain"
              />

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-1 z-10 rounded-full bg-white/20 px-3 py-2 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-3"
                  aria-label="Next photo"
                >
                  ›
                </button>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={`${img.url}-thumb-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                      i === lightboxIndex ? "border-white" : "border-white/35"
                    }`}
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={`${restaurant.name_en} thumbnail ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
