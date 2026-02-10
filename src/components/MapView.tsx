"use client";

import { useEffect, useRef } from "react";
import { useAMap } from "@/hooks/useAMap";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RoutePolyline = {
  path: Array<[number, number]>; // [lng, lat][]
  color: string;
  dashed?: boolean;
};

export type MapMarker = {
  position: [number, number]; // [lng, lat]
  label: string;
  name: string;
};

type MapViewProps = {
  // Navigation route display
  route?: {
    origin: [number, number];
    destination: [number, number];
    polylines: RoutePolyline[];
  };

  // Place markers display
  markers?: MapMarker[];
  activeMarker?: number;
  onMarkerClick?: (index: number) => void;

  // Layout
  height?: string;
  className?: string;
};

function markerHtml(label: string, active: boolean): string {
  const size = active ? 28 : 22;
  const bg = active ? "#EF4444" : "#2563EB";
  const fontSize = active ? 13 : 11;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.15s">${label}</div>`;
}

export default function MapView({
  route,
  markers,
  activeMarker,
  onMarkerClick,
  height = "200px",
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeOverlaysRef = useRef<any[]>([]);
  const markerOverlaysRef = useRef<any[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const lastMarkersKeyRef = useRef("");

  onMarkerClickRef.current = onMarkerClick;

  const { AMap, loaded, error } = useAMap();

  // Initialize map
  useEffect(() => {
    if (!loaded || !AMap || !containerRef.current || mapRef.current) return;

    mapRef.current = new AMap.Map(containerRef.current, {
      zoom: 13,
      viewMode: "2D",
    });

    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [AMap, loaded]);

  // Draw route polylines + origin/destination markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !AMap || !route) return;

    // Clean previous route overlays
    routeOverlaysRef.current.forEach((o) => map.remove(o));
    routeOverlaysRef.current = [];

    const overlays: any[] = [];

    // Draw polylines
    for (const pl of route.polylines) {
      if (pl.path.length < 2) continue;
      const polyline = new AMap.Polyline({
        path: pl.path.map(([lng, lat]: [number, number]) => new AMap.LngLat(lng, lat)),
        strokeColor: pl.color,
        strokeWeight: pl.dashed ? 3 : 5,
        strokeOpacity: pl.dashed ? 0.6 : 0.85,
        strokeStyle: pl.dashed ? "dashed" : "solid",
        lineJoin: "round",
      });
      map.add(polyline);
      overlays.push(polyline);
    }

    // Origin marker (blue dot)
    const originMarker = new AMap.Marker({
      position: new AMap.LngLat(route.origin[0], route.origin[1]),
      content:
        '<div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
      anchor: "center",
      zIndex: 50,
    });
    map.add(originMarker);
    overlays.push(originMarker);

    // Destination marker (red dot)
    const destMarker = new AMap.Marker({
      position: new AMap.LngLat(route.destination[0], route.destination[1]),
      content:
        '<div style="width:14px;height:14px;border-radius:50%;background:#EF4444;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
      anchor: "center",
      zIndex: 50,
    });
    map.add(destMarker);
    overlays.push(destMarker);

    // Fit to show entire route
    map.setFitView(overlays, false, [30, 30, 30, 30]);

    routeOverlaysRef.current = overlays;

    return () => {
      overlays.forEach((o) => map.remove(o));
      routeOverlaysRef.current = [];
    };
  }, [AMap, route]);

  // Draw place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !AMap) return;

    // Clean previous markers
    markerOverlaysRef.current.forEach((m) => map.remove(m));
    markerOverlaysRef.current = [];

    if (!markers || markers.length === 0) return;

    const newMarkers: any[] = [];
    markers.forEach((m, i) => {
      const isActive = activeMarker === i;
      const marker = new AMap.Marker({
        position: new AMap.LngLat(m.position[0], m.position[1]),
        content: markerHtml(m.label, isActive),
        anchor: "center",
        zIndex: isActive ? 100 : 10,
      });
      marker.on("click", () => onMarkerClickRef.current?.(i));
      map.add(marker);
      newMarkers.push(marker);
    });

    markerOverlaysRef.current = newMarkers;

    // Only fitView when the marker set changes (not on activeMarker change)
    const key = markers.map((m) => m.position.join(",")).join("|");
    if (key !== lastMarkersKeyRef.current) {
      lastMarkersKeyRef.current = key;
      map.setFitView(newMarkers, false, [40, 40, 40, 40]);
    }

    // Pan to active marker
    if (activeMarker != null && markers[activeMarker]) {
      const pos = markers[activeMarker].position;
      map.panTo(new AMap.LngLat(pos[0], pos[1]));
    }

    return () => {
      newMarkers.forEach((m) => map.remove(m));
      markerOverlaysRef.current = [];
    };
  }, [AMap, markers, activeMarker]);

  // Don't render map if no key configured
  if (error) return null;

  if (!loaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-50 ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-gray-400">Loading map...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}
