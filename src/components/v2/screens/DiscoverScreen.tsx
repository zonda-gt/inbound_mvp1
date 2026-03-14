'use client';

import { useState, useEffect, useMemo, useCallback, ViewTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getTimeAwareMessage } from '../data/discover-data';
import { COLLECTION_LIST } from '../data/collections-data';
import { useCollectionData } from '../hooks/useCollectionData';
import { ALL_EAT_RESTAURANTS, type EatRestaurant } from '../data/eat-restaurants';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { savePlace, unsavePlace } from '@/lib/saved-places';
import SaveSheet from '../SaveSheet';
import { useScrollSafeClick } from '../hooks/useScrollSafeClick';

const supabase = getSupabaseBrowserClient();

interface DiscoverScreenProps {
  onNavigate: (screen: string) => void;
  isActive?: boolean;
  onSearchOpen?: () => void;
}

// Grab a diverse mix of attraction slugs across collections for the "Only in Shanghai" scroll
const featuredSlugs = COLLECTION_LIST.flatMap((col) => col.slugs.slice(0, 2)).slice(0, 12);

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

const barsList = ALL_EAT_RESTAURANTS.filter((r) => r.category === 'bars');

export default function DiscoverScreen({ onNavigate, isActive: screenActive = true, onSearchOpen }: DiscoverScreenProps) {
  const { attractions: featuredAttractions, loading: featuredLoading } = useCollectionData(featuredSlugs);
  const [compact, setCompact] = useState(false);

  // Fetch featured restaurants from restaurants_v2
  const [featuredRestaurants, setFeaturedRestaurants] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/restaurants-v2')
      .then(r => r.json())
      .then(d => {
        // Deduplicate by slug to prevent duplicate ViewTransition names
        const seen = new Set<string>();
        const unique = (d.restaurants || []).filter((r: any) => r.slug && !seen.has(r.slug) && seen.add(r.slug));
        setFeaturedRestaurants(unique);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="v2-scroll-body" onScroll={(e) => { const shouldCompact = e.currentTarget.scrollTop > 30; if (shouldCompact !== compact) setCompact(shouldCompact); }}>
      {/* Sticky search + Eat / Experience / Drink tabs */}
      <div className={`v2-sha-sticky-bar${compact ? ' v2-sha-sticky-bar--compact' : ''}`}>
        <div className="v2-sha-pill" onClick={() => onSearchOpen?.()}>
          <span className="v2-sha-pill-icon">🔍</span>
          <span>Start your search</span>
        </div>
        <div className="v2-sha-tabs">
          {[
            { id: 'eat',        emoji: '🍜', label: 'Eat',        isNew: false },
            { id: 'experience', emoji: '🎡', label: 'Experience', isNew: false },
            { id: 'drink',      emoji: '🍸', label: 'Drink',      isNew: true  },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`v2-sha-tab ${tab.id === 'experience' ? 'active' : ''}`}
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
      </div>

      {/* SECTION 1: Only in Shanghai */}
      <div className="v2-sh-section v2-fade-up v2-d1">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">Local Experiences</div>
            <div className="v2-sh-section-sub">
              Experiences you won&apos;t find anywhere else
            </div>
          </div>
          <div
            className="v2-sh-see-all"
            onClick={() => onNavigate('shanghai-all')}
          >
            See all &rarr;
          </div>
        </div>
        <div className="v2-sh-hscroll">
          {featuredLoading ? (
            <>
              <CoverCardSkeleton />
              <CoverCardSkeleton />
              <CoverCardSkeleton />
            </>
          ) : (
            featuredAttractions.map((a) => (
              <AttractionCoverCard key={a.slug} attraction={a} screenActive={screenActive} />
            ))
          )}
        </div>
      </div>

      <div className="v2-sh-divider" />

      {/* SECTION 2: What locals are eating */}
      <div className="v2-sh-section v2-fade-up v2-d2">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">What locals are eating</div>
            <div className="v2-sh-section-sub">Right now, this week</div>
          </div>
          <div className="v2-sh-see-all" onClick={() => onNavigate('eat')}>See all &rarr;</div>
        </div>
        <div className="v2-sh-hscroll">
          {featuredRestaurants.length > 0 ? featuredRestaurants.map((r: any) => (
            <FoodCard key={r.slug} slug={r.slug} image={r.image} name={r.name_en} hook={r.verdict} price={r.price_cny ? `¥${r.price_cny}/pp` : ''} rating={r.rating ? String(r.rating) : ''} cuisine={r.cuisine} screenActive={screenActive} />
          )) : (
            <>
              <FoodCard slug="" image={null} name="Loading..." hook="" price="" rating="" cuisine="" />
              <FoodCard slug="" image={null} name="Loading..." hook="" price="" rating="" cuisine="" />
            </>
          )}
        </div>
      </div>

      <div className="v2-sh-divider" />

      {/* SECTION 2B: Bars & Cafes */}
      <div className="v2-sh-section v2-fade-up v2-d2">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">Bars &amp; Cafes</div>
            <div className="v2-sh-section-sub">Where to drink tonight</div>
          </div>
          <div className="v2-sh-see-all" onClick={() => onNavigate('drink')}>See all &rarr;</div>
        </div>
        <div className="v2-sh-hscroll">
          {barsList.map((r) => (
            <BarCoverCard key={r.slug} bar={r} screenActive={screenActive} />
          ))}
        </div>
      </div>

      <div className="v2-sh-divider" />

      {/* SECTION 3: Explore by neighbourhood */}
      <div className="v2-sh-section v2-fade-up v2-d2">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">Explore by neighbourhood</div>
            <div className="v2-sh-section-sub">
              Each area has its own personality
            </div>
          </div>
          <div className="v2-sh-see-all">Map &rarr;</div>
        </div>
        <div className="v2-sh-hscroll">
          <NeighbourhoodCard bg="linear-gradient(135deg,#1a1a0a,#2d2d1a)" name="French Concession" desc="Tree-lined lanes · Boutique cafes · Nightlife" count="14 places" />
          <NeighbourhoodCard bg="linear-gradient(135deg,#1a0a0a,#2d1a1a)" name="Tianzifang" desc="Art alleyways · Craft shops · Street food" count="9 places" />
          <NeighbourhoodCard bg="linear-gradient(135deg,#0a0a1a,#1a1a2d)" name="The Bund" desc="Art deco skyline · Rooftop bars · Iconic views" count="7 places" />
          <NeighbourhoodCard bg="linear-gradient(135deg,#1a1a1a,#2d2d2d)" name="Xintiandi" desc="Shikumen heritage · Upscale dining · Galleries" count="11 places" />
          <NeighbourhoodCard bg="linear-gradient(135deg,#0a1a0a,#1a2d1a)" name="Jing&apos;an" desc="Ancient temple · Luxury malls · Specialty coffee" count="8 places" />
        </div>
      </div>

      <div className="v2-sh-bottom-pad" />

    </div>
  );
}

/* ─── Time-of-day hero scoring ─── */

const NIGHT_SLUGS = new Set(['the-mckinnon-hotel', 'mengtian-music-livehouse', 'kezee-shanghai', 'ins-wonderland-shanghai', 'e-ice-factory-escape-room']);
const NIGHT_TYPES = new Set(['social']);
const MORNING_SLUGS = new Set(['fotografiska-shanghai', 'shanghai-natural-history-museum', 'shanghai-greenhouse-garden', 'west-bund-art-center']);
const MORNING_TYPES = new Set(['sightseeing', 'aesthetic']);
const AFTERNOON_SLUGS = new Set(['umeplay-escape-art', 'x-meta-full-sensory-vr-theme-park', 'cages-sports-bar-restaurant', 'bounce-kong-super-sports-center']);
const AFTERNOON_TYPES = new Set(['activity', 'immersive']);
const EVENING_TYPES = new Set(['social', 'immersive', 'wellness']);

function getTimeScore(a: import('@/types/attraction').AttractionData): number {
  const h = new Date().getHours();
  const t = a.experience_type?.toLowerCase() || '';
  const s = a.slug;
  // Morning 6-11
  if (h >= 6 && h < 12) {
    if (MORNING_SLUGS.has(s)) return 3;
    if (MORNING_TYPES.has(t)) return 2;
    return 1;
  }
  // Afternoon 12-17
  if (h >= 12 && h < 18) {
    if (AFTERNOON_SLUGS.has(s)) return 3;
    if (AFTERNOON_TYPES.has(t)) return 2;
    return 1;
  }
  // Evening 18-22
  if (h >= 18 && h < 22) {
    if (NIGHT_SLUGS.has(s)) return 3;
    if (EVENING_TYPES.has(t)) return 2;
    return 1;
  }
  // Late night 22-6
  if (NIGHT_SLUGS.has(s)) return 3;
  if (NIGHT_TYPES.has(t)) return 2;
  return 1;
}

/* ─── Helpers ─── */

function extractPrice(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d[\d,]*(?:\s*[-–~]\s*\d[\d,]*)?)/);
  return m ? m[1].replace(/,/g, '') : null;
}

function shortHook(hook?: string): string {
  if (!hook) return '';
  const firstSentence = hook.match(/^[^.!?]*[.!?]/)?.[0] || hook;
  if (firstSentence.length <= 100) return firstSentence;
  return firstSentence.slice(0, 97) + '...';
}

/* ─── Sub-components ─── */

function AttractionCoverCard({ attraction, screenActive = true }: { attraction: import('@/types/attraction').AttractionData; screenActive?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const router = useRouter();
  const scroll = useScrollSafeClick();
  const img = attraction.images?.[0];
  const name = attraction.card_name || attraction.attraction_name_en;
  async function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setShowSaveSheet(true); return; }
    const wasSaved = saved;
    setSaved((s) => !s);
    if (wasSaved) { unsavePlace(supabase, 'attraction', attraction.slug); }
    else { savePlace(supabase, { place_type: 'attraction', place_slug: attraction.slug, place_name: name, place_image: img }); }
  }
  return (
    <div className="v2-sh-cover-card" style={{ cursor: 'pointer' }} {...scroll.handlers} onClick={() => { if (scroll.wasScroll()) return; router.push(`/attractions/${attraction.slug}`); }}>
      <SaveSheet isOpen={showSaveSheet} placeName={name} onClose={() => setShowSaveSheet(false)} onLoggedIn={() => { setShowSaveSheet(false); setSaved(true); }} />
      {img ? (
        <ViewTransition name={screenActive ? `hero-attraction-${attraction.slug}` : undefined}>
          <SmoothImage key={`${attraction.slug}-${img}`} className="v2-sh-cover-img" src={img} alt={name} />
        </ViewTransition>
      ) : (
        <div className="v2-sh-cover-img" style={{ background: 'linear-gradient(135deg,#1a1a2d,#2d2d4a)' }} />
      )}
      <div className="v2-sh-cover-overlay" />
      <button
        className="v2-sh-food-fav"
        onClick={handleFav}
        aria-label={saved ? 'Unsave attraction' : 'Save attraction'}
      >
        <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
          <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
        </svg>
      </button>
      <div className="v2-sh-cover-body">
        <div className="v2-sh-cover-tag">{attraction.card_type || attraction.experience_type}</div>
        <div className="v2-sh-cover-name">{name}</div>
        <div className="v2-sh-cover-hook">{attraction.card_hook || shortHook(attraction.hook)}</div>
      </div>
    </div>
  );
}

function CoverCardSkeleton() {
  return (
    <div className="v2-sh-cover-card">
      <div className="v2-sh-cover-img" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="v2-sh-cover-body">
        <div style={{ height: 10, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 5, marginBottom: 6 }} />
        <div style={{ height: 14, width: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 7, marginBottom: 6 }} />
        <div style={{ height: 10, width: 100, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }} />
      </div>
    </div>
  );
}

function BarCoverCard({ bar, screenActive = true }: { bar: EatRestaurant; screenActive?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const router = useRouter();
  const scroll = useScrollSafeClick();
  async function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setShowSaveSheet(true); return; }
    const wasSaved = saved;
    setSaved((s) => !s);
    if (wasSaved) { unsavePlace(supabase, 'restaurant', bar.slug || ''); }
    else { savePlace(supabase, { place_type: 'restaurant', place_slug: bar.slug || '', place_name: bar.name_en, place_image: bar.image || undefined }); }
  }
  return (
    <div className="v2-sh-cover-card" style={{ cursor: 'pointer' }} {...scroll.handlers} onClick={() => { if (scroll.wasScroll()) return; bar.slug && router.push(`/restaurants/${bar.slug}`); }}>
      <SaveSheet isOpen={showSaveSheet} placeName={bar.name_en} onClose={() => setShowSaveSheet(false)} onLoggedIn={() => { setShowSaveSheet(false); setSaved(true); }} />
      {bar.image ? (
        <ViewTransition name={screenActive && bar.slug ? `hero-restaurant-${bar.slug}` : undefined}>
          <SmoothImage className="v2-sh-cover-img" src={bar.image} alt={bar.name_en} />
        </ViewTransition>
      ) : (
        <div className="v2-sh-cover-img" style={{ background: 'linear-gradient(135deg,#1a1a2d,#2d2d4a)' }} />
      )}
      <div className="v2-sh-cover-overlay" />
      <button
        className="v2-sh-food-fav"
        onClick={handleFav}
        aria-label={saved ? 'Unsave' : 'Save'}
      >
        <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
          <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
        </svg>
      </button>
      <div className="v2-sh-cover-body">
        <div className="v2-sh-cover-tag">{bar.cuisine_label}</div>
        <div className="v2-sh-cover-name">{bar.name_en}</div>
        <div className="v2-sh-cover-hook">{shortHook(bar.hook)}</div>
      </div>
    </div>
  );
}

function NeighbourhoodCard({ bg, name, desc, count }: { bg: string; name: string; desc: string; count: string; }) {
  return (
    <div className="v2-sh-nbhd-card">
      <div className="v2-sh-nbhd-img" style={{ background: bg, display: 'block' }} />
      <div className="v2-sh-nbhd-overlay" />
      <div className="v2-sh-nbhd-count">{count}</div>
      <div className="v2-sh-nbhd-body">
        <div className="v2-sh-nbhd-name">{name}</div>
        <div className="v2-sh-nbhd-desc">{desc}</div>
      </div>
    </div>
  );
}

function FoodCard({ slug, image, name, price, rating, cuisine, screenActive = true }: {
  slug: string; image: string | null; name: string; hook: string; price: string; rating: string; cuisine: string; screenActive?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const router = useRouter();
  const scroll = useScrollSafeClick();
  async function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setShowSaveSheet(true); return; }
    const wasSaved = saved;
    setSaved((s) => !s);
    if (wasSaved) { unsavePlace(supabase, 'restaurant', slug); }
    else { savePlace(supabase, { place_type: 'restaurant', place_slug: slug, place_name: name, place_image: image || undefined }); }
  }
  const card = (
    <div className="v2-sh-food-card">
      <SaveSheet isOpen={showSaveSheet} placeName={name} onClose={() => setShowSaveSheet(false)} onLoggedIn={() => { setShowSaveSheet(false); setSaved(true); }} />
      <div className="v2-sh-food-img-wrap">
        {image ? (
          <ViewTransition name={screenActive && slug ? `hero-restaurant-${slug}` : undefined}>
            <SmoothImage className="v2-sh-food-img" src={image} alt={name} />
          </ViewTransition>
        ) : (
          <div className="v2-sh-food-img v2-sh-food-img-placeholder">🍽️</div>
        )}
        <button
          className="v2-sh-food-fav"
          onClick={handleFav}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>
      <div className="v2-sh-food-body">
        <div className="v2-sh-food-row">
          <div className="v2-sh-food-name">{name}</div>
          {rating && <div className="v2-sh-food-rating">★ {rating}</div>}
        </div>
        <div className="v2-sh-food-meta">
          {price && <span className="v2-sh-food-price">{price}</span>}
        </div>
        {cuisine && <div className="v2-sh-food-cuisine">{cuisine}</div>}
      </div>
    </div>
  );
  if (!slug) return card;
  return <div style={{ cursor: 'pointer' }} {...scroll.handlers} onClick={() => { if (scroll.wasScroll()) return; router.push(`/restaurants/${slug}`); }}>{card}</div>;
}

function PlanCard({ bg, tag, title, stops }: { bg: string; tag: string; title: string; stops: string[]; }) {
  return (
    <div className="v2-sh-plan-card">
      <div className="v2-sh-plan-img" style={{ background: bg, display: 'block' }} />
      <div className="v2-sh-plan-body">
        <div className="v2-sh-plan-tag">{tag}</div>
        <div className="v2-sh-plan-title">{title}</div>
        <div className="v2-sh-plan-stops">
          {stops.map((s, i) => (
            <span key={i} className="v2-sh-plan-stop">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GemCard({ emoji, tag, name, desc, pills }: { emoji: string; tag: string; name: string; desc: string; pills: string[]; }) {
  return (
    <div className="v2-sh-gem-card">
      <div className="v2-sh-gem-img-ph">{emoji}</div>
      <div className="v2-sh-gem-body">
        <div className="v2-sh-gem-tag">{tag}</div>
        <div className="v2-sh-gem-name">{name}</div>
        <div className="v2-sh-gem-desc">{desc}</div>
        <div className="v2-sh-gem-meta">
          {pills.map((p, i) => (
            <span key={i} className="v2-sh-gem-pill">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

