'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ALL_EAT_RESTAURANTS, type EatRestaurant, type EatCategory } from '../data/eat-restaurants';
import { enrichRestaurantsFromDb } from '../data/fetch-restaurant-images';

/* ─── Types ─── */

type MoodFilter = 'quick_bite' | 'date_night' | 'group' | 'local_fav' | 'vegetarian' | 'halal' | 'late_night';

/* ─── Constants ─── */

const SECTIONS: { id: EatCategory; title: string; subtitle: string }[] = [
  { id: 'chinese', title: 'Chinese', subtitle: 'Shanghainese, Sichuan, Cantonese & more' },
  { id: 'asian', title: 'Asian', subtitle: 'Japanese, Korean, Thai & SE Asian' },
  { id: 'middle_eastern', title: 'Middle Eastern', subtitle: 'Lebanese, Turkish, Indian & Mediterranean' },
  { id: 'western', title: 'Western', subtitle: 'American, European, Brazilian & Mexican' },
  { id: 'bars', title: 'Bars & Lounges', subtitle: 'Cocktails, speakeasies & late night' },
];

const MOOD_FILTERS: { id: MoodFilter; label: string; emoji: string }[] = [
  { id: 'quick_bite', label: 'Quick Bite', emoji: '⚡' },
  { id: 'date_night', label: 'Date Night', emoji: '🕯️' },
  { id: 'group', label: 'Group Dinner', emoji: '👥' },
  { id: 'local_fav', label: 'Local Favorite', emoji: '❤️‍🔥' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🌿' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'late_night', label: 'Late Night', emoji: '🌙' },
];

/* ─── Mood filter logic ─── */

function matchesMood(r: EatRestaurant, mood: MoodFilter): boolean {
  const text = r.cuisine_label.toLowerCase();

  switch (mood) {
    case 'quick_bite':
      return r.price_cny != null && r.price_cny <= 80;
    case 'date_night':
      return (r.price_cny != null && r.price_cny >= 200) || text.includes('fine dining') || text.includes('tasting');
    case 'group':
      return text.includes('hot pot') || text.includes('hotpot') || text.includes('bbq') || text.includes('churrascaria') || text.includes('steamboat');
    case 'local_fav':
      return r.rating != null && r.rating >= 4.7;
    case 'vegetarian':
      return text.includes('vegan') || text.includes('vegetarian') || text.includes('buddhist') || text.includes('plant-based');
    case 'halal':
      return text.includes('halal') || text.includes('muslim') || text.includes('xinjiang') || text.includes('uyghur') || text.includes('ningxia');
    case 'late_night':
      return r.category === 'bars';
    default:
      return true;
  }
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
  const [activeMoods, setActiveMoods] = useState<Set<MoodFilter>>(new Set());

  // Enrich static data with images/slugs/verdicts from Supabase
  useEffect(() => {
    enrichRestaurantsFromDb(ALL_EAT_RESTAURANTS).then(setRestaurants);
  }, []);

  const toggleMood = useCallback((mood: MoodFilter) => {
    setActiveMoods((prev) => {
      const next = new Set(prev);
      if (next.has(mood)) next.delete(mood);
      else next.add(mood);
      return next;
    });
  }, []);

  // Group by category, applying mood filters
  const grouped = useMemo(() => {
    let list = restaurants;
    if (activeMoods.size > 0) {
      list = list.filter((r) =>
        Array.from(activeMoods).every((mood) => matchesMood(r, mood))
      );
    }
    const map = new Map<EatCategory, EatRestaurant[]>();
    for (const r of list) {
      const arr = map.get(r.category) || [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [restaurants, activeMoods]);

  return (
    <div className="v2-scroll-body">
      {/* Header */}
      <div className="v2-eat-header">
        <button className="v2-eat-back" onClick={() => onNavigate('discover')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="v2-eat-header-text">
          <h1 className="v2-eat-title">Where to Eat</h1>
          <p className="v2-eat-subtitle">{restaurants.length} curated restaurants in Shanghai</p>
        </div>
      </div>

      {/* Mood Chips */}
      <div className="v2-eat-moods">
        <div className="v2-eat-moods-scroll">
          {MOOD_FILTERS.map((mood) => (
            <button
              key={mood.id}
              className={`v2-eat-mood-chip ${activeMoods.has(mood.id) ? 'active' : ''}`}
              onClick={() => toggleMood(mood.id)}
            >
              <span className="v2-eat-mood-emoji">{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {activeMoods.size > 0 && (
        <div className="v2-eat-results-meta">
          <span>{Array.from(grouped.values()).reduce((a, b) => a + b.length, 0)} restaurants</span>
          <button className="v2-eat-clear-filters" onClick={() => setActiveMoods(new Set())}>
            Clear filters
          </button>
        </div>
      )}

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
              <div className="v2-sh-hscroll">
                {items.map((r) => (
                  <FoodCard key={r.name_cn} restaurant={r} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state when all sections filtered out */}
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
