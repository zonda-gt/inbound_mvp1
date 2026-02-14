"use client";

import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

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

  // User location
  userLocation?: [number, number]; // [lng, lat]
  isApproximateLocation?: boolean;

  // Layout
  height?: string;
  className?: string;
};

export default function MapView({
  route,
  markers,
  activeMarker,
  onMarkerClick,
  userLocation,
  isApproximateLocation = false,
  height = "200px",
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const markerOverlaysRef = useRef<any[]>([]);
  const userOverlaysRef = useRef<any[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const lastMarkersKeyRef = useRef("");

  onMarkerClickRef.current = onMarkerClick;

  const { maps, loaded, error } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!loaded || !maps || !containerRef.current || mapRef.current) return;

    mapRef.current = new maps.Map(containerRef.current, {
      zoom: 13,
      center: { lat: 35.6895, lng: 139.6917 }, // Tokyo default
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });

    return () => {
      mapRef.current = null;
    };
  }, [maps, loaded]);

  // Draw route polylines + origin/destination markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !maps || !route) return;

    // Clean previous overlays
    overlaysRef.current.forEach((o) => {
      if (o.setMap) o.setMap(null);
    });
    overlaysRef.current = [];

    const bounds = new maps.LatLngBounds();
    const overlays: any[] = [];

    // Draw polylines
    for (const pl of route.polylines) {
      if (pl.path.length < 2) continue;
      const path = pl.path.map(([lng, lat]) => ({ lat, lng }));
      const polyline = new maps.Polyline({
        path,
        strokeColor: pl.color,
        strokeWeight: pl.dashed ? 3 : 5,
        strokeOpacity: pl.dashed ? 0.6 : 0.85,
        map,
      });
      if (pl.dashed) {
        polyline.setOptions({
          strokeOpacity: 0,
          icons: [{
            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.6, scale: 3, strokeColor: pl.color },
            offset: "0",
            repeat: "15px",
          }],
        });
      }
      path.forEach((p: any) => bounds.extend(p));
      overlays.push(polyline);
    }

    // Origin marker (blue dot)
    const originMarker = new maps.Marker({
      position: { lat: route.origin[1], lng: route.origin[0] },
      map,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#2563EB",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 3,
      },
      zIndex: 50,
    });
    bounds.extend(originMarker.getPosition());
    overlays.push(originMarker);

    // Destination marker (red dot)
    const destMarker = new maps.Marker({
      position: { lat: route.destination[1], lng: route.destination[0] },
      map,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#EF4444",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 3,
      },
      zIndex: 50,
    });
    bounds.extend(destMarker.getPosition());
    overlays.push(destMarker);

    map.fitBounds(bounds, 30);
    overlaysRef.current = overlays;

    return () => {
      overlays.forEach((o) => { if (o.setMap) o.setMap(null); });
      overlaysRef.current = [];
    };
  }, [maps, route]);

  // Draw place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !maps) return;

    // Clean previous markers
    markerOverlaysRef.current.forEach((m) => { if (m.setMap) m.setMap(null); });
    markerOverlaysRef.current = [];

    if (!markers || markers.length === 0) return;

    const bounds = new maps.LatLngBounds();
    const newMarkers: any[] = [];

    markers.forEach((m, i) => {
      const isActive = activeMarker === i;
      const marker = new maps.Marker({
        position: { lat: m.position[1], lng: m.position[0] },
        map,
        label: {
          text: m.label,
          color: "white",
          fontSize: isActive ? "13px" : "11px",
          fontWeight: "700",
        },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: isActive ? 14 : 11,
          fillColor: isActive ? "#EF4444" : "#2563EB",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        zIndex: isActive ? 100 : 10,
      });
      marker.addListener("click", () => onMarkerClickRef.current?.(i));
      bounds.extend(marker.getPosition());
      newMarkers.push(marker);
    });

    markerOverlaysRef.current = newMarkers;

    // Only fitBounds when the marker set changes
    const key = markers.map((m) => m.position.join(",")).join("|");
    if (key !== lastMarkersKeyRef.current) {
      lastMarkersKeyRef.current = key;
      map.fitBounds(bounds, 40);
    }

    // Pan to active marker
    if (activeMarker != null && markers[activeMarker]) {
      const pos = markers[activeMarker].position;
      map.panTo({ lat: pos[1], lng: pos[0] });
    }

    return () => {
      newMarkers.forEach((m) => { if (m.setMap) m.setMap(null); });
      markerOverlaysRef.current = [];
    };
  }, [maps, markers, activeMarker]);

  // Draw user location blue dot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !maps || !userLocation) return;

    userOverlaysRef.current.forEach((o) => { if (o.setMap) o.setMap(null); });
    userOverlaysRef.current = [];

    const overlays: any[] = [];

    // Blue pulsing dot
    const blueDot = new maps.Marker({
      position: { lat: userLocation[1], lng: userLocation[0] },
      map,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#2563EB",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 3,
      },
      zIndex: 100,
    });
    overlays.push(blueDot);

    // Approximate location label
    if (isApproximateLocation) {
      const infoWindow = new maps.InfoWindow({
        content: '<div style="font-size:10px;color:#6B7280;padding:2px">Approximate location</div>',
        disableAutoPan: true,
      });
      infoWindow.open(map, blueDot);
      overlays.push(infoWindow);
    }

    userOverlaysRef.current = overlays;

    return () => {
      overlays.forEach((o) => {
        if (o.setMap) o.setMap(null);
        if (o.close) o.close();
      });
      userOverlaysRef.current = [];
    };
  }, [maps, userLocation, isApproximateLocation]);

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
