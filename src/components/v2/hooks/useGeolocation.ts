'use client';

import { useState, useEffect, useRef } from 'react';

const DEFAULT_LOCATION = '121.4737,31.2304'; // People's Square, Shanghai
const DEFAULT_CITY = '上海';

function isInChina(lat: number, lng: number): boolean {
  return lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135;
}

export function useGeolocation() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [isDemo, setIsDemo] = useState(true);
  const [ready, setReady] = useState(false);
  const resolved = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setReady(true);
      return;
    }

    const timeout = setTimeout(() => {
      if (!resolved.current) {
        resolved.current = true;
        setReady(true);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (resolved.current) return;
        resolved.current = true;
        clearTimeout(timeout);
        const { latitude, longitude } = position.coords;
        if (isInChina(latitude, longitude)) {
          const coords = `${longitude},${latitude}`;
          setLocation(coords);
          setIsDemo(false);
          try {
            const res = await fetch('/api/reverse-geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ location: coords }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.city) setCity(data.city);
            }
          } catch { /* use default city */ }
        }
        setReady(true);
      },
      () => {
        if (!resolved.current) {
          resolved.current = true;
          clearTimeout(timeout);
          setReady(true);
        }
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 },
    );

    return () => clearTimeout(timeout);
  }, []);

  return { location, city, isDemo, ready };
}
