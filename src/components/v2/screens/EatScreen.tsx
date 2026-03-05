'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ALL_EAT_RESTAURANTS, type EatRestaurant, type EatCategory } from '../data/eat-restaurants';
import { enrichRestaurantsFromDb } from '../data/fetch-restaurant-images';

/* ─── Constants ─── */

const SECTIONS: { id: EatCategory; title: string; subtitle: string }[] = [
  { id: 'chinese', title: 'Chinese', subtitle: 'Shanghainese, Sichuan, Cantonese & more' },
  { id: 'asian', title: 'Asian', subtitle: 'Japanese, Korean, Thai & SE Asian' },
  { id: 'middle_eastern', title: 'Middle Eastern', subtitle: 'Lebanese, Turkish, Indian & Mediterranean' },
  { id: 'western', title: 'Western', subtitle: 'American, European, Brazilian & Mexican' },
  { id: 'bars', title: 'Bars & Lounges', subtitle: 'Cocktails, speakeasies & late night' },
];

const CUISINE_CHIPS: { id: string; label: string; emoji: string }[] = [
  { id: 'all',           label: 'All',           emoji: '✨' },
  { id: 'chinese',       label: 'Chinese',        emoji: '🥢' },
  { id: 'asian',         label: 'Asian',          emoji: '🍱' },
  { id: 'middle_eastern',label: 'Middle Eastern', emoji: '🌯' },
  { id: 'western',       label: 'Western',        emoji: '🍔' },
  { id: 'bars',          label: 'Bars',           emoji: '🍸' },
  { id: 'vegetarian',    label: 'Vegetarian',     emoji: '🌿' },
  { id: 'halal',         label: 'Halal',          emoji: '☪️' },
];

function matchesDietary(r: EatRestaurant, filter: string): boolean {
  const text = r.cuisine_label.toLowerCase();
  if (filter === 'vegetarian') return text.includes('vegan') || text.includes('vegetarian') || text.includes('buddhist') || text.includes('plant-based');
  if (filter === 'halal') return text.includes('halal') || text.includes('muslim') || text.includes('xinjiang') || text.includes('uyghur') || text.includes('ningxia');
  return true;
}

/* ─── SmoothImage ─── */

function SmoothImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <>
      <div className={`v2-img-skel ${loaded ? 'loaded' : ''}`} aria-hidden="true" />
      <img
        ref={imgRef}
        className={`${className} v2-lazy-img ${loaded ? 'loaded' : ''}`}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

/* ─── Main Component ─── */

interface EatScreenProps {
  onNavigate: (screen: string) => void;
}

export default function EatScreen({ onNavigate }: EatScreenProps) {
  const [restaurants, setRestaurants] = useState<EatRestaurant[]>(ALL_EAT_RESTAURANTS);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    enrichRestaurantsFromDb(ALL_EAT_RESTAURANTS).then(setRestaurants);
  }, []);

  const grouped = useMemo(() => {
    const isDietary = activeFilter === 'vegetarian' || activeFilter === 'halal';
    const isCuisine = activeFilter !== 'all' && !isDietary;

    let list = restaurants;
    if (isDietary) list = list.filter((r) => matchesDietary(r, activeFilter));
    if (isCuisine) list = list.filter((r) => r.category === activeFilter);

    const map = new Map<EatCategory, EatRestaurant[]>();
    for (const r of list) {
      const arr = map.get(r.category) || [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [restaurants, activeFilter]);

  return (
    <div className="v2-scroll-body">
      {/* Airbnb-style sticky top bar */}
      <div className="v2-sha-sticky-bar">
        <div className="v2-sha-pill">
          <span className="v2-sha-pill-icon">🔍</span>
          <span>Start your search</span>
        </div>
        <div className="v2-sha-tabs">
          {[
            { id: 'eat',        emoji: '🍜', label: 'Eat',        isNew: false },
            { id: 'experience', emoji: '🎡', label: 'Experience',  isNew: false },
            { id: 'drink',      emoji: '🍸', label: 'Drink',       isNew: true  },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`v2-sha-tab ${tab.id === 'eat' ? 'active' : ''}`}
              onClick={() => { if (tab.id === 'experience') onNavigate('shanghai-all'); }}
            >
              <div className="v2-sha-tab-icon-wrap">
                <span className="v2-sha-tab-icon">{tab.emoji}</span>
                {tab.isNew && <span className="v2-sha-tab-new">NEW</span>}
              </div>
              <span className="v2-sha-tab-label">{tab.label}</span>
              <div className="v2-sha-tab-bar" />
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine / Dietary Chips */}
      <div className="v2-eat-moods v2-eat-moods--below-bar">
        <div className="v2-eat-moods-scroll">
          {CUISINE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              className={`v2-eat-mood-chip ${activeFilter === chip.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(chip.id)}
            >
              <span className="v2-eat-mood-emoji">{chip.emoji}</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      {SECTIONS.map((section) => {
        const items = grouped.get(section.id);
        if (!items || items.length === 0) return null;
        return (
          <div key={section.id}>
            <div className="v2-sh-section" style={{ paddingBottom: 0 }}>
              <div className="v2-sh-section-hdr">
                <div>
                  <div className="v2-sh-section-title">{section.title}</div>
                  <div className="v2-sh-section-sub">{section.subtitle}</div>
                </div>
                <div className="v2-sh-see-all" onClick={() => onNavigate(`eat-${section.id}`)}>See all {items.length} &rarr;</div>
              </div>
              <div className="v2-eat-grid">
                {items.map((r) => (
                  <FoodCard key={r.name_cn} restaurant={r} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {Array.from(grouped.values()).every((arr) => arr.length === 0) && (
        <div className="v2-eat-empty" style={{ padding: '80px 20px' }}>
          <div className="v2-eat-empty-emoji">🍽️</div>
          <div className="v2-eat-empty-text">No restaurants match your filters</div>
        </div>
      )}

      <div className="v2-sh-bottom-pad" />
    </div>
  );
}

/* ─── Food Card (matching "What locals are eating" style) ─── */

function FoodCard({ restaurant: r }: { restaurant: EatRestaurant }) {
  const [saved, setSaved] = useState(false);

  const card = (
    <div className="v2-sh-food-card">
      <div className="v2-sh-food-img-wrap">
        {r.image ? (
          <SmoothImage className="v2-sh-food-img" src={r.image} alt={r.name_en} />
        ) : (
          <div className="v2-sh-food-img v2-sh-food-img-placeholder">🍽️</div>
        )}
        <button
          className="v2-sh-food-fav"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <svg viewBox="0 0 32 32" width="26" height="26" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>
      <div className="v2-sh-food-body">
        <div className="v2-sh-food-row">
          <div className="v2-sh-food-name">{r.name_en}</div>
          {r.rating != null && <div className="v2-sh-food-rating">★ {r.rating}</div>}
        </div>
        {r.hook && <div className="v2-sh-food-hook">{r.hook}</div>}
        <div className="v2-sh-food-meta">
          {r.price_cny != null && <span className="v2-sh-food-price">¥{r.price_cny}/pp</span>}
        </div>
        {r.cuisine_label && <div className="v2-sh-food-cuisine">{r.cuisine_label}</div>}
      </div>
    </div>
  );

  if (!r.slug) return <div style={{ cursor: 'pointer' }}>{card}</div>;
  return <a href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</a>;
}
