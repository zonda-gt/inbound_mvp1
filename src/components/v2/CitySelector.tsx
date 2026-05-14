'use client';

import { CITY_OPTIONS, type CityKey } from './hooks/useActiveCity';
import { track } from '@/lib/analytics';

interface CitySelectorProps {
  city: CityKey;
  onChange: (next: CityKey) => void;
}

export default function CitySelector({ city, onChange }: CitySelectorProps) {
  return (
    <div className="v2-city-selector" role="tablist" aria-label="City">
      {CITY_OPTIONS.map((opt) => {
        const active = opt.key === city;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={`v2-city-chip ${active ? 'active' : ''}`}
            onClick={() => {
              if (active) return;
              track('city_switched', { from: city, to: opt.key });
              onChange(opt.key);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
