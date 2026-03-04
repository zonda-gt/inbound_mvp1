'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ALL_EAT_RESTAURANTS, type EatRestaurant, type EatCategory } from '../data/eat-restaurants';
import { enrichRestaurantsFromDb } from '../data/fetch-restaurant-images';

const TABS: { id: EatCategory; label: string }[] = [
  { id: 'chinese', label: 'Chinese' },
  { id: 'asian', label: 'Asian' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'western', label: 'Western' },
  { id: 'bars', label: 'Bars' },
];

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

interface EatCategoryScreenProps {
  categoryId: EatCategory;
  onNavigate: (screen: string) => void;
}

export default function EatCategoryScreen({ categoryId, onNavigate }: EatCategoryScreenProps) {
  const [activeTab, setActiveTab] = useState<EatCategory>(categoryId);
  const [allRestaurants, setAllRestaurants] = useState<EatRestaurant[]>(ALL_EAT_RESTAURANTS);

  // Enrich with Supabase data (images, slugs, verdicts)
  useEffect(() => {
    enrichRestaurantsFromDb(ALL_EAT_RESTAURANTS).then(setAllRestaurants);
  }, []);

  // Filter by active tab
  const filtered = useMemo(
    () => allRestaurants.filter((r) => r.category === activeTab),
    [allRestaurants, activeTab]
  );

  // Counts per tab
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of allRestaurants) {
      c[r.category] = (c[r.category] || 0) + 1;
    }
    return c;
  }, [allRestaurants]);

  return (
    <div className="v2-scroll-body">
      {/* Header */}
      <div className="v2-eat-header">
        <button className="v2-eat-back" onClick={() => onNavigate('eat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="v2-eat-header-text">
          <h1 className="v2-eat-title">All Restaurants</h1>
          <p className="v2-eat-subtitle">{filtered.length} places</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="v2-eat-tabs-wrap">
        <div className="v2-eat-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`v2-eat-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="v2-eat-tab-count">{counts[tab.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Rows */}
      <div className="v2-eatcat-list">
        {filtered.map((r) => (
          <RestaurantRow key={r.name_cn} restaurant={r} />
        ))}
      </div>

      <div className="v2-sh-bottom-pad" />
    </div>
  );
}

/* ─── Restaurant Row ─── */

function RestaurantRow({ restaurant: r }: { restaurant: EatRestaurant }) {
  const [saved, setSaved] = useState(false);
  const images = r.images?.length ? r.images : r.image ? [r.image] : [];

  const inner = (
    <div className="v2-eatcat-row">
      {/* Photo scroll */}
      <div className="v2-eatcat-photos">
        {images.length > 0 ? (
          images.map((img, i) => (
            <div key={i} className="v2-eatcat-photo-wrap">
              <SmoothImage className="v2-eatcat-photo" src={img} alt={`${r.name_en} photo ${i + 1}`} />
            </div>
          ))
        ) : (
          <div className="v2-eatcat-photo-wrap">
            <div className="v2-eatcat-photo v2-eatcat-photo-placeholder">🍽️</div>
          </div>
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

      {/* Info */}
      <div className="v2-eatcat-info">
        <div className="v2-eatcat-name-row">
          <div className="v2-eatcat-name">{r.name_en}</div>
          {r.rating != null && <div className="v2-eatcat-rating">★ {r.rating}</div>}
        </div>
        <div className="v2-eatcat-meta">
          {r.price_cny != null && <span>¥{r.price_cny}/pp</span>}
        </div>
        {r.cuisine_label && <div className="v2-eatcat-cuisine">{r.cuisine_label}</div>}
        {r.verdict && <div className="v2-eatcat-verdict">{r.verdict}</div>}
      </div>
    </div>
  );

  if (!r.slug) return <div style={{ cursor: 'pointer' }}>{inner}</div>;
  return <a href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</a>;
}
