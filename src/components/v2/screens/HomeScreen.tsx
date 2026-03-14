'use client';

import { type TouchEvent, useRef, useState, useEffect, useCallback, ViewTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { savePlace, unsavePlace, getSavedPlaces } from '@/lib/saved-places';
import { track } from '@/lib/analytics';
import { useGeolocation } from '../hooks/useGeolocation';
import { useCollectionData } from '../hooks/useCollectionData';
import SaveSheet from '../SaveSheet';
import { useScrollSafeClick } from '../hooks/useScrollSafeClick';

const supabase = getSupabaseBrowserClient();

// ── Weather helpers ─────────────────────────────────────────────

const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function useWeather(lat: number | null, lng: number | null) {
  const [temp, setTemp] = useState<number | null>(null);
  const [icon, setIcon] = useState('');
  useEffect(() => {
    if (lat == null || lng == null) return;
    let cancelled = false;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setTemp(Math.round(d.current.temperature_2m));
        setIcon(WMO_ICONS[d.current.weather_code] || '🌡️');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lng]);
  return { temp, icon };
}

const CITY_NAMES: Record<string, string> = {
  '上海': 'Shanghai', '北京': 'Beijing', '成都': 'Chengdu',
  '广州': 'Guangzhou', '深圳': 'Shenzhen', '杭州': 'Hangzhou',
  '南京': 'Nanjing', '西安': "Xi'an", '重庆': 'Chongqing',
  '苏州': 'Suzhou', '武汉': 'Wuhan', '长沙': 'Changsha',
};

function cityEnglish(cn: string): string {
  if (CITY_NAMES[cn]) return CITY_NAMES[cn];
  for (const [k, v] of Object.entries(CITY_NAMES)) {
    if (cn.includes(k)) return v;
  }
  return cn;
}

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  isActive?: boolean;
}

const TODAY_PICKS = [
  {
    slug: 'edo-japanese-restaurant',
    name: 'Edo Japanese Restaurant',
    rating: '4.3',
    price: '¥270/person',
    location: 'Xintiandi',
    lat: 31.220944879784632,
    lng: 121.47896878278914,
    reason: 'Warm wood interior, calm lighting, and low-pressure service rhythm.',
    badge: 'Japanese',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/restaurant-images/edo-japanese-restaurant/review_101_0.jpeg',
  },
  {
    slug: 'ru-pure-vegan',
    name: 'Ru Pure Vegan',
    rating: '4.5',
    price: '¥152/person',
    location: "Jing'an",
    lat: 31.23589486124896,
    lng: 121.46202001508684,
    reason: 'Refined vegan tasting menu with strong service and thoughtful presentation.',
    badge: 'Vegan',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/restaurant-images/ru-pure-vegan/review_41_0.jpeg',
  },
  {
    slug: 'xinya-tea-house',
    name: 'Xinya Tea House',
    rating: '4.2',
    price: '¥136/person',
    location: "Jing'an",
    lat: 31.228481348411652,
    lng: 121.45870208689705,
    reason: 'Classic Shanghainese dishes in a polished room with reliable quality.',
    badge: 'Shanghainese',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/restaurant-images/xinya-tea-house/review_187_0.jpeg',
  },
  {
    slug: 'once-upon-xinjiang-wusun',
    name: 'Once Upon Xinjiang',
    rating: '4.0',
    price: '¥92/person',
    location: 'Hongqiao',
    lat: 31.20821810684588,
    lng: 121.40788812911273,
    reason: 'Big flavors, great value, and easy group ordering for first-timers.',
    badge: 'Xinjiang',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/restaurant-images/once-upon-xinjiang-wusun/review_0_0.jpeg',
  },
];

const ATTRACTION_PICKS = [
  {
    slug: 'fotografiska-shanghai',
    name: 'Fotografiska Shanghai',
    rating: '4.8',
    meta: '~¥120 entry',
    location: 'Suzhou Creek',
    reason: 'World-class photo exhibitions in a riverside warehouse with a rooftop bar.',
    badge: 'Attraction',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/attraction-images/fotografiska-shanghai/review_212_0.jpeg',
  },
  {
    slug: 'the-mckinnon-hotel',
    name: 'Sleep No More Shanghai',
    rating: '4.7',
    meta: 'From ¥520',
    location: "Jing'an",
    reason: 'An immersive theatre masterpiece — wander freely through a noir dreamscape.',
    badge: 'Theatre',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&q=75',
  },
  {
    slug: 'shanghai-haichang-ocean-park',
    name: 'Haichang Ocean Park',
    rating: '4.5',
    meta: 'From ¥299',
    location: 'Lingang, Pudong',
    reason: 'Massive aquarium with orca shows and underwater tunnels — great for families.',
    badge: 'Family',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=75',
  },
];

const ORIGINAL_ATTRACTIONS = [
  {
    slug: 'the-mckinnon-hotel',
    label: 'Original',
    title: 'Sleep No More Shanghai',
    subtitle: 'Beijing West Rd, Jing’an',
    meta: 'From ¥520 / guest',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&q=75',
  },
  {
    slug: 'xtreme-play-sports-entertainment-world',
    label: 'Original',
    title: 'Extreme PLAY Sports World',
    subtitle: 'Baoshan District, Shanghai',
    meta: 'From ¥98 / guest',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=75',
  },
  {
    slug: 'mengtian-music-livehouse',
    label: 'Original',
    title: 'Mengtian LiveHouse at Paramount',
    subtitle: "Jing'an Temple, Shanghai",
    meta: 'From ¥200 / guest',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=75',
  },
  {
    slug: 'shanghai-haichang-ocean-park',
    label: 'Original',
    title: 'Shanghai Haichang Ocean Park',
    subtitle: 'Lingang, Pudong',
    meta: 'From ¥299 / guest',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=75',
  },
];
const ATTRACTION_PICK_SLUGS = ATTRACTION_PICKS.map((item) => item.slug);
const ORIGINAL_ATTRACTION_SLUGS = ORIGINAL_ATTRACTIONS.map((item) => item.slug);

function parseLocation(location: string): { lng: number; lat: number } | null {
  const [lngText, latText] = location.split(',');
  const lng = Number(lngText);
  const lat = Number(latText);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function isShanghaiCity(city: string): boolean {
  const c = city.toLowerCase();
  return c.includes('shanghai') || city.includes('上海');
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(50, Math.round(meters / 10) * 10)}m away`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}

function SmoothImage({ src, alt, className, lazy = false }: { src: string; alt: string; className: string; lazy?: boolean }) {
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
        loading={lazy ? 'lazy' : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

// ── Pocket Phrase card with audio ───────────────────────────────
interface PhraseData { en: string; cn: string; pinyin: string; audio: string }

function PhraseCard({ phrase }: { phrase: PhraseData }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (playing) return;
    track('phrase_played', { phrase: phrase.en });
    if (!audioRef.current) {
      audioRef.current = new Audio(phrase.audio);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  return (
    <div className="v2-phrase-card" onClick={play}>
      <div className="v2-phrase-en">{phrase.en}</div>
      <div className="v2-phrase-cn">{phrase.cn}</div>
      <div className="v2-phrase-pinyin">{phrase.pinyin}</div>
      <div className="v2-phrase-audio">{playing ? '🔊 Playing...' : '🔊 Tap to hear'}</div>
    </div>
  );
}

export default function HomeScreen({ onNavigate, isActive: screenActive = true }: HomeScreenProps) {
  const [pickIndex, setPickIndex] = useState(0);
  const [savedBySlug, setSavedBySlug] = useState<Record<string, boolean>>({});
  const [savedAttrBySlug, setSavedAttrBySlug] = useState<Record<string, boolean>>({});
  const [savedOriginalBySlug, setSavedOriginalBySlug] = useState<Record<string, boolean>>({});
  const [saveSheet, setSaveSheet] = useState<{ open: boolean; name?: string; onConfirm?: () => void }>({ open: false });

  // Sync saved status from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const saved = await getSavedPlaces(supabase);
      const restaurants: Record<string, boolean> = {};
      const attractions: Record<string, boolean> = {};
      for (const p of saved) {
        if (p.place_type === 'restaurant') restaurants[p.place_slug] = true;
        else attractions[p.place_slug] = true;
      }
      setSavedBySlug(restaurants);
      setSavedAttrBySlug(attractions);
      setSavedOriginalBySlug(attractions);
    })();
  }, []);

  type SaveMeta = { slug: string; type: 'restaurant' | 'attraction'; image?: string };

  async function handleFav(e: React.MouseEvent, name: string, isSaved: boolean, meta: SaveMeta, onConfirm: () => void) {
    e.stopPropagation(); e.preventDefault();
    track('place_save', { slug: meta.slug, type: meta.type, action: isSaved ? 'unsave' : 'save' });
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setSaveSheet({ open: true, name, onConfirm }); return; }
    onConfirm();
    if (isSaved) {
      unsavePlace(supabase, meta.type, meta.slug);
    } else {
      savePlace(supabase, { place_type: meta.type, place_slug: meta.slug, place_name: name, place_image: meta.image });
    }
  }
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isSwipingPick, setIsSwipingPick] = useState(false);
  const pickTouchStartX = useRef(0);
  const pickDidDrag = useRef(false);

  const [attrPickIndex, setAttrPickIndex] = useState(0);
  const [attrDragOffsetPx, setAttrDragOffsetPx] = useState(0);
  const [isSwipingAttr, setIsSwipingAttr] = useState(false);
  const attrTouchStartX = useRef(0);
  const attrDidDrag = useRef(false);
  const { location: userLocation, city, isDemo } = useGeolocation();
  const { attractions: attrPicksData } = useCollectionData(ATTRACTION_PICK_SLUGS);
  const { attractions: originalAttractionsData } = useCollectionData(ORIGINAL_ATTRACTION_SLUGS);
  const coords = parseLocation(userLocation);
  const canShowDistance = !isDemo && !!coords && isShanghaiCity(city);
  const { temp, icon: weatherIcon } = useWeather(coords?.lat ?? 31.2304, coords?.lng ?? 121.4737);
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const cityName = cityEnglish(city);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const router = useRouter();
  const origScroll = useScrollSafeClick();

  // Prefetch all card destinations so navigation is near-instant
  useEffect(() => {
    TODAY_PICKS.forEach(p => router.prefetch(`/restaurants/${p.slug}`));
    ATTRACTION_PICKS.forEach(p => router.prefetch(`/attractions/${p.slug}`));
    ORIGINAL_ATTRACTIONS.forEach(p => router.prefetch(`/attractions/${p.slug}`));
  }, [router]);

  const openTodayPick = (slug: string) => {
    track('place_view', { slug, type: 'restaurant', source: 'todays_pick' });
    router.push(`/restaurants/${slug}`);
  };
  const openAttractionPick = (slug: string) => {
    track('place_view', { slug, type: 'attraction', source: 'attraction_pick' });
    router.push(`/attractions/${slug}`);
  };

  const handlePickTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    pickTouchStartX.current = e.touches[0]?.clientX ?? 0;
    pickDidDrag.current = false;
    setIsSwipingPick(true);
  };

  const handlePickTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isSwipingPick) return;
    const currentX = e.touches[0]?.clientX ?? pickTouchStartX.current;
    const dx = currentX - pickTouchStartX.current;
    if (Math.abs(dx) > 8) pickDidDrag.current = true;
    setDragOffsetPx(dx);
  };

  const handlePickTouchEnd = () => {
    if (!isSwipingPick) return;
    const thresholdPx = 46;
    let next = pickIndex;
    if (dragOffsetPx <= -thresholdPx) next = Math.min(TODAY_PICKS.length - 1, pickIndex + 1);
    if (dragOffsetPx >= thresholdPx) next = Math.max(0, pickIndex - 1);
    if (next !== pickIndex) {
      track('carousel_swipe', { carousel: 'todays_pick', index: next, direction: dragOffsetPx < 0 ? 'left' : 'right' });
    }
    setPickIndex(next);
    setDragOffsetPx(0);
    setIsSwipingPick(false);
  };

  const onPickCardClick = (slug: string) => {
    if (pickDidDrag.current) {
      pickDidDrag.current = false;
      return;
    }
    openTodayPick(slug);
  };

  const jumpToPick = (index: number) => {
    setPickIndex(index);
    setDragOffsetPx(0);
    setIsSwipingPick(false);
  };

  const handleAttrTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    attrTouchStartX.current = e.touches[0]?.clientX ?? 0;
    attrDidDrag.current = false;
    setIsSwipingAttr(true);
  };

  const handleAttrTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isSwipingAttr) return;
    const currentX = e.touches[0]?.clientX ?? attrTouchStartX.current;
    const dx = currentX - attrTouchStartX.current;
    if (Math.abs(dx) > 8) attrDidDrag.current = true;
    setAttrDragOffsetPx(dx);
  };

  const handleAttrTouchEnd = () => {
    if (!isSwipingAttr) return;
    const thresholdPx = 46;
    let next = attrPickIndex;
    if (attrDragOffsetPx <= -thresholdPx) next = Math.min(ATTRACTION_PICKS.length - 1, attrPickIndex + 1);
    if (attrDragOffsetPx >= thresholdPx) next = Math.max(0, attrPickIndex - 1);
    if (next !== attrPickIndex) {
      track('carousel_swipe', { carousel: 'attraction_pick', index: next, direction: attrDragOffsetPx < 0 ? 'left' : 'right' });
    }
    setAttrPickIndex(next);
    setAttrDragOffsetPx(0);
    setIsSwipingAttr(false);
  };

  const onAttrCardClick = (slug: string) => {
    if (attrDidDrag.current) {
      attrDidDrag.current = false;
      return;
    }
    openAttractionPick(slug);
  };

  const jumpToAttrPick = (index: number) => {
    setAttrPickIndex(index);
    setAttrDragOffsetPx(0);
    setIsSwipingAttr(false);
  };

  return (
    <div className="v2-scroll-body">
      <SaveSheet
        isOpen={saveSheet.open}
        placeName={saveSheet.name}
        onClose={() => setSaveSheet({ open: false })}
        onLoggedIn={() => { saveSheet.onConfirm?.(); setSaveSheet({ open: false }); }}
      />
      {/* 1. Hero Header */}
      <div className="v2-home-hero">
        <div className="v2-home-hero-glow" />
        <div className="v2-home-top">
          <div className="v2-home-logo">
            <img src="/images/chinapal_logo_white.png" alt="ChinaPal" className="v2-home-logo-img" />
          </div>
          <div className="v2-home-top-right">
            <button
              type="button"
              className="v2-share-btn v2-share-btn--primary"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'ChinaPal', text: 'Your AI travel companion for China', url: window.location.origin });
                } else {
                  navigator.clipboard.writeText(window.location.origin);
                }
              }}
            >
              SHARE <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </button>
          </div>
        </div>
        <div className="v2-home-greeting">
          <div className="v2-greeting-eyebrow">{dayName} · {cityName}{temp != null ? ` · ${temp}°C ${weatherIcon}` : ''}</div>
          <div className="v2-greeting-text">
            {greeting} <span className="wave">👋</span><br />Ready to explore?
          </div>
        </div>
      </div>

      {/* Promo Card */}
      <div className="v2-fade-up v2-d1" style={{ padding: '0 20px', marginTop: 8, cursor: 'pointer' }} onClick={() => onNavigate('photo')}>
        <img
          src="/card-real-A.png"
          alt="Try AI Lens"
          style={{ width: '100%', borderRadius: 16, display: 'block' }}
        />
      </div>

      {/* 4. Today's Pick */}
      <div className="v2-todays-pick v2-fade-up v2-d2">
        <div className="v2-section-label">✦ Today&apos;s Pick for you</div>
        <div className="v2-pick-card v2-pick-static-frame">
          <div
            className="v2-pick-track"
            style={{
              transform: `translateX(calc(${-pickIndex * 100}% + ${dragOffsetPx}px))`,
              transition: isSwipingPick ? 'none' : 'transform .34s cubic-bezier(.22,.61,.36,1)',
            }}
            onTouchStart={handlePickTouchStart}
            onTouchMove={handlePickTouchMove}
            onTouchEnd={handlePickTouchEnd}
            onTouchCancel={handlePickTouchEnd}
          >
            {TODAY_PICKS.map((pick) => {
              const saved = !!savedBySlug[pick.slug];
              const distanceLabel = canShowDistance && coords
                ? formatDistance(haversineMeters(coords.lat, coords.lng, pick.lat, pick.lng))
                : null;
              const pickMetaItems = [
                pick.rating ? `★ ${pick.rating}` : null,
                distanceLabel ? `📍 ${distanceLabel}` : null,
                pick.price,
                pick.location,
              ].filter(Boolean) as string[];
              return (
                <div key={pick.slug} className="v2-pick-slide" onClick={() => onPickCardClick(pick.slug)}>
                  <ViewTransition name={screenActive ? `hero-restaurant-${pick.slug}` : undefined}>
                    <SmoothImage src={pick.image} alt={pick.name} className="v2-pick-card-img" />
                  </ViewTransition>
                  <div className="v2-pick-overlay" />
                  <div className="v2-pick-badge">{pick.badge}</div>
                  <div className="v2-pick-body">
                    <div className="v2-pick-name">{pick.name}</div>
                    <div className="v2-pick-meta">
                      {pickMetaItems.map((item, idx) => (
                        <div className="v2-pick-meta-item" key={`${pick.slug}-meta-${idx}`}>
                          {idx > 0 ? '· ' : ''}{item}
                        </div>
                      ))}
                    </div>
                    <div className="v2-pick-ai-reason">
                      &ldquo;{pick.reason}&rdquo;
                    </div>
                  </div>
                  <button
                    type="button"
                    className="v2-sh-food-fav"
                    onClick={(e) => handleFav(e, pick.name, saved, { slug: pick.slug, type: 'restaurant' }, () => setSavedBySlug((prev) => ({ ...prev, [pick.slug]: !prev[pick.slug] })))}
                    aria-label={saved ? 'Unsave restaurant' : 'Save restaurant'}
                  >
                    <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
                      <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="v2-pick-dots" role="tablist" aria-label="Restaurant carousel position">
          {TODAY_PICKS.map((pick, idx) => (
            <button
              key={pick.slug}
              type="button"
              className={`v2-pick-dot ${idx === pickIndex ? 'active' : ''}`}
              onClick={() => jumpToPick(idx)}
              aria-label={`Show ${pick.name}`}
              aria-current={idx === pickIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>

      {/* 5. Originals Rail */}
      <div className="v2-orig-section v2-fade-up v2-d2">
        <div className="v2-orig-header">
          <div>
            <div className="v2-orig-title">Experience Originals</div>
            <div className="v2-orig-subtitle">Hosted by Shanghai&apos;s most interesting places</div>
          </div>
          <button type="button" className="v2-orig-arrow" onClick={() => onNavigate('discover')} aria-label="See more attractions">
            →
          </button>
        </div>
        <div className="v2-orig-scroll">
          {ORIGINAL_ATTRACTIONS.map((item) => {
            const found = originalAttractionsData.find((a) => a.slug === item.slug);
            const image = found?.images?.[0] || item.image;
            const title = found?.card_name || found?.attraction_name_en || item.title;
            const saved = !!savedOriginalBySlug[item.slug];
            return (
              <div key={item.slug} className="v2-orig-card" style={{ cursor: 'pointer' }} {...origScroll.handlers} onClick={() => { if (origScroll.wasScroll()) return; track('place_view', { slug: item.slug, type: 'attraction', source: 'originals' }); router.push(`/attractions/${item.slug}`); }}>
              <div className="v2-orig-image-wrap">
                  <SmoothImage key={`${item.slug}-${image}`} src={image} alt={title} className="v2-orig-image" lazy />
                  {(found?.card_type || found?.experience_type) && (
                    <div className="v2-pick-badge">{found?.card_type || found?.experience_type}</div>
                  )}
                <button
                  type="button"
                  className="v2-sh-food-fav"
                  onClick={(e) => handleFav(e, title, saved, { slug: item.slug, type: 'attraction', image }, () => setSavedOriginalBySlug((prev) => ({ ...prev, [item.slug]: !prev[item.slug] })))}
                  aria-label={saved ? `Unsave ${title}` : `Save ${title}`}
                >
                  <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
                    <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
                  </svg>
                </button>
              </div>
                <div className="v2-orig-name">{title}</div>
                <div className="v2-orig-hook">{found?.card_hook || ''}</div>
              <div className="v2-orig-meta">{item.meta}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Attraction Pick */}
      <div className="v2-attraction-pick v2-fade-up v2-d3">
        <div className="v2-section-label">✦ Attraction Pick for you</div>
        <div className="v2-pick-card v2-pick-static-frame">
          <div
            className="v2-pick-track"
            style={{
              transform: `translateX(calc(${-attrPickIndex * 100}% + ${attrDragOffsetPx}px))`,
              transition: isSwipingAttr ? 'none' : 'transform .34s cubic-bezier(.22,.61,.36,1)',
            }}
            onTouchStart={handleAttrTouchStart}
            onTouchMove={handleAttrTouchMove}
            onTouchEnd={handleAttrTouchEnd}
            onTouchCancel={handleAttrTouchEnd}
          >
            {ATTRACTION_PICKS.map((pick) => {
              const saved = !!savedAttrBySlug[pick.slug];
              const dbData = attrPicksData.find((a) => a.slug === pick.slug);
              const image = dbData?.images?.[0] || pick.image;
              const name = dbData?.card_name || dbData?.attraction_name_en || pick.name;
              return (
                <div key={pick.slug} className="v2-pick-slide" onClick={() => onAttrCardClick(pick.slug)}>
                  <ViewTransition name={screenActive ? `hero-attraction-${pick.slug}` : undefined}>
                    <SmoothImage src={image} alt={name} className="v2-pick-card-img" lazy />
                  </ViewTransition>
                  <div className="v2-pick-overlay" />
                  <div className="v2-pick-badge">{pick.badge}</div>
                  <div className="v2-pick-body">
                    <div className="v2-pick-name">{name}</div>
                    <div className="v2-pick-meta">
                      <div className="v2-pick-meta-item">⭐ {pick.rating}</div>
                      <div className="v2-pick-meta-item">· {pick.meta}</div>
                      <div className="v2-pick-meta-item">· {pick.location}</div>
                    </div>
                    <div className="v2-pick-ai-reason">
                      &ldquo;{pick.reason}&rdquo;
                    </div>
                  </div>
                  <button
                    type="button"
                    className="v2-sh-food-fav"
                    onClick={(e) => handleFav(e, pick.name, saved, { slug: pick.slug, type: 'attraction', image }, () => setSavedAttrBySlug((prev) => ({ ...prev, [pick.slug]: !prev[pick.slug] })))}
                    aria-label={saved ? 'Unsave attraction' : 'Save attraction'}
                  >
                    <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
                      <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="v2-pick-dots" role="tablist" aria-label="Attraction carousel position">
          {ATTRACTION_PICKS.map((pick, idx) => (
            <button
              key={pick.slug}
              type="button"
              className={`v2-pick-dot ${idx === attrPickIndex ? 'active' : ''}`}
              onClick={() => jumpToAttrPick(idx)}
              aria-label={`Show ${pick.name}`}
              aria-current={idx === attrPickIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>


      {/* 8. Pocket Phrases */}
      <div className="v2-phrase-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Pocket Phrases</span>
          <span className="v2-sec-link">See all</span>
        </div>
        <div className="v2-phrase-scroll">
          {[
            { en: 'No spicy please', cn: '不要辣', pinyin: 'Bù yào là', audio: '/audio/no-spicy.mp3' },
            { en: 'The bill please', cn: '买单', pinyin: 'Mǎi dān', audio: '/audio/the-bill.mp3' },
            { en: 'Where is the toilet?', cn: '厕所在哪里？', pinyin: 'Cèsuǒ zài nǎlǐ?', audio: '/audio/where-toilet.mp3' },
            { en: "I'm allergic to...", cn: '我对...过敏', pinyin: 'Wǒ duì... guòmǐn', audio: '/audio/allergic.mp3' },
          ].map((p) => (
            <PhraseCard key={p.audio} phrase={p} />
          ))}
        </div>
      </div>

      {/* 8b. Feedback CTA */}
      <div className="v2-feedback-cta v2-fade-up v2-d3">
        <div className="v2-feedback-cta-text">
          <div className="v2-feedback-cta-title">Help us improve</div>
          <div className="v2-feedback-cta-sub">We&apos;re building this for travellers like you. Tell us what you think!</div>
        </div>
        <button
          type="button"
          className="v2-feedback-cta-btn"
          onClick={() => onNavigate('feedback')}
        >
          Give Feedback
        </button>
      </div>

      {/* 9. Neighbourhood Vibes */}
      <div className="v2-vibes-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Neighbourhood Vibes</span>
        </div>
        <div className="v2-vibes-scroll">
          <div className="v2-vibe-card" onClick={() => track('neighbourhood_tapped', { neighbourhood: 'French Concession' })}>
            <SmoothImage src="https://images.unsplash.com/photo-1764777447302-93ce9ea10eed?w=400&h=280&fit=crop&auto=format" alt="French Concession" className="v2-vibe-bg-img" lazy />
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">French Concession</div>
              <div className="v2-vibe-mood">Coffee · Vintage · Brunch</div>
            </div>
          </div>
          <div className="v2-vibe-card" onClick={() => track('neighbourhood_tapped', { neighbourhood: 'The Bund' })}>
            <SmoothImage src="https://images.unsplash.com/photo-1743036875127-98a431f97bf5?w=400&h=280&fit=crop&auto=format" alt="The Bund" className="v2-vibe-bg-img" lazy />
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">The Bund</div>
              <div className="v2-vibe-mood">Cocktails · Views · Rooftop</div>
            </div>
          </div>
          <div className="v2-vibe-card" onClick={() => track('neighbourhood_tapped', { neighbourhood: 'Xintiandi' })}>
            <SmoothImage src="https://images.unsplash.com/photo-1718750232545-6bd94f83fc29?w=400&h=280&fit=crop&auto=format" alt="Xintiandi" className="v2-vibe-bg-img" lazy />
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">Xintiandi</div>
              <div className="v2-vibe-mood">Upscale · History · Tapas</div>
            </div>
          </div>
          <div className="v2-vibe-card" onClick={() => track('neighbourhood_tapped', { neighbourhood: "People's Square" })}>
            <SmoothImage src="https://images.unsplash.com/photo-1748078090604-5005ad27129e?w=400&h=280&fit=crop&auto=format" alt="People's Square" className="v2-vibe-bg-img" lazy />
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">People&apos;s Square</div>
              <div className="v2-vibe-mood">Street Food · Metro Hub</div>
            </div>
          </div>
        </div>
      </div>


      {/* 10. Survival Kit */}
      <div className="v2-survival-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Survival Kit 🛟</span>
        </div>
        <div className="v2-survival-grid">
          <div className="v2-survival-card" onClick={() => window.open('https://www.hellochina.chat/blog/china-payment-guide', '_blank')} style={{ cursor: 'pointer' }}>
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#1677FF,#00AAEE)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(22,119,255,0.08)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.422 13.482C21.422 13.482 18.87 12.29 16.8 11.34c-.49-.23-.78-.34-.78-.34s-.49 1.12-1.47 2.24c-1.34 1.54-2.93 2.15-2.93 2.15s3.11 1.56 5.14 2.72c1.11.63 1.69 1.03 2.14 1.36A9.96 9.96 0 0 0 22 12c0-.86-.11-1.7-.31-2.5l-.27.98z" fill="#1677FF"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1.5c4.69 0 8.5 3.81 8.5 8.5 0 .71-.09 1.4-.26 2.06-.54-.28-2.05-1.07-3.89-1.88.71-1.11 1.22-2.37 1.22-2.37H13.2V8.44h2.64V7.53H13.2V5.7h-1.34v1.83H8.72v.91h3.14v1.37H8.3v.91h5.55s-.34.91-1.02 1.89c-1.12-.44-2.54-.94-3.89-1.18-2.4-.44-4.33.45-4.64 2.18-.31 1.73.98 3.42 3.54 3.42 1.78 0 3.35-.94 4.46-2.14.43.2 3.5 1.64 3.5 1.64A8.47 8.47 0 0 1 12 20.5 8.5 8.5 0 0 1 3.5 12c0-4.69 3.81-8.5 8.5-8.5z" fill="#1677FF"/></svg>
            </div>
            <div className="v2-survival-card-title">Alipay Setup</div>
            <div className="v2-survival-card-sub">Pay everywhere in 5 min</div>
          </div>
          <div className="v2-survival-card" onClick={() => window.open('https://www.hellochina.chat/blog/china-internet-guide', '_blank')} style={{ cursor: 'pointer' }}>
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(0,122,255,0.08)' }}>📶</div>
            <div className="v2-survival-card-title">eSIM & VPN</div>
            <div className="v2-survival-card-sub">Stay connected guide</div>
          </div>
        </div>
      </div>

      {/* 10. Traveller Reviews */}
      <div className="v2-reviews-section v2-fade-up v2-d5">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">From Travellers Like You</span>
        </div>
        <div className="v2-reviews-scroll">
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#FF6B35,#D0021B)' }}>S</div>
              <div>
                <div className="v2-review-name">Sophie M.</div>
                <div className="v2-review-from">🇬🇧 London · 3 days ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;Used the photo AI to identify a dish I couldn&apos;t read — turned out to be the best thing I ate in Shanghai. Game changer.&rdquo;
            </div>
            <div className="v2-review-place">📍 Xun Yu Ji Noodles</div>
          </div>
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>J</div>
              <div>
                <div className="v2-review-name">James K.</div>
                <div className="v2-review-from">🇦🇺 Sydney · 1 week ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;The metro navigation saved me so many times. It even tells you which exit to use. Absolutely essential app.&rdquo;
            </div>
            <div className="v2-review-place">📍 People&apos;s Square Station</div>
          </div>
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#34C759,#30D158)' }}>M</div>
              <div>
                <div className="v2-review-name">Maria L.</div>
                <div className="v2-review-from">🇩🇪 Berlin · 2 weeks ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;The Tonight&apos;s Plan feature gave me the perfect evening in Shanghai. Felt like I had a local friend planning my night.&rdquo;
            </div>
            <div className="v2-review-place">📍 The Bund</div>
          </div>
        </div>
      </div>

      <div className="v2-spacer-lg" />
    </div>
  );
}
