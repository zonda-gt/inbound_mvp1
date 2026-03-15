"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNavigation } from "../hooks/useNavigation";
import { useAMap } from "@/hooks/useAMap";
import type { TransitSegment, TransitRoute, WalkingRoute, DrivingRoute } from "@/lib/amap";
import { track } from '@/lib/analytics';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { savePlace, unsavePlace } from '@/lib/saved-places';
import SaveSheet from '../SaveSheet';

const supabase = getSupabaseBrowserClient();

export type NavigateDestination = {
  name: string;
  chineseName?: string;
  address?: string;
  location?: string;
  slug?: string;
  placeType?: 'restaurant' | 'attraction';
};

interface NavigateScreenProps {
  onNavigate: (screen: string) => void;
  destination?: NavigateDestination | null;
  onClearDestination?: () => void;
  referrer?: string | null;
}

type TransportMode = "metro" | "taxi" | "walk";

const SUGGESTED_PLACES = [
  { emoji: "🏛", name: "The Bund", cn: "外滩" },
  { emoji: "🗼", name: "Oriental Pearl Tower", cn: "东方明珠" },
  { emoji: "🏯", name: "Yu Garden", cn: "豫园" },
  { emoji: "🛍", name: "Nanjing Road", cn: "南京路步行街" },
  { emoji: "🌳", name: "French Concession", cn: "法租界" },
  { emoji: "🎭", name: "Tianzifang", cn: "田子坊" },
];

export default function NavigateScreen({
  onNavigate,
  destination: externalDest,
  onClearDestination,
  referrer,
}: NavigateScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localDest, setLocalDest] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<TransportMode>("metro");
  const [navScrolled, setNavScrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  const { location: gpsLocation, city, isDemo } = useGeolocation();

  // Use Chinese name for Amap search (better results), fall back to English name
  const activeDest = externalDest?.chineseName || externalDest?.name || localDest;
  const { data, loading, error } = useNavigation(activeDest, gpsLocation, city);

  // Suppress unused var warning — onNavigate available for future use
  void onNavigate;

  // Auto-select best mode when data arrives
  useEffect(() => {
    if (!data) return;
    if (data.transit) setActiveMode("metro");
    else if (data.driving) setActiveMode("taxi");
    else if (data.walking) setActiveMode("walk");
  }, [data]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    track('navigate_search', { destination: q });
    setLocalDest(q);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback((name: string, cn?: string) => {
    track('navigate_search', { destination: name });
    setSearchQuery(name);
    setLocalDest(cn || name);
  }, []);

  const handleClear = useCallback(() => {
    setLocalDest(null);
    setSearchQuery("");
    onClearDestination?.();
  }, [onClearDestination]);

  const handleCopyAddress = useCallback(() => {
    if (!data) return;
    const text = `${data.destination.name}\n${data.destination.address}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }, [data]);

  // Parse slug from referrer if not in destination (e.g. "/attractions/my-slug" → "my-slug")
  const placeSlug = externalDest?.slug || referrer?.split('/').pop() || '';
  const placeType: 'restaurant' | 'attraction' = externalDest?.placeType || (referrer?.includes('/restaurants/') ? 'restaurant' : 'attraction');

  // Check saved status on mount
  useEffect(() => {
    if (!placeSlug) return;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const { data: rows } = await supabase
        .from('saved_places')
        .select('id')
        .eq('place_slug', placeSlug)
        .eq('place_type', placeType)
        .limit(1);
      if (rows && rows.length > 0) setSaved(true);
    })();
  }, [placeSlug, placeType]);

  async function handleFav() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { setShowSaveSheet(true); return; }
    const name = externalDest?.name || data?.destination?.name || '';
    const wasSaved = saved;
    setSaved(s => !s);
    if (wasSaved) { unsavePlace(supabase, placeType, placeSlug); }
    else { savePlace(supabase, { place_type: placeType, place_slug: placeSlug, place_name: name }); }
    track('place_save', { slug: placeSlug, type: placeType, action: wasSaved ? 'unsave' : 'save' });
  }

  // ───── SEARCH STATE ─────
  if (!activeDest && !loading) {
    return (
      <div className="v2-scroll-body">
        <section className="v2-nav-hdr v2-fade-up v2-d1">
          <h1 className="v2-nav-hdr-title">Where to?</h1>
          <div className="v2-route-card">
            <div className="v2-route-row">
              <span className="v2-route-dot o" />
              <span className="v2-route-lbl">From</span>
              <span className="v2-route-val">{isDemo ? "People\u2019s Square (\u4EBA\u6C11\u5E7F\u573A)" : "Your Location"}</span>
            </div>
            <div className="v2-route-line-v" />
            <div className="v2-route-row">
              <span className="v2-route-dot d" />
              <span className="v2-route-lbl">To</span>
              <div className="v2-route-input-wrap">
                <input
                  className="v2-route-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="Search a place, restaurant, address..."
                />
                {searchQuery && (
                  <button className="v2-nav-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                )}
              </div>
            </div>
          </div>
        </section>

        <SearchMap gpsLocation={gpsLocation} isDemo={isDemo} />

        <section className="v2-nav-suggestions v2-fade-up v2-d3">
          <div className="v2-nav-sugg-title">Popular destinations</div>
          {SUGGESTED_PLACES.map((p) => (
            <button
              key={p.name}
              className="v2-nav-sugg-item"
              onClick={() => handleSelectSuggestion(p.name, p.cn)}
            >
              <span className="v2-nav-sugg-emoji">{p.emoji}</span>
              <div className="v2-nav-sugg-text">
                <div className="v2-nav-sugg-name">{p.name}</div>
                <div className="v2-nav-sugg-cn">{p.cn}</div>
              </div>
              <span className="v2-nav-sugg-arrow">→</span>
            </button>
          ))}
        </section>
      </div>
    );
  }

  // ───── LOADING STATE ─────
  if (loading) {
    return (
      <div className="v2-scroll-body">
        <div className="v2-nav-car-loading v2-fade-up v2-d1">
          <div className="v2-nav-car-road">
            <div className="v2-nav-car-dashes" />
            <div className="v2-nav-car-emoji">🚗</div>
          </div>
          <div className="v2-nav-car-text">Finding the best route...</div>
          <div className="v2-nav-car-dest">{activeDest}</div>
        </div>
      </div>
    );
  }

  // ───── ERROR STATE ─────
  if (error) {
    return (
      <div className="v2-scroll-body">
        <section className="v2-nav-hdr v2-fade-up v2-d1">
          <h1 className="v2-nav-hdr-title">Getting There</h1>
        </section>
        <div className="v2-nav-error v2-fade-up v2-d2">
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Couldn&apos;t find that place</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>{error}</div>
          <button className="v2-btn-big-ghost" onClick={handleClear}>← Try another search</button>
        </div>
      </div>
    );
  }

  // ───── RESULTS STATE ─────
  if (!data) return null;

  const { transit, walking, driving } = data;
  // Prefer English name from external destination, fall back to Amap Chinese name
  const displayName = externalDest?.name || data.destination.name;

  // Build polylines for the active mode
  const routePolylines = buildRoutePolylines(activeMode, transit, walking, driving);

  return (
    <div className="v2-scroll-body" onScroll={(e) => { const scrolled = e.currentTarget.scrollTop > 10; if (scrolled !== navScrolled) setNavScrolled(scrolled); }}>
      {/* 0. Sticky nav bar — matches AttractionDetail */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 16px 10px', transition: 'background .3s, box-shadow .3s', ...(navScrolled ? { background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(0,0,0,.06)' } : {}) }}>
        <button onClick={() => { handleClear(); }} style={{ width: 40, height: 40, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#222', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}>←</button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: '#222', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { if (navigator.share) { navigator.share({ url: window.location.href, title: displayName }).catch(() => {}); } else { navigator.clipboard.writeText(window.location.href).catch(() => {}); } }} aria-label="Share" style={{ width: 40, height: 40, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#222', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
          <button onClick={handleFav} aria-label={saved ? 'Unsave' : 'Save'} style={{ width: 40, height: 40, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: saved ? '#D0021B' : '#222', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}>{saved ? '♥' : '♡'}</button>
        </div>
      </nav>
      <SaveSheet isOpen={showSaveSheet} placeName={displayName} onClose={() => setShowSaveSheet(false)} onLoggedIn={() => { setShowSaveSheet(false); setSaved(true); }} />

      {/* 1. Book Your Seats (restaurants only) */}
      {placeType === 'restaurant' && <BookingCard destinationName={displayName} />}

      {/* 2. Header */}
      <section className="v2-nav-hdr v2-fade-up v2-d1">
        <h1 className="v2-nav-hdr-title">Getting There</h1>

        <div className="v2-route-card">
          <div className="v2-route-row">
            <span className="v2-route-dot o" />
            <span className="v2-route-lbl">From</span>
            <span className="v2-route-val">{isDemo ? "People's Square (人民广场)" : "Your Location"}</span>
          </div>
          <div className="v2-route-line-v" />
          <div className="v2-route-row">
            <span className="v2-route-dot d" />
            <span className="v2-route-lbl">To</span>
            <span className="v2-route-val">{displayName}</span>
          </div>
        </div>
      </section>

      {/* 2. Mode Toggle — iOS segmented control */}
      <div className="v2-mode-toggle v2-fade-up v2-d1">
        {transit && (
          <button
            className={`v2-mode-btn${activeMode === "metro" ? " active" : ""}`}
            onClick={() => { track('navigate_mode_select', { mode: 'metro', destination: displayName }); setActiveMode("metro"); }}
          >
            <span className="v2-mode-icon">🚇</span>
            <span className="v2-mode-time">{transit.totalDuration} min</span>
            <span className="v2-mode-label">Metro</span>
            <span className="v2-mode-cost">{transit.cost} · {transit.transferCount} transfer{transit.transferCount !== 1 ? "s" : ""}</span>
          </button>
        )}

        {driving && (
          <button
            className={`v2-mode-btn${activeMode === "taxi" ? " active" : ""}`}
            onClick={() => { track('navigate_mode_select', { mode: 'taxi', destination: displayName }); setActiveMode("taxi"); }}
          >
            <span className="v2-mode-icon">🚕</span>
            <span className="v2-mode-time">{driving.duration} min</span>
            <span className="v2-mode-label">Taxi</span>
            <span className="v2-mode-cost">¥{driving.taxiFare}</span>
          </button>
        )}

        {walking && (
          <button
            className={`v2-mode-btn${activeMode === "walk" ? " active" : ""}`}
            onClick={() => { track('navigate_mode_select', { mode: 'walk', destination: displayName }); setActiveMode("walk"); }}
          >
            <span className="v2-mode-icon">🚶</span>
            <span className="v2-mode-time">{walking.duration} min</span>
            <span className="v2-mode-label">Walk</span>
            <span className="v2-mode-cost">{formatDistance(walking.distance)}</span>
          </button>
        )}
      </div>

      {/* 3. Route Map */}
      <RouteMap
        originLocation={data.origin}
        destLocation={data.destination.location}
        destName={displayName}
        isDemo={isDemo}
        polylines={routePolylines}
      />

      {/* 4. Route Summary + Step-by-step */}
      {activeMode === "metro" && transit && (
        <>
          {/* Summary strip with stats + proportional bar */}
          <div className="v2-route-summary v2-fade-up v2-d2">
            <span className="v2-stat-badge accent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {transit.totalDuration} min
            </span>
            <span className="v2-stat-badge green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              {transit.cost}
            </span>
            {transit.transferCount > 0 && (
              <span className="v2-stat-badge amber">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 17h16M4 7h16M7 17l3-10M14 17l3-10"/></svg>
                {transit.transferCount} transfer{transit.transferCount !== 1 ? "s" : ""}
              </span>
            )}
            {/* Proportional route bar */}
            <div className="v2-route-bar">
              {transit.segments.map((seg, i) => {
                const lineInfo = seg.type === "transit" ? parseLineName(seg.lineName) : null;
                return (
                  <div
                    key={i}
                    className="v2-route-bar-seg"
                    style={{
                      flex: seg.type === "walking" ? 1 : (seg.type === "transit" ? seg.stopCount : 1),
                      background: seg.type === "walking" ? "#D1D1D6" : (lineInfo ? getLineColor(lineInfo.display) : "#007AFF"),
                    }}
                  />
                );
              })}
            </div>
          </div>

          <section className="v2-steps-wrap v2-fade-up v2-d2" style={{ marginTop: 16 }}>
            <h2 className="v2-steps-title">Directions</h2>
            {transit.segments.map((seg, i) => (
              <StepItem key={i} segment={seg} isLast={i === transit.segments.length - 1} />
            ))}
            {/* Arrive step */}
            <div className="v2-step">
              <div className="v2-step-ind">
                <div className="v2-step-circ arrive">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
                </div>
              </div>
              <div className="v2-step-body">
                <p className="v2-step-action">Arrive at {data.destination.name}</p>
                <p className="v2-step-detail">{data.destination.address}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {activeMode === "walk" && walking && (
        <section className="v2-steps-wrap v2-fade-up v2-d2" style={{ marginTop: 16 }}>
          <h2 className="v2-steps-title">Walking</h2>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ walk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13 7l-3 8 3 3 2 5"/><path d="M10 15l-3 5"/><path d="M10 7l5 3v4"/></svg>
              </div>
              <div className="v2-step-conn walk" />
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Walk to {data.destination.name}</p>
              <p className="v2-step-detail">{formatDistance(walking.distance)} · ~{walking.duration} min</p>
              <div className="v2-step-tags">
                <span className="v2-step-tag walk">{formatDistance(walking.distance)}</span>
              </div>
            </div>
          </div>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ arrive">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
              </div>
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Arrive at {data.destination.name}</p>
              <p className="v2-step-detail">{data.destination.address}</p>
            </div>
          </div>
        </section>
      )}

      {activeMode === "taxi" && driving && (
        <>
          {/* Uber-inspired dark taxi card */}
          <div className="v2-taxi-card v2-fade-up v2-d2">
            <div className="v2-taxi-card-header">
              <div className="v2-taxi-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h14v-5l-2-5H7L5 12v5z"/>
                  <circle cx="7.5" cy="17" r="2"/>
                  <circle cx="16.5" cy="17" r="2"/>
                  <path d="M9 7l1-3h4l1 3"/>
                </svg>
              </div>
              <div>
                <div className="v2-taxi-card-title">Taxi Ride</div>
                <div className="v2-taxi-card-subtitle">Estimated via DiDi / street hail</div>
              </div>
            </div>
            <div className="v2-taxi-stats">
              <div className="v2-taxi-stat">
                <div className="v2-taxi-stat-val">{driving.duration}</div>
                <div className="v2-taxi-stat-label">Minutes</div>
              </div>
              <div className="v2-taxi-stat">
                <div className="v2-taxi-stat-val">¥{driving.taxiFare}</div>
                <div className="v2-taxi-stat-label">Est. Fare</div>
              </div>
              <div className="v2-taxi-stat">
                <div className="v2-taxi-stat-val">{formatDistance(driving.distance)}</div>
                <div className="v2-taxi-stat-label">Distance</div>
              </div>
            </div>
            <div className="v2-taxi-route-bar">
              <div className="v2-taxi-route-dot origin" />
              <div className="v2-taxi-route-text" style={{ fontSize: 11 }}>Your location</div>
              <div className="v2-taxi-route-line" />
              <div className="v2-taxi-route-text" style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{data.destination.name}</div>
              <div className="v2-taxi-route-dot dest" />
            </div>
          </div>
        </>
      )}

      {/* 5. AI Tip */}
      {walking && walking.duration <= 15 && activeMode !== "walk" && (
        <div className="v2-ai-strip v2-fade-up v2-d3">
          <div className="v2-ai-strip-icon">✦</div>
          <p className="v2-ai-strip-text">
            <strong>Pro tip:</strong> It&apos;s only a {walking.duration}-min walk ({formatDistance(walking.distance)}).
            Save money and enjoy the scenery!
          </p>
        </div>
      )}

      {/* 7. Action Buttons */}
      <div className="v2-nav-acts v2-fade-up v2-d4">
        <div className="v2-nav-acts-row">
          <button
            className="v2-nav-cta v2-nav-cta--primary"
            onClick={() => {
              track('navigate_deeplink', { app: 'amap', destination: data.destination.name });
              const [lng, lat] = data.destination.location.split(",");
              const dest = encodeURIComponent(data.destination.name);
              const deepLink = `iosamap://path?dlat=${lat}&dlon=${lng}&dname=${dest}&dev=0&t=0`;
              const webFallback = `https://uri.amap.com/search?keyword=${dest}&callnative=1`;
              const start = Date.now();
              window.location.href = deepLink;
              setTimeout(() => {
                if (Date.now() - start < 1500) window.open(webFallback, "_blank");
              }, 800);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1.5C6.41 1.5 3.5 4.41 3.5 8c0 1.74.72 3.6 1.88 5.25C6.76 15.24 8.64 16.95 10 18.5c1.36-1.55 3.24-3.26 4.62-5.25C15.78 11.6 16.5 9.74 16.5 8c0-3.59-2.91-6.5-6.5-6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="10" cy="8" r="2.25" fill="currentColor"/>
            </svg>
            View in Amap
          </button>
          <button
            className="v2-nav-cta v2-nav-cta--secondary"
            onClick={() => {
              track('navigate_deeplink', { app: 'didi', destination: data.destination.name });
              const [lng, lat] = data.destination.location.split(",");
              const dest = encodeURIComponent(data.destination.name);
              const deepLink = `didapinche://app?dlat=${lat}&dlng=${lng}&dname=${dest}`;
              const webFallback = `https://common.diditaxi.com.cn/general/webEntry?sLat=&sLng=&dLat=${lat}&dLng=${lng}&dName=${dest}`;
              const start = Date.now();
              window.location.href = deepLink;
              setTimeout(() => {
                if (Date.now() - start < 1500) window.open(webFallback, "_blank");
              }, 800);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3.5 12.5V14a1 1 0 001 1h1a1 1 0 001-1v-.5h7v.5a1 1 0 001 1h1a1 1 0 001-1v-1.5m-13 0V10a1 1 0 011-1h.34l1.2-3.1A1.5 1.5 0 016.44 5h7.12a1.5 1.5 0 011.4.9L16.16 9h.34a1 1 0 011 1v2.5m-14 0h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="10.75" r="0.75" fill="currentColor"/>
              <circle cx="14" cy="10.75" r="0.75" fill="currentColor"/>
            </svg>
            Book DiDi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Booking Card (OpenTable-style) ─── */

/** Generate 30-min time slots. For today: starts 2 hours from now.
 *  For future dates: full range 11:00–21:00. */
function generateTimeSlots(isToday: boolean): string[] {
  const earliest = 11 * 60; // 11:00
  const latest = 21 * 60;   // 21:00
  let first = earliest;

  if (isToday) {
    const now = new Date();
    const startMin = (now.getHours() + 2) * 60 + now.getMinutes();
    const roundedStart = Math.ceil(startMin / 30) * 30;
    first = Math.max(roundedStart, earliest);
  }

  const slots: string[] = [];
  for (let m = first; m <= latest; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function formatTime12(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function BookingCard({ destinationName }: { destinationName: string }) {
  const [guests, setGuests] = useState(2);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [date, setDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const isToday = date === todayStr;
  const timeSlots = useMemo(() => generateTimeSlots(isToday), [isToday]);

  // Ref to track state for cleanup
  const selectedTimeRef = useRef(selectedTime);
  useEffect(() => { selectedTimeRef.current = selectedTime; }, [selectedTime]);

  // Check if user is logged in and grab email
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
        setEmail(data.session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (selectedTimeRef.current) {
        track('booking_abandoned', { destination: destinationName, step_reached: 'time_selected' });
      }
    };
  }, [destinationName]);

  // If today has no slots left, auto-switch to tomorrow
  useEffect(() => {
    if (isToday && timeSlots.length === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [isToday, timeSlots]);

  // Clear selected time when date changes and slots shift
  useEffect(() => {
    if (selectedTime && !timeSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [timeSlots, selectedTime]);

  const formatDate = (d: string) => {
    if (!d) return "Select date";
    if (d === todayStr) return "Today";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleTimeSelect = (t: string) => {
    track('booking_form_open', { destination: destinationName });
    setSelectedTime(t);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = userEmail || email.trim();
    if (!date || !selectedTime || !guestName.trim() || !phone.trim() || !finalEmail) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationName,
          bookingDate: date,
          bookingTime: selectedTime,
          partySize: guests,
          guestName: guestName.trim(),
          guestPhone: phone.trim(),
          guestEmail: finalEmail,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookingId(data.id || null);
        track('booking_submit', { destination: destinationName, guests });
      }
      setSubmitted(true);
      setSelectedTime(null);
    } catch {
      setSubmitted(true);
      setSelectedTime(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted state ──
  if (submitted) {
    return (
      <section className="v2-book-section v2-fade-up v2-d1">
        <div className="v2-book-card v2-book-submitted">
          <div className="v2-book-submitted-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2.5 2.5L16 9" />
            </svg>
          </div>
          <div className="v2-book-submitted-title">Booking Requested</div>
          <div className="v2-book-submitted-details">
            {destinationName} &middot; {formatDate(date)} &middot; {guests} guest{guests !== 1 ? "s" : ""}
          </div>
          <div className="v2-book-submitted-note">
            We&apos;ll email you at <strong>{userEmail || email}</strong> once your reservation is confirmed.
          </div>
          {bookingId && (
            <a className="v2-book-status-link" href={`/booking/${bookingId}`}>
              View Booking Status
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="v2-book-section v2-fade-up v2-d1">
      <div className="v2-book-card v2-book-ot">
        {/* Header */}
        <div className="v2-book-ot-header">
          <div className="v2-book-ot-title">Book My Seats</div>
          <div className="v2-book-ot-sub">We&apos;ll handle everything</div>
        </div>

        {/* Selectors row: guests + date */}
        <div className="v2-book-ot-selectors">
          {/* Guest pill */}
          <div className="v2-book-ot-pill-wrap">
            <button
              className="v2-book-ot-pill"
              onClick={() => setShowGuestPicker(!showGuestPicker)}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>{guests} guest{guests !== 1 ? "s" : ""}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showGuestPicker && (
              <div className="v2-book-ot-dropdown">
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <button
                    key={n}
                    className={`v2-book-ot-dropdown-item${guests === n ? " active" : ""}`}
                    onClick={() => { setGuests(n); setShowGuestPicker(false); }}
                    type="button"
                  >
                    {n} guest{n !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date pill */}
          <label className="v2-book-ot-pill v2-book-ot-date-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{formatDate(date)}</span>
            <input
              type="date"
              className="v2-book-ot-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </label>
        </div>

        {/* Time slots row */}
        <div className="v2-book-ot-times-label">Select a time</div>
        <div className="v2-book-ot-times" ref={timeSlotsRef}>
          {timeSlots.map((t) => (
            <button
              key={t}
              type="button"
              className={`v2-book-ot-time-btn${selectedTime === t ? " active" : ""}`}
              onClick={() => handleTimeSelect(t)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {formatTime12(t)}
            </button>
          ))}
        </div>

        {/* Guest details + submit (appears after selecting a time) */}
        {selectedTime && (
          <form className="v2-book-ot-confirm" onSubmit={handleSubmit}>
            <div className="v2-book-ot-confirm-summary">
              {formatDate(date)} at {formatTime12(selectedTime)} &middot; {guests} guest{guests !== 1 ? "s" : ""}
            </div>
            <input
              className="v2-book-ot-email"
              type="text"
              placeholder="Name for reservation"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoComplete="name"
              required
            />
            <input
              className="v2-book-ot-email"
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
            {!userEmail && (
              <input
                className="v2-book-ot-email"
                type="email"
                placeholder="Email for confirmation"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            )}
            <button
              className="v2-book-ot-submit"
              type="submit"
              disabled={submitting || !guestName.trim() || !phone.trim() || (!userEmail && !email.trim())}
            >
              {submitting ? "Submitting..." : "Complete reservation"}
            </button>
            <div className="v2-book-ot-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              We will send you confirmation within 2 hours
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─── Helper components ─── */

function StepItem({ segment, isLast }: { segment: TransitSegment; isLast: boolean }) {
  if (segment.type === "walking") {
    return (
      <div className="v2-step">
        <div className="v2-step-ind">
          <div className="v2-step-circ walk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13 7l-3 8 3 3 2 5"/><path d="M10 15l-3 5"/><path d="M10 7l5 3v4"/></svg>
          </div>
          {!isLast && <div className="v2-step-conn walk" />}
        </div>
        <div className="v2-step-body">
          <p className="v2-step-action">Walk {formatDistance(segment.distance)}</p>
          <p className="v2-step-detail">~{segment.duration} min</p>
          <div className="v2-step-tags">
            <span className="v2-step-tag walk">{formatDistance(segment.distance)}</span>
          </div>
        </div>
      </div>
    );
  }

  const lineInfo = parseLineName(segment.lineName);
  const lineColor = getLineColor(lineInfo.display);
  return (
    <div className="v2-step">
      <div className="v2-step-ind">
        <div className="v2-step-circ metro" style={{ background: lineColor }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/><circle cx="8.5" cy="21" r="1"/><circle cx="15.5" cy="21" r="1"/></svg>
        </div>
        {!isLast && <div className="v2-step-conn metro" style={{ background: lineColor + "25" }} />}
      </div>
      <div className="v2-step-body">
        <p className="v2-step-action">
          {lineInfo.display} → {segment.direction || segment.arrivalStop}
        </p>
        <p className="v2-step-detail">
          Board at {segment.departureStop}, exit at {segment.arrivalStop}
        </p>
        <div className="v2-step-tags">
          <span className="v2-line-badge" style={{ background: lineColor }}>{lineInfo.display}</span>
          <span className="v2-step-tag stops">{segment.stopCount} stop{segment.stopCount !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Search Map ─── */

/* eslint-disable @typescript-eslint/no-explicit-any */
function SearchMap({ gpsLocation, isDemo }: { gpsLocation: string; isDemo: boolean }) {
  const { AMap, loaded } = useAMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    if (!loaded || !AMap || !mapRef.current) return;
    if (mapInst.current) return;

    const [lngStr, latStr] = gpsLocation.split(",");
    const lng = Number(lngStr);
    const lat = Number(latStr);

    const map = new AMap.Map(mapRef.current, {
      center: [lng, lat],
      zoom: 13,
      mapStyle: "amap://styles/normal",
      dragEnable: false,
      zoomEnable: false,
      touchZoom: false,
      scrollWheel: false,
      doubleClickZoom: false,
      keyboardEnable: false,
      showIndoorMap: false,
      viewMode: "2D",
    });

    // Marker: blue dot with pulse (GPS) or dark dot with ring (demo)
    const markerHtml = `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:0;background:rgba(66,133,244,0.1);border-radius:50%;animation:v2-gps-pulse 2s ease-out infinite"></div>
          <div style="position:absolute;inset:8px;background:rgba(66,133,244,0.08);border-radius:50%"></div>
          <div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 6px rgba(66,133,244,.45);position:relative;z-index:1"></div>
        </div>`;

    const markerContent = document.createElement("div");
    markerContent.innerHTML = markerHtml;
    new AMap.Marker({
      position: [lng, lat],
      content: markerContent,
      anchor: "center",
      map,
    });

    mapInst.current = map;
    return () => { map.destroy(); mapInst.current = null; };
  }, [loaded, AMap, gpsLocation, isDemo]);

  if (!loaded) {
    return (
      <div className="v2-fade-up v2-d2" style={{ margin: "16px 20px", borderRadius: 20, aspectRatio: "4/3", background: "#f5f5f5" }} />
    );
  }

  return (
    <div className="v2-fade-up v2-d2" style={{ margin: "16px 20px", position: "relative" }}>
      <style>{`.amap-logo,.amap-copyright,.amap-mcode{display:none!important}`}</style>
      <div ref={mapRef} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 20, overflow: "hidden" }} />
      {isDemo && (
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          background: "rgba(0,0,0,.65)", color: "#fff",
          fontSize: 11, fontWeight: 600, padding: "5px 10px",
          borderRadius: 8, backdropFilter: "blur(4px)",
        }}>
          People&apos;s Square, Shanghai
        </div>
      )}
    </div>
  );
}
/* ─── Route Map (results state — shows origin + destination) ─── */

type PolylineData = { path: string; color: string; dashed?: boolean };

function RouteMap({ originLocation, destLocation, destName, isDemo, polylines }: {
  originLocation: string; destLocation: string; destName: string; isDemo: boolean;
  polylines: PolylineData[];
}) {
  const { AMap, loaded } = useAMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  // Serialize polylines to a stable string so useEffect re-runs on mode change
  const polylineKey = polylines.map(p => p.color + (p.dashed ? "d" : "s")).join("|");

  useEffect(() => {
    if (!loaded || !AMap || !mapRef.current) return;

    // Destroy previous map instance on re-render (mode change)
    if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null; }

    const [oLng, oLat] = originLocation.split(",").map(Number);
    const [dLng, dLat] = destLocation.split(",").map(Number);

    const map = new AMap.Map(mapRef.current, {
      center: [(oLng + dLng) / 2, (oLat + dLat) / 2],
      zoom: 12,
      mapStyle: "amap://styles/normal",
      dragEnable: false,
      zoomEnable: false,
      touchZoom: false,
      scrollWheel: false,
      doubleClickZoom: false,
      keyboardEnable: false,
      showIndoorMap: false,
      viewMode: "2D",
    });

    // Draw route polylines
    for (const pl of polylines) {
      const points = parsePolylineStr(pl.path)
        .map(([lng, lat]) => new AMap.LngLat(lng, lat))
        .filter((p: any) => p !== null);
      if (points.length < 2) continue;
      const line = new AMap.Polyline({
        path: points,
        strokeColor: pl.color,
        strokeWeight: pl.dashed ? 3 : 5,
        strokeOpacity: pl.dashed ? 0.6 : 0.85,
        strokeStyle: pl.dashed ? "dashed" : "solid",
        lineJoin: "round",
      });
      map.add(line);
    }

    // Origin marker — Google Maps-style blue dot with pulse
    const oMarker = document.createElement("div");
    oMarker.innerHTML = isDemo
      ? `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:6px;background:rgba(26,26,26,0.08);border-radius:50%"></div>
          <div style="width:14px;height:14px;background:#1A1A1A;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.25);position:relative;z-index:1"></div>
        </div>`
      : `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:0;background:rgba(66,133,244,0.1);border-radius:50%;animation:v2-gps-pulse 2s ease-out infinite"></div>
          <div style="position:absolute;inset:8px;background:rgba(66,133,244,0.08);border-radius:50%"></div>
          <div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 6px rgba(66,133,244,.45);position:relative;z-index:1"></div>
        </div>`;
    new AMap.Marker({ position: [oLng, oLat], content: oMarker, anchor: "center", map });

    // Destination marker — Modern teardrop pin with label
    const dMarker = document.createElement("div");
    dMarker.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2))">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 43C17 43 33 27.2 33 17C33 8.16 25.84 1 17 1C8.16 1 1 8.16 1 17C1 27.2 17 43 17 43Z" fill="#1A1A1A" stroke="#fff" stroke-width="1.5"/>
        <circle cx="17" cy="16" r="5.5" fill="#fff"/>
      </svg>
      <div style="margin-top:2px;padding:3px 10px;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:8px;font-size:12px;font-weight:700;color:#1A1A1A;white-space:nowrap;font-family:'Inter','DM Sans',-apple-system,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.12);letter-spacing:-0.01em">${destName}</div>
    </div>`;
    new AMap.Marker({ position: [dLng, dLat], content: dMarker, anchor: "center", offset: new AMap.Pixel(0, -22), map });

    // Fit map to show all overlays (polylines + markers)
    map.setFitView(null, false, [60, 60, 60, 60]);

    mapInst.current = map;
    return () => { map.destroy(); mapInst.current = null; };
  }, [loaded, AMap, originLocation, destLocation, destName, isDemo, polylineKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) {
    return (
      <div className="v2-fade-up v2-d2" style={{ margin: "16px 20px", borderRadius: 20, aspectRatio: "4/3", background: "#f5f5f5" }} />
    );
  }

  return (
    <div className="v2-fade-up v2-d2" style={{ margin: "16px 20px" }}>
      <style>{`.amap-logo,.amap-copyright,.amap-mcode{display:none!important}`}</style>
      <div ref={mapRef} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 20, overflow: "hidden" }} />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── Utilities ─── */

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

// Shanghai Metro official line colors
const LINE_COLORS: Record<string, string> = {
  "1": "#E4002B", "2": "#97D700", "3": "#FFD100", "4": "#5C2D91",
  "5": "#A855F7", "6": "#E60073", "7": "#FF6900", "8": "#009DDC",
  "9": "#71C5E8", "10": "#C6A4CF", "11": "#872232", "12": "#007A61",
  "13": "#EF95CF", "14": "#827717", "15": "#BCA886", "16": "#32B16C",
  "17": "#BB8C3C", "18": "#D4A843",
};

function getLineColor(display: string): string {
  const match = display.match(/Line (\d+)/);
  if (match && LINE_COLORS[match[1]]) return LINE_COLORS[match[1]];
  return "#007AFF";
}

function parseLineName(raw: string): { display: string } {
  const metroMatch = raw.match(/地铁(\d+)号线/);
  if (metroMatch) return { display: `Line ${metroMatch[1]}` };
  const busMatch = raw.match(/(\d+)路/);
  if (busMatch) return { display: `Bus ${busMatch[1]}` };
  return { display: raw.replace(/\(.*\)/, "").trim() || raw };
}

function parsePolylineStr(str: string | undefined | null): Array<[number, number]> {
  if (!str || typeof str !== "string") return [];
  return str
    .split(";")
    .map((p) => {
      const [lng, lat] = p.split(",").map(Number);
      return [lng, lat] as [number, number];
    })
    .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));
}

function buildRoutePolylines(
  mode: TransportMode,
  transit: TransitRoute | null,
  walking: WalkingRoute | null,
  driving: DrivingRoute | null,
): PolylineData[] {
  const result: PolylineData[] = [];

  if (mode === "metro" && transit) {
    for (const seg of transit.segments) {
      if (!seg.polyline) continue;
      if (seg.type === "walking") {
        result.push({ path: seg.polyline, color: "#9CA3AF", dashed: true });
      } else {
        const lineColor = getLineColor(parseLineName(seg.lineName).display);
        result.push({ path: seg.polyline, color: lineColor });
      }
    }
  } else if (mode === "taxi" && driving?.polyline) {
    result.push({ path: driving.polyline, color: "#4285F4" });
  } else if (mode === "walk" && walking?.polyline) {
    result.push({ path: walking.polyline, color: "#9CA3AF", dashed: true });
  }

  return result;
}
