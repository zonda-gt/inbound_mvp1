"use client";

import { useEffect, useState } from "react";
import type { CuratedRestaurant } from "@/lib/curated-restaurants";

/* eslint-disable @typescript-eslint/no-explicit-any */

function asStr(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNum(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") { const n = Number(v); if (Number.isFinite(n)) return n; }
  return null;
}

function asArr<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function simplifyCuisine(cuisine?: string | null): string {
  if (typeof cuisine !== "string" || !cuisine.trim()) return "Restaurant";
  const simplified = cuisine.split(/\s*[—–-]\s*/)[0].split(/,/)[0].trim();
  if (!simplified) return "Restaurant";
  const words = simplified.split(/\s+/);
  return words.length > 4 ? words.slice(0, 4).join(" ") : simplified;
}

function comfortLabel(level: number): string {
  if (level >= 5) return "Very familiar";
  if (level >= 4) return "Comfortable";
  if (level >= 3) return "Mildly adventurous";
  if (level >= 2) return "Adventurous";
  return "Very adventurous";
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
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
  userLocation?: [number, number];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Extract v2 profile fields
  const p = restaurant.profile || {};
  const card = p.layer1_card || {};
  const detail = p.layer2_detail || {};
  const identity = card.identity || {};
  const vibe = card.vibe || {};
  const price = card.price || {};
  const tags = card.tags || {};
  const whatToOrder = detail.what_to_order || {};
  const howToOrder = detail.how_to_order || {};
  const practical = detail.practical || {};
  const warnings = asArr(detail.warnings);

  // Derived values
  const hook = asStr(card.hook || card.verdict || restaurant.foreigner_hook);
  const priceCny = asNum(price.price_per_person_cny);
  const rating = asNum(tags.rating_adjusted) ?? asNum(tags.rating);
  const cuisineType = asStr(identity.cuisine_type || restaurant.cuisine);
  const neighborhood = asStr(identity.neighborhood_en);
  const vibeTags = asArr<string>(vibe.captions || vibe.tags).map((v) => asStr(v)).filter(Boolean).slice(0, 3);
  const bestFor = asArr<string>(tags.best_for).map((v) => asStr(v)).filter(Boolean).slice(0, 3);
  const topDishes = asArr(whatToOrder.top_dishes).slice(0, 3);
  const skipNote = asStr(whatToOrder.skip);
  const orderSteps = asArr<string>(howToOrder.steps).map((v) => asStr(v)).filter(Boolean);
  const visitorMistakes = (() => {
    const raw = howToOrder.what_visitors_get_wrong || howToOrder.common_mistakes || [];
    return Array.isArray(raw) ? raw.map((v: any) => asStr(v)).filter(Boolean) : [asStr(raw)].filter(Boolean);
  })();
  const reservation = asStr(practical.reservation);
  const payment = asStr(practical.payment);
  const bestTime = asStr(practical.best_time);

  // Images — v2 is string[], not {url, is_hero}[]
  const allImages = asArr<string>(restaurant.images).filter((s) => typeof s === "string" && s.trim().length > 0);
  const galleryImages = allImages.slice(0, 5);
  const heroImage = galleryImages[0] || null;
  const collageImages = galleryImages.slice(0, 3);
  const hasCollage = collageImages.length >= 3;
  const extraCount = Math.max(0, galleryImages.length - 3);

  const location = `${restaurant.longitude},${restaurant.latitude}`;
  const address = asStr(restaurant.address_cn || restaurant.address);
  const distanceKm =
    userLocation && restaurant.latitude != null && restaurant.longitude != null
      ? haversineDistance(userLocation[1], userLocation[0], restaurant.latitude, restaurant.longitude)
      : null;

  const openLightbox = (idx: number) => {
    if (galleryImages.length === 0) return;
    setLightboxIndex(Math.min(Math.max(idx, 0), galleryImages.length - 1));
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const showPrev = () => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () => setLightboxIndex((prev) => (prev + 1) % galleryImages.length);

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
        style={{
          overflow: "hidden", borderRadius: 14, background: "#fff",
          border: active ? "1.5px solid #D0021B" : "1px solid #F0F0F0",
          boxShadow: active ? "0 0 0 3px rgba(208,2,27,0.08), 0 1px 4px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.06)",
          transition: "border-color 200ms, box-shadow 200ms",
        }}
        onClick={onCardClick}
      >
        {/* ── Hero / collage image block ── */}
        {heroImage ? (
          <div className="relative w-full overflow-hidden bg-gray-100">
            {hasCollage ? (
              <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1 bg-white/80">
                <button type="button" className="group relative col-span-2 row-span-2 overflow-hidden"
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }} aria-label="Open photo gallery">
                  <img src={collageImages[0]} alt={`${restaurant.name_en} photo 1`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                </button>
                {collageImages.slice(1).map((imgUrl, idx) => {
                  const galleryIdx = idx + 1;
                  const showExtra2 = idx === 1 && extraCount > 0;
                  return (
                    <button key={`${imgUrl}-${galleryIdx}`} type="button" className="group relative overflow-hidden"
                      onClick={(e) => { e.stopPropagation(); openLightbox(galleryIdx); }} aria-label={`Open photo ${galleryIdx + 1}`}>
                      <img src={imgUrl} alt={`${restaurant.name_en} photo ${galleryIdx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                      {showExtra2 && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-lg font-semibold text-white">+{extraCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button type="button" className="group block w-full"
                onClick={(e) => { e.stopPropagation(); openLightbox(0); }} aria-label="Open photo gallery">
                <img src={heroImage} alt={restaurant.name_en}
                  className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
              </button>
            )}
            {index != null && (
              <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#D0021B] text-xs font-bold text-white shadow-md">{index}</span>
            )}
          </div>
        ) : (
          <div className="relative flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
            <span className="text-5xl">🍽️</span>
            {index != null && (
              <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#D0021B] text-xs font-bold text-white shadow-md">{index}</span>
            )}
          </div>
        )}

        {/* ── Name + Chinese name ── */}
        <div style={{ padding: "14px 16px 2px" }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: "#1A1A1A", margin: 0 }}>{restaurant.name_en}</h4>
          <p style={{ marginTop: 2, fontSize: 12, color: "#999" }}>{restaurant.name_cn}</p>
        </div>

        {/* ── Hook ── */}
        {hook && (
          <div style={{ padding: "10px 16px 12px" }}>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "#555", margin: 0, borderLeft: "2px solid #D0021B", paddingLeft: 12 }}>{hook}</p>
          </div>
        )}

        {/* ── Vibe tags ── */}
        {vibeTags.length > 0 && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {vibeTags.map((tag, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 500, color: "#888", background: "#F5F5F5",
                padding: "3px 10px", borderRadius: 20,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* ── Info line ── */}
        <div style={{ padding: "0 16px 10px", fontSize: 13, color: "#888", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px 0" }}>
          {priceCny != null && (
            <>
              <span style={{ fontWeight: 600, color: "#1A1A1A" }}>¥{priceCny}</span>
              <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
            </>
          )}
          {rating != null && (
            <>
              <span><span style={{ color: "#F59E0B" }}>★</span> {rating}</span>
              <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
            </>
          )}
          <span>{simplifyCuisine(cuisineType)}</span>
          {distanceKm != null && (
            <>
              <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
              <span>{formatDistance(distanceKm)}</span>
            </>
          )}
          {!distanceKm && neighborhood && (
            <>
              <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
              <span>{neighborhood}</span>
            </>
          )}
        </div>

        {/* ── Best for tags ── */}
        {bestFor.length > 0 && (
          <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#999" }}>
            {bestFor.join(" · ")}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(restaurant.name_cn, location, address); }}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#D0021B", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity 150ms" }}
          >Navigate →</button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowBooking(!showBooking); }}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#F5F5F5", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 150ms" }}
          >Book for me</button>
        </div>

        {/* ── Booking toast ── */}
        {showBooking && (
          <div style={{ margin: "0 16px 12px", padding: "10px 14px", borderRadius: 10, background: "#FFF7ED", color: "#9A3412", fontSize: 13, lineHeight: 1.55 }}>
            Booking service coming soon! Tell us the restaurant, date, time, and group size in chat — we&apos;ll help you reserve.
          </div>
        )}

        {/* ── Expand toggle ── */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "11px 0", border: "none", background: "none", fontSize: 13, fontWeight: 500, color: "#999", cursor: "pointer", transition: "color 150ms" }}
        >
          {expanded ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Collapse</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> See what to order</>
          )}
        </button>

        {/* ── Expanded section ── */}
        {expanded && (
          <div style={{ borderTop: "1px solid #F0F0F0" }}>
            {/* Top dishes with comfort dots */}
            {topDishes.length > 0 && (
              <div style={{ padding: "14px 16px 4px" }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>What to order</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                  {topDishes.map((dish: any, i: number) => {
                    const name = asStr(dish.dish_name_en || dish.name_en || dish.name);
                    const desc = asStr(dish.description);
                    const dishPrice = asNum(dish.price_cny);
                    const comfort = Math.max(0, Math.min(5, asNum(dish.comfort_level) || 0));
                    const badge = asStr(dish.badge);
                    const isMust = badge.toLowerCase().includes("must") || comfort >= 4;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {badge && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
                              padding: "2px 8px", borderRadius: 5,
                              background: isMust ? "#FEF2E0" : "#E8F5E9",
                              color: isMust ? "#C0392B" : "#2D8A4E",
                            }}>{badge}</span>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{name}</span>
                          {dishPrice != null && <span style={{ fontSize: 12, color: "#999", marginLeft: "auto" }}>¥{dishPrice}</span>}
                        </div>
                        {desc && <p style={{ marginTop: 3, fontSize: 13, lineHeight: 1.5, color: "#888" }}>{desc}</p>}
                        {comfort > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 5 }}>
                            {[...Array(5)].map((_, dot) => (
                              <span key={dot} style={{ width: 7, height: 7, borderRadius: "50%", background: dot < comfort ? "#22C55E" : "#E5E5E5" }} />
                            ))}
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: 0.3, marginLeft: 4 }}>{comfortLabel(comfort)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* What to skip */}
            {skipNote && (
              <div style={{ margin: "0 16px", marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Skip</h5>
                <p style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#888" }}>{skipNote}</p>
              </div>
            )}

            {/* How to order — steps */}
            {orderSteps.length > 0 && (
              <div style={{ margin: "0 16px", marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>How to order</h5>
                <ol style={{ marginTop: 8, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {orderSteps.slice(0, 5).map((step, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#888" }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Visitor mistakes */}
            {visitorMistakes.length > 0 && (
              <div style={{ margin: "0 16px", marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Avoid these mistakes</h5>
                <ul style={{ marginTop: 6, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                  {visitorMistakes.slice(0, 3).map((m, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#888" }}>• {m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div style={{ margin: "0 16px", marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12 }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Heads up</h5>
                <ul style={{ marginTop: 6, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                  {warnings.slice(0, 3).map((w: any, i: number) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#888" }}>• {asStr(w.warning || w.text || w)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practical info */}
            {(reservation || payment || bestTime) && (
              <div style={{ margin: "0 16px", marginTop: 14, borderTop: "1px solid #F0F0F0", paddingTop: 12, paddingBottom: 2 }}>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Practical</h5>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3, fontSize: 13, color: "#888" }}>
                  {reservation && <div><span style={{ color: "#555", fontWeight: 500 }}>Reservation:</span> {reservation}</div>}
                  {payment && <div><span style={{ color: "#555", fontWeight: 500 }}>Payment:</span> {payment}</div>}
                  {bestTime && <div><span style={{ color: "#555", fontWeight: 500 }}>Best time:</span> {bestTime}</div>}
                </div>
              </div>
            )}

            {/* Collapse */}
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "11px 0", border: "none", borderTop: "1px solid #F0F0F0", background: "none", fontSize: 13, fontWeight: 500, color: "#999", cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              Collapse
            </button>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 px-3 py-4 sm:px-6 sm:py-6" onClick={closeLightbox}>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between text-white">
              <span className="text-sm font-medium">{lightboxIndex + 1} / {galleryImages.length}</span>
              <button type="button" onClick={closeLightbox} className="rounded-md bg-white/15 px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-white/25">Close</button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {galleryImages.length > 1 && (
                <button type="button" onClick={showPrev} className="absolute left-1 z-10 rounded-full bg-white/20 px-3 py-2 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:left-3" aria-label="Previous photo">‹</button>
              )}
              <img src={galleryImages[lightboxIndex]} alt={`${restaurant.name_en} large photo ${lightboxIndex + 1}`} className="max-h-full w-auto max-w-full rounded-xl object-contain" />
              {galleryImages.length > 1 && (
                <button type="button" onClick={showNext} className="absolute right-1 z-10 rounded-full bg-white/20 px-3 py-2 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-3" aria-label="Next photo">›</button>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, i) => (
                  <button key={`${imgUrl}-thumb-${i}`} type="button" onClick={() => setLightboxIndex(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${i === lightboxIndex ? "border-white" : "border-white/35"}`}
                    aria-label={`View photo ${i + 1}`}>
                    <img src={imgUrl} alt={`${restaurant.name_en} thumbnail ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
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
