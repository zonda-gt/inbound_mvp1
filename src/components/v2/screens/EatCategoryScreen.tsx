'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { savePlace, unsavePlace } from '@/lib/saved-places';
import { ALL_EAT_RESTAURANTS, type EatRestaurant, type EatCategory } from '../data/eat-restaurants';
import { enrichRestaurantsFromDb } from '../data/fetch-restaurant-images';
import { track } from '@/lib/analytics';
import SaveSheet from '../SaveSheet';

const supabase = getSupabaseBrowserClient();

const EAT_TABS: { id: EatCategory; label: string }[] = [
  { id: 'chinese', label: 'Chinese' },
  { id: 'asian', label: 'Asian' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'western', label: 'Western' },
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
  topTab?: 'eat' | 'drink';
  onSearchOpen?: () => void;
}

export default function EatCategoryScreen({ categoryId, onNavigate, topTab = 'eat', onSearchOpen }: EatCategoryScreenProps) {
  const [activeTab, setActiveTab] = useState<EatCategory>(categoryId);
  const [allRestaurants, setAllRestaurants] = useState<EatRestaurant[]>(ALL_EAT_RESTAURANTS);
  const [compact, setCompact] = useState(false);

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
    <div className="v2-scroll-body" onScroll={(e) => { const shouldCompact = e.currentTarget.scrollTop > 30; if (shouldCompact !== compact) setCompact(shouldCompact); }}>
      {/* Airbnb-style sticky top bar */}
      <div className={`v2-sha-sticky-bar${compact ? ' v2-sha-sticky-bar--compact' : ''}`}>
        <div className="v2-sha-pill" onClick={() => onSearchOpen?.()}>
          <span className="v2-sha-pill-icon">🔍</span>
          <span>Start your search</span>
        </div>
        <div className="v2-sha-tabs">
          {[
            { id: 'eat',        emoji: '🍜', label: 'Eat',       isNew: false },
            { id: 'experience', emoji: '🎡', label: 'Experience', isNew: false },
            { id: 'drink',      emoji: '🍸', label: 'Drink',      isNew: true  },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`v2-sha-tab ${tab.id === topTab ? 'active' : ''}`}
              onClick={() => {
                if (tab.id === 'eat') onNavigate('eat');
                if (tab.id === 'experience') onNavigate('shanghai-all');
                if (tab.id === 'drink') onNavigate('drink');
              }}
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

        {/* Category Tabs — inside sticky bar, hidden on Drink screen */}
        {topTab === 'eat' && (
          <div className="v2-eat-tabs-wrap" style={{ position: 'static' }}>
            <div className="v2-eat-tabs">
              {EAT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`v2-eat-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => { track('filter_tapped', { filter: tab.id, tab: 'eat' }); setActiveTab(tab.id); }}
                >
                  {tab.label}
                  <span className="v2-eat-tab-count">{counts[tab.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const images = r.images?.length ? r.images : r.image ? [r.image] : [];

  useEffect(() => {
    if (!r.slug) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const { data: rows } = await supabase.from('saved_places').select('id').eq('place_slug', r.slug).eq('place_type', 'restaurant').limit(1);
      if (rows && rows.length > 0) setSaved(true);
    })();
  }, [r.slug]);

  async function handleFav(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setShowSaveSheet(true); return; }
    const wasSaved = saved;
    setSaved((s) => !s);
    if (wasSaved) { unsavePlace(supabase, 'restaurant', r.slug || ''); }
    else { savePlace(supabase, { place_type: 'restaurant', place_slug: r.slug || '', place_name: r.name_en, place_image: images[0] || undefined }); }
  }

  const inner = (
    <div className="v2-eatcat-row">
      <SaveSheet
        isOpen={showSaveSheet}
        placeName={r.name_en}
        onClose={() => setShowSaveSheet(false)}
        onLoggedIn={() => { setShowSaveSheet(false); setSaved(true); }}
      />
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
      </div>

      {/* Info */}
      <div className="v2-eatcat-info">
        <div className="v2-eatcat-name-row">
          <div className="v2-eatcat-name">{r.name_en}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.rating != null && <div className="v2-eatcat-rating">★ {r.rating}</div>}
            <button
              className="v2-eatcat-fav"
              onClick={handleFav}
              aria-label={saved ? 'Unsave' : 'Save'}
            >
              <svg viewBox="0 0 32 32" width="20" height="20" fill={saved ? '#FF385C' : 'none'} stroke={saved ? '#FF385C' : '#717171'} strokeWidth="2.5">
                <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
              </svg>
            </button>
          </div>
        </div>
        {r.hook && <div className="v2-eatcat-hook">{r.hook}</div>}
        <div className="v2-eatcat-meta">
          {r.price_cny != null && <span>¥{r.price_cny}/pp</span>}
        </div>
        {r.cuisine_label && <div className="v2-eatcat-cuisine">{r.cuisine_label}</div>}
      </div>
    </div>
  );

  if (!r.slug) return <div style={{ cursor: 'pointer' }}>{inner}</div>;
  return <a href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</a>;
}
