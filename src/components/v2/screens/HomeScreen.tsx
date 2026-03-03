'use client';

import { useRef, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
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
    badge: '✦ AI Pick · Japanese',
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
    badge: '✦ AI Pick · Vegan',
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
    badge: '✦ AI Pick · Shanghainese',
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
    badge: '✦ AI Pick · Xinjiang',
    image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/restaurant-images/once-upon-xinjiang-wusun/review_0_0.jpeg',
  },
];

const ATTRACTION_PICK = {
  slug: 'fotografiska-shanghai',
  name: 'Fotografiska Shanghai',
  rating: '4.8',
  meta: '~¥120 entry',
  location: 'Suzhou Creek',
  reason: 'World-class photo exhibitions in a riverside warehouse with a rooftop bar.',
  badge: '✦ AI Pick · Attraction',
  image: 'https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/attraction-images/fotografiska-shanghai/review_212_0.jpeg',
};

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

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [pickIndex, setPickIndex] = useState(0);
  const [savedBySlug, setSavedBySlug] = useState<Record<string, boolean>>({});
  const [savedAttraction, setSavedAttraction] = useState(false);
  const pickCarouselRef = useRef<HTMLDivElement | null>(null);
  const { location: userLocation, city, isDemo } = useGeolocation();
  const coords = parseLocation(userLocation);
  const canShowDistance = !isDemo && !!coords && isShanghaiCity(city);
  const openTodayPick = (slug: string) => {
    window.location.assign(`/restaurants/${slug}`);
  };
  const openAttractionPick = () => {
    window.location.assign(`/attractions/${ATTRACTION_PICK.slug}`);
  };

  const handlePickScroll = () => {
    const el = pickCarouselRef.current;
    if (!el || el.clientWidth <= 0) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (nextIndex !== pickIndex && nextIndex >= 0 && nextIndex < TODAY_PICKS.length) {
      setPickIndex(nextIndex);
    }
  };

  const scrollToPick = (index: number) => {
    const el = pickCarouselRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setPickIndex(index);
  };

  return (
    <div className="v2-scroll-body">
      {/* 1. Hero Header */}
      <div className="v2-home-hero">
        <div className="v2-home-hero-glow" />
        <div className="v2-home-top">
          <div className="v2-home-logo">
            <div className="v2-logo-mark">你</div>
            <span className="v2-logo-text">Hello<em>China</em></span>
          </div>
          <div className="v2-home-top-right">
            <div className="v2-notif-btn">🔔<div className="v2-notif-dot" /></div>
            <div className="v2-avatar-btn">A</div>
          </div>
        </div>
        <div className="v2-home-greeting">
          <div className="v2-greeting-eyebrow">Thursday · Shanghai · 7°C ☁️</div>
          <div className="v2-greeting-text">
            Morning, Alex <span className="wave">👋</span><br />Ready to eat?
          </div>
        </div>
        <div className="v2-context-strip" style={{ marginTop: 14 }}>
          <div className="v2-ctx-pill"><div className="v2-ctx-live-dot" /> People&apos;s Square</div>
          <div className="v2-ctx-pill">🌐 Connected</div>
          <div className="v2-ctx-pill">🔋 Offline ready</div>
        </div>
      </div>

      {/* 2. Search */}
      <div className="v2-search-wrap v2-fade-up v2-d1">
        <div className="v2-search-bar">
          <span className="v2-search-icon">🔍</span>
          <input
            className="v2-search-input"
            type="text"
            placeholder="Ask anything — food, directions, phrases…"
          />
          <div className="v2-search-cam" onClick={() => onNavigate('photo')}>📷</div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="v2-quick-actions v2-fade-up v2-d2">
        <div className="v2-section-label">Quick access</div>
        <div className="v2-qa-grid">
          <div className="v2-qa-item" onClick={() => onNavigate('discover')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#FF6B35,#D0021B)' }}>🍜</div>
            <div className="v2-qa-label">Find Food</div>
          </div>
          <div className="v2-qa-item" onClick={() => onNavigate('navigate')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>🚇</div>
            <div className="v2-qa-label">Navigate</div>
          </div>
          <div className="v2-qa-item" onClick={() => onNavigate('photo')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#34C759,#30D158)' }}>📷</div>
            <div className="v2-qa-label">Photo AI</div>
          </div>
          <div className="v2-qa-item">
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#C9A84C,#FF9500)' }}>🗺️</div>
            <div className="v2-qa-label">Explore</div>
          </div>
        </div>
      </div>

      {/* 4. Today's Pick */}
      <div className="v2-todays-pick v2-fade-up v2-d2">
        <div className="v2-section-label">✦ Today&apos;s Pick for you</div>
        <div className="v2-pick-carousel" ref={pickCarouselRef} onScroll={handlePickScroll}>
          {TODAY_PICKS.map((pick) => {
            const saved = !!savedBySlug[pick.slug];
            const distanceLabel = canShowDistance && coords
              ? formatDistance(haversineMeters(coords.lat, coords.lng, pick.lat, pick.lng))
              : null;
            const pickMetaItems = [
              distanceLabel ? `📍 ${distanceLabel}` : null,
              pick.price,
              pick.location,
            ].filter(Boolean) as string[];
            return (
              <div key={pick.slug} className="v2-pick-card v2-pick-carousel-card" onClick={() => openTodayPick(pick.slug)}>
                <img className="v2-pick-card-img" src={pick.image} alt={pick.name} />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setSavedBySlug((prev) => ({ ...prev, [pick.slug]: !prev[pick.slug] }));
                  }}
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
        <div className="v2-pick-dots" role="tablist" aria-label="Restaurant carousel position">
          {TODAY_PICKS.map((pick, idx) => (
            <button
              key={pick.slug}
              type="button"
              className={`v2-pick-dot ${idx === pickIndex ? 'active' : ''}`}
              onClick={() => scrollToPick(idx)}
              aria-label={`Show ${pick.name}`}
              aria-current={idx === pickIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>

      {/* 5. Attraction Pick */}
      <div className="v2-attraction-pick v2-fade-up v2-d2">
        <div className="v2-section-label">✦ Attraction Pick for you</div>
        <div className="v2-pick-card" onClick={openAttractionPick}>
          <img className="v2-pick-card-img" src={ATTRACTION_PICK.image} alt={ATTRACTION_PICK.name} />
          <div className="v2-pick-overlay" />
          <div className="v2-pick-badge v2-pick-badge-alt">{ATTRACTION_PICK.badge}</div>
          <button
            type="button"
            className="v2-sh-food-fav"
            onClick={(e) => {
              e.stopPropagation();
              setSavedAttraction((prev) => !prev);
            }}
            aria-label={savedAttraction ? 'Unsave attraction' : 'Save attraction'}
          >
            <svg viewBox="0 0 32 32" width="24" height="24" fill={savedAttraction ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
              <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
            </svg>
          </button>
          <div className="v2-pick-body">
            <div className="v2-pick-name">{ATTRACTION_PICK.name}</div>
            <div className="v2-pick-meta">
              <div className="v2-pick-meta-item">⭐ {ATTRACTION_PICK.rating}</div>
              <div className="v2-pick-meta-item">· {ATTRACTION_PICK.meta}</div>
              <div className="v2-pick-meta-item">· {ATTRACTION_PICK.location}</div>
            </div>
            <div className="v2-pick-ai-reason">
              &ldquo;{ATTRACTION_PICK.reason}&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* 6. Dish Passport */}
      <div className="v2-passport-section v2-fade-up v2-d3">
        <div className="v2-passport-card" onClick={() => onNavigate('discover')}>
          <div className="v2-passport-bg-pattern" />
          <div className="v2-passport-top">
            <div>
              <div className="v2-passport-title">🍜 Dish Passport</div>
              <div className="v2-passport-subtitle">Your Shanghai food journey</div>
            </div>
            <div className="v2-passport-badge">Level 2</div>
          </div>
          <div className="v2-passport-dishes">
            <div className="v2-dish-stamp done" title="Xiaolongbao">🥟</div>
            <div className="v2-dish-stamp done" title="Noodles">🍜</div>
            <div className="v2-dish-stamp done" title="Scallion pancake">🫓</div>
            <div className="v2-dish-stamp" title="Peking Duck">🦆</div>
            <div className="v2-dish-stamp locked" title="Hotpot">🍲</div>
            <div className="v2-dish-stamp locked" title="Mapo Tofu">🌶️</div>
          </div>
          <div className="v2-passport-progress">
            <div className="v2-progress-bar-wrap">
              <div className="v2-progress-bar-fill" style={{ width: '50%' }} />
            </div>
            <div className="v2-progress-text"><strong>3 of 6</strong> Shanghai classics tried · 3 more to unlock</div>
          </div>
        </div>
      </div>

      {/* 7. Pocket Phrases */}
      <div className="v2-phrase-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Pocket Phrases</span>
          <span className="v2-sec-link">See all</span>
        </div>
        <div className="v2-phrase-scroll">
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">No spicy please</div>
            <div className="v2-phrase-cn">不要辣</div>
            <div className="v2-phrase-pinyin">Bù yào là</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">The bill please</div>
            <div className="v2-phrase-cn">买单</div>
            <div className="v2-phrase-pinyin">Mǎi dān</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">Where is the toilet?</div>
            <div className="v2-phrase-cn">厕所在哪里？</div>
            <div className="v2-phrase-pinyin">Cèsuǒ zài nǎlǐ?</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">I&apos;m allergic to...</div>
            <div className="v2-phrase-cn">我对...过敏</div>
            <div className="v2-phrase-pinyin">Wǒ duì... guòmǐn</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
        </div>
      </div>

      {/* 8. Neighbourhood Vibes */}
      <div className="v2-vibes-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Neighbourhood Vibes</span>
          <span className="v2-sec-link">Map view</span>
        </div>
        <div className="v2-vibes-scroll">
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#2d1b69,#11998e)' }}>🌿</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">French Concession</div>
              <div className="v2-vibe-mood">Coffee · Vintage · Brunch</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#1a0508,#4a0e1a)' }}>🌃</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">The Bund</div>
              <div className="v2-vibe-mood">Cocktails · Views · Rooftop</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#0d4f3c,#1a8c5a)' }}>🏮</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">Xintiandi</div>
              <div className="v2-vibe-mood">Upscale · History · Tapas</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>🍜</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">People&apos;s Square</div>
              <div className="v2-vibe-mood">Street Food · Metro Hub</div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Tonight's Plan */}
      <div className="v2-tonight-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr" style={{ marginBottom: 10 }}>
          <span className="v2-sec-title">Tonight&apos;s Plan ✨</span>
          <span className="v2-sec-link">Customise</span>
        </div>
        <div className="v2-tonight-card">
          <div className="v2-tonight-stars" />
          <div className="v2-tonight-top">
            <div className="v2-tonight-title">AI-curated evening for you</div>
            <div className="v2-tonight-time">From 6pm</div>
          </div>
          <div className="v2-tonight-steps">
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">1</div>
              <div className="v2-tonight-step-text"><strong>6:30pm</strong> — Xiaolongbao at Din Tai Fung (30 min walk)</div>
            </div>
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">2</div>
              <div className="v2-tonight-step-text"><strong>8:00pm</strong> — Rooftop cocktails at Bar Rouge, The Bund</div>
            </div>
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">3</div>
              <div className="v2-tonight-step-text"><strong>10:00pm</strong> — Night market snacks at Yuyuan Bazaar</div>
            </div>
          </div>
          <div className="v2-tonight-cta" onClick={() => onNavigate('navigate')}>
            <div className="v2-tonight-cta-text">Start this evening →</div>
            <div className="v2-tonight-cta-arrow">→</div>
          </div>
        </div>
      </div>

      {/* 10. Survival Kit */}
      <div className="v2-survival-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Survival Kit 🛟</span>
          <span className="v2-sec-link">See all</span>
        </div>
        <div className="v2-survival-grid">
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#FF9500,#FF6B35)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(255,149,0,0.1)' }}>💳</div>
            <div className="v2-survival-card-title">Alipay Setup</div>
            <div className="v2-survival-card-sub">Pay everywhere in 5 min</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#D0021B,#FF3B30)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(208,2,27,0.08)' }}>🚨</div>
            <div className="v2-survival-card-title">Emergency</div>
            <div className="v2-survival-card-sub">Phrases & numbers</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(0,122,255,0.08)' }}>📶</div>
            <div className="v2-survival-card-title">VPN & SIM</div>
            <div className="v2-survival-card-sub">Stay connected guide</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#34C759,#30D158)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(52,199,89,0.08)' }}>🏥</div>
            <div className="v2-survival-card-title">Medical Help</div>
            <div className="v2-survival-card-sub">English-speaking clinics</div>
          </div>
        </div>
      </div>

      {/* 10. Traveller Reviews */}
      <div className="v2-reviews-section v2-fade-up v2-d5">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">From Travellers Like You</span>
          <span className="v2-sec-link">See more</span>
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
