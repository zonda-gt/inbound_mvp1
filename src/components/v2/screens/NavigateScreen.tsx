"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNavigation } from "../hooks/useNavigation";
import { useAMap } from "@/hooks/useAMap";
import type { TransitSegment } from "@/lib/amap";

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

  const handleSelectSuggestion = useCallback((name: string) => {
    setSearchQuery(name);
    setLocalDest(name);
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
              onClick={() => handleSelectSuggestion(p.name)}
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

  return (
    <div className="v2-scroll-body">
      {/* 1. Header */}
      <section className="v2-nav-hdr v2-fade-up v2-d1">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button className="v2-nav-back-btn" onClick={handleClear}>←</button>
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

      {/* 2. Mode Toggle */}
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
            <span className="v2-mode-cost">~¥{driving.taxiFare}</span>
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
      />

      {/* 4. Step-by-step */}
      {activeMode === "metro" && transit && (
        <section className="v2-steps-wrap v2-fade-up v2-d2">
          <h2 className="v2-steps-title">Step-by-step</h2>
          {transit.segments.map((seg, i) => (
            <StepItem key={i} segment={seg} isLast={i === transit.segments.length - 1} />
          ))}
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ arrive">📍</div>
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Arrive at {data.destination.name}</p>
              <p className="v2-step-detail">{data.destination.address}</p>
            </div>
          </div>
        </section>
      )}

      {activeMode === "walk" && walking && (
        <section className="v2-steps-wrap v2-fade-up v2-d2">
          <h2 className="v2-steps-title">Walking directions</h2>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ walk">🚶</div>
              <div className="v2-step-conn" />
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Walk {formatDistance(walking.distance)} to {data.destination.name}</p>
              <p className="v2-step-detail">Estimated {walking.duration} min</p>
              <span className="v2-step-tag walk">↑ {formatDistance(walking.distance)}</span>
            </div>
          </div>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ arrive">📍</div>
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Arrive at {data.destination.name}</p>
              <p className="v2-step-detail">{data.destination.address}</p>
            </div>
          </div>
        </section>
      )}

      {activeMode === "taxi" && driving && (
        <section className="v2-steps-wrap v2-fade-up v2-d2">
          <h2 className="v2-steps-title">Taxi ride</h2>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ" style={{ background: "#FFA500" }}>🚕</div>
              <div className="v2-step-conn" />
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Ride {formatDistance(driving.distance)} to {data.destination.name}</p>
              <p className="v2-step-detail">~{driving.duration} min · Estimated fare ¥{driving.taxiFare}</p>
              <span className="v2-step-tag" style={{ background: "rgba(255,165,0,.1)", color: "#cc8400" }}>🚕 {formatDistance(driving.distance)}</span>
            </div>
          </div>
          <div className="v2-step">
            <div className="v2-step-ind">
              <div className="v2-step-circ arrive">📍</div>
            </div>
            <div className="v2-step-body">
              <p className="v2-step-action">Arrive at {data.destination.name}</p>
              <p className="v2-step-detail">{data.destination.address}</p>
            </div>
          </div>
        </section>
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

      {/* 6. Taxi Card */}
      <div className="v2-taxi-card v2-fade-up v2-d3">
        <p className="v2-taxi-card-title">🚕 Show this to your taxi driver</p>
        <p className="v2-taxi-cn">{data.destination.name}</p>
        <p className="v2-taxi-en">{data.destination.address}</p>
        <div className="v2-taxi-copy">
          <button className="v2-taxi-copy-btn primary" onClick={handleCopyAddress}>📋 Copy address</button>
          <button
            className="v2-taxi-copy-btn"
            onClick={() => {
              const dest = encodeURIComponent(data.destination.name);
              window.open(`https://uri.amap.com/search?keyword=${dest}&callnative=1`, "_blank");
            }}
          >
            📱 Open in Maps
          </button>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="v2-nav-acts v2-fade-up v2-d4">
        <button
          className="v2-btn-big-red"
          onClick={() => {
            const [lng, lat] = data.destination.location.split(",");
            window.open(`https://common.diditaxi.com.cn/general/webEntry?sLat=&sLng=&dLat=${lat}&dLng=${lng}&dName=${encodeURIComponent(data.destination.name)}`, "_blank");
          }}
        >
          🚕 Book DiDi Taxi
        </button>
        <button className="v2-btn-big-ghost" onClick={handleClear}>🔍 New search</button>
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
          <div className="v2-step-circ walk">🚶</div>
          {!isLast && <div className="v2-step-conn" />}
        </div>
        <div className="v2-step-body">
          <p className="v2-step-action">Walk {formatDistance(segment.distance)}</p>
          <p className="v2-step-detail">~{segment.duration} min</p>
          <span className="v2-step-tag walk">↑ {formatDistance(segment.distance)}</span>
        </div>
      </div>
    );
  }

  const lineInfo = parseLineName(segment.lineName);
  return (
    <div className="v2-step">
      <div className="v2-step-ind">
        <div className="v2-step-circ metro">🚇</div>
        {!isLast && <div className="v2-step-conn" />}
      </div>
      <div className="v2-step-body">
        <p className="v2-step-action">
          Take {lineInfo.display} → {segment.direction || segment.arrivalStop} direction
        </p>
        <p className="v2-step-detail">
          Board at {segment.departureStop}, ride {segment.stopCount} stop{segment.stopCount !== 1 ? "s" : ""} to {segment.arrivalStop}
        </p>
        <span className="v2-step-tag metro">{lineInfo.display} · {segment.stopCount} stop{segment.stopCount !== 1 ? "s" : ""}</span>
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

    // Marker: blue glowing dot for real GPS, black circle for demo
    const markerHtml = isDemo
      ? `<div style="width:28px;height:28px;background:#222;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35)">
          <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
        </div>`
      : `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:0;background:rgba(66,133,244,0.15);border-radius:50%;animation:v2-gps-pulse 2s ease-out infinite"></div>
          <div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,.6);position:relative;z-index:1"></div>
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

function RouteMap({ originLocation, destLocation, destName, isDemo }: {
  originLocation: string; destLocation: string; destName: string; isDemo: boolean;
}) {
  const { AMap, loaded } = useAMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    if (!loaded || !AMap || !mapRef.current) return;
    if (mapInst.current) return;

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

    // Origin marker: blue dot (real GPS) or black circle (demo)
    const originHtml = isDemo
      ? `<div style="width:28px;height:28px;background:#222;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35)">
          <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
        </div>`
      : `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:0;background:rgba(66,133,244,0.15);border-radius:50%;animation:v2-gps-pulse 2s ease-out infinite"></div>
          <div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,.6);position:relative;z-index:1"></div>
        </div>`;
    const oMarker = document.createElement("div");
    oMarker.innerHTML = originHtml;
    new AMap.Marker({ position: [oLng, oLat], content: oMarker, anchor: "center", map });

    // Destination marker: red pin with label
    const dMarker = document.createElement("div");
    dMarker.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:32px;height:32px;background:#D0021B;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(208,2,27,.4);border:3px solid #fff">
        <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
      </div>
      <div style="margin-top:4px;font-size:12px;font-weight:700;color:#222;white-space:nowrap;font-family:'Inter',-apple-system,sans-serif;text-shadow:0 0 4px #fff,0 0 4px #fff">${destName}</div>
    </div>`;
    new AMap.Marker({ position: [dLng, dLat], content: dMarker, anchor: "center", map });

    // Fit both markers in view
    map.setFitView(null, false, [60, 60, 60, 60]);

    mapInst.current = map;
    return () => { map.destroy(); mapInst.current = null; };
  }, [loaded, AMap, originLocation, destLocation, destName, isDemo]);

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

function parseLineName(raw: string): { display: string } {
  const metroMatch = raw.match(/地铁(\d+)号线/);
  if (metroMatch) return { display: `Line ${metroMatch[1]}` };
  const busMatch = raw.match(/(\d+)路/);
  if (busMatch) return { display: `Bus ${busMatch[1]}` };
  return { display: raw.replace(/\(.*\)/, "").trim() || raw };
}
