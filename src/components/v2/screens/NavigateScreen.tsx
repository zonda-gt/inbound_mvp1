"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNavigation } from "../hooks/useNavigation";
import { useAMap } from "@/hooks/useAMap";
import type { TransitSegment, TransitRoute, WalkingRoute, DrivingRoute } from "@/lib/amap";

export type NavigateDestination = {
  name: string;
  chineseName?: string;
  address?: string;
  location?: string;
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

  const { location: gpsLocation, city, isDemo } = useGeolocation();

  // Use external destination if provided, otherwise local search
  const activeDest = externalDest?.name || localDest;
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
    setLocalDest(q);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback((name: string, cn?: string) => {
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
        <section className="v2-nav-hdr v2-fade-up v2-d1">
          <h1 className="v2-nav-hdr-title">Getting There</h1>
          <div className="v2-route-card">
            <div className="v2-route-row">
              <span className="v2-route-dot o" />
              <span className="v2-route-lbl">From</span>
              <span className="v2-route-val">{isDemo ? "People's Square (Demo)" : "Your Location"}</span>
            </div>
            <div className="v2-route-line-v" />
            <div className="v2-route-row">
              <span className="v2-route-dot d" />
              <span className="v2-route-lbl">To</span>
              <span className="v2-route-val">{activeDest}</span>
            </div>
          </div>
        </section>
        <div className="v2-nav-loading v2-fade-up v2-d2">
          <div className="v2-nav-skel" style={{ height: 80, marginBottom: 16 }} />
          <div className="v2-nav-skel" style={{ height: 140, marginBottom: 16 }} />
          <div className="v2-nav-skel" style={{ height: 200 }} />
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

  // Build polylines for the active mode
  const routePolylines = buildRoutePolylines(activeMode, transit, walking, driving);

  return (
    <div className="v2-scroll-body">
      {/* 1. Header */}
      <section className="v2-nav-hdr v2-fade-up v2-d1">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button className="v2-nav-back-btn" onClick={() => { if (referrer) { window.location.href = referrer; } else { handleClear(); } }}>←</button>
          <h1 className="v2-nav-hdr-title" style={{ margin: 0 }}>Getting There</h1>
        </div>

        <div className="v2-route-card">
          <div className="v2-route-row">
            <span className="v2-route-dot o" />
            <span className="v2-route-lbl">From</span>
            <span className="v2-route-val">{isDemo ? "People's Square (Demo)" : "Your Location"}</span>
          </div>
          <div className="v2-route-line-v" />
          <div className="v2-route-row">
            <span className="v2-route-dot d" />
            <span className="v2-route-lbl">To</span>
            <span className="v2-route-val">{data.destination.name}</span>
          </div>
        </div>
      </section>

      {/* 2. Mode Toggle — iOS segmented control */}
      <div className="v2-mode-toggle v2-fade-up v2-d1">
        {transit && (
          <button
            className={`v2-mode-btn${activeMode === "metro" ? " active" : ""}`}
            onClick={() => setActiveMode("metro")}
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
            onClick={() => setActiveMode("taxi")}
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
            onClick={() => setActiveMode("walk")}
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
        destName={data.destination.name}
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
              const dest = encodeURIComponent(data.destination.name);
              window.open(`https://uri.amap.com/search?keyword=${dest}&callnative=1`, "_blank");
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1.5C6.41 1.5 3.5 4.41 3.5 8c0 1.74.72 3.6 1.88 5.25C6.76 15.24 8.64 16.95 10 18.5c1.36-1.55 3.24-3.26 4.62-5.25C15.78 11.6 16.5 9.74 16.5 8c0-3.59-2.91-6.5-6.5-6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="10" cy="8" r="2.25" fill="currentColor"/>
            </svg>
            Open in Amap
          </button>
          <button
            className="v2-nav-cta v2-nav-cta--secondary"
            onClick={() => {
              const [lng, lat] = data.destination.location.split(",");
              window.open(`https://common.diditaxi.com.cn/general/webEntry?sLat=&sLng=&dLat=${lat}&dLng=${lng}&dName=${encodeURIComponent(data.destination.name)}`, "_blank");
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
