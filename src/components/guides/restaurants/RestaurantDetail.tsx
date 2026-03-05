'use client';

import { useEffect, useState, useRef, useCallback, ViewTransition } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

function asArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: any, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toDietClass(value: string): 'green' | 'red' | 'amber' {
  const normalized = value.toLowerCase();
  if (['yes', 'great', 'good', 'high'].includes(normalized)) return 'green';
  if (['no', 'none', 'not available', 'impossible'].includes(normalized)) return 'red';
  return 'amber';
}

function comfortLabel(level: number): string {
  if (level >= 5) return 'Very familiar';
  if (level >= 4) return 'Comfortable';
  if (level >= 3) return 'Mildly adventurous';
  if (level >= 2) return 'Adventurous';
  return 'Very adventurous';
}

function SmoothImage({
  src,
  alt,
  imgClassName,
  wrapperClassName,
  wrapperStyle,
  imgStyle,
  loading = 'lazy',
}: {
  src: string;
  alt: string;
  imgClassName?: string;
  wrapperClassName?: string;
  wrapperStyle?: any;
  imgStyle?: any;
  loading?: 'lazy' | 'eager';
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  useEffect(() => { setLoaded(false); }, [src]);

  return (
    <div
      className={`img-shell ${loaded ? 'loaded' : ''} ${wrapperClassName || ''}`.trim()}
      style={wrapperStyle}
    >
      <div className="img-skeleton" />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        className={imgClassName}
        style={imgStyle}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}

// —— Swipeable Photo Viewer ——————————————————————————————————————

function ViewerSwipe({
  images,
  viewerIndex,
  setViewerIndex,
  altPrefix,
  onClose,
  onSwipeDown,
}: {
  images: string[];
  viewerIndex: number;
  setViewerIndex: React.Dispatch<React.SetStateAction<number>>;
  altPrefix: string;
  onClose: () => void;
  onSwipeDown: () => void;
}) {
  const touchRef = useRef<{ startX: number; startY: number; startTime: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeAxis, setSwipeAxis] = useState<'x' | 'y' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now() };
    setSwipeAxis(null);
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    if (!swipeAxis) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        setSwipeAxis(Math.abs(dx) > Math.abs(dy) ? 'x' : 'y');
      }
      return;
    }

    if (swipeAxis === 'x') {
      setDragX(dx);
    } else {
      setDragY(Math.max(0, dy));
    }
  }, [swipeAxis]);

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current) return;
    const elapsed = Date.now() - touchRef.current.startTime;

    if (swipeAxis === 'x') {
      const threshold = Math.abs(dragX) > 60 || (Math.abs(dragX) > 20 && elapsed < 250);
      if (threshold && dragX < 0) {
        setViewerIndex((prev) => Math.min(prev + 1, images.length - 1));
      } else if (threshold && dragX > 0) {
        setViewerIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (swipeAxis === 'y' && dragY > 100) {
      onSwipeDown();
    }

    setDragX(0);
    setDragY(0);
    setSwiping(false);
    setSwipeAxis(null);
    touchRef.current = null;
  }, [swipeAxis, dragX, dragY, images.length, setViewerIndex, onSwipeDown]);

  const opacity = swipeAxis === 'y' ? Math.max(0.3, 1 - dragY / 400) : 1;
  const scale = swipeAxis === 'y' ? Math.max(0.85, 1 - dragY / 1200) : 1;
  const translateX = swipeAxis === 'x' ? dragX : 0;
  const translateY = swipeAxis === 'y' ? dragY : 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 270,
        background: `rgba(255,255,255,${opacity})`,
        display: 'flex', flexDirection: 'column',
        transition: swiping ? 'none' : 'background .25s ease',
      }}
    >
      <div style={{ padding: '14px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onSwipeDown}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.08)', color: '#222', cursor: 'pointer', fontSize: 16 }}
          aria-label="Back to all photos"
        >
          ←
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>
          {viewerIndex + 1} / {images.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.08)', color: '#222', cursor: 'pointer', fontSize: 16 }}
          aria-label="Close photo viewer"
        >
          ✕
        </button>
      </div>

      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transition: swiping ? 'none' : 'transform .25s ease',
            maxWidth: '100%', maxHeight: '100%',
            padding: 16,
          }}
        >
          <SmoothImage
            src={images[viewerIndex]}
            alt={`${altPrefix} photo ${viewerIndex + 1}`}
            loading="eager"
            wrapperStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            imgStyle={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 16 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDetail({ data }: { data: any }) {
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [galleryMode, setGalleryMode] = useState<'closed' | 'viewer' | 'grid'>('closed');
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (galleryMode !== 'closed') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [galleryMode]);

  if (!data) return null;

  const p = data.profile || {};
  const card = p.layer1_card || {};
  const detail = p.layer2_detail || {};
  const internal = p.internal || {};

  const identity = card.identity || {};
  const vibe = card.vibe || {};
  const price = card.price || {};
  const tags = card.tags || {};
  const dietary = card.dietary || {};

  const practical = detail.practical || {};
  const gettingThere = detail.getting_there || {};
  const whatToOrder = detail.what_to_order || {};
  const howToOrder = detail.how_to_order || {};

  const relational = internal.relational || {};
  const dietaryDetail = internal.dietary_detail || detail.dietary_detail || {};

  const images = asArray<string>(data.images).filter((img) => typeof img === 'string' && img.trim().length > 0);

  const nameEn = asString(data.name_en || identity.name_en, 'Restaurant');
  const nameCn = asString(data.name_cn || identity.name_cn);
  const cuisineType = asString(identity.cuisine_type);
  const cuisineSubtype = asString(identity.cuisine_subtype);
  const venueType = asString(identity.venue_type, 'Restaurant');
  const neighborhood = asString(identity.neighborhood_en);
  const city = asString(identity.city || data.city);

  const openingTime = asString(practical.opening_time || practical.hours);
  const openLabel = (() => {
    const explicit = asString(practical.open_label || practical.open_status);
    if (explicit) return explicit;
    if (!openingTime) return '';
    // Parse time ranges like "18:00-02:00" or "11:30-13:30, 17:30-21:30"
    const ranges = openingTime.split(/[,，]/).map((s) => s.trim());
    const now = new Date();
    const shanghai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const nowMin = shanghai.getHours() * 60 + shanghai.getMinutes();
    let parsed = false;
    for (const range of ranges) {
      const m = range.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (!m) continue;
      parsed = true;
      const openMin = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      const closeMin = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
      // Handle overnight ranges (e.g. 18:00-02:00)
      const isOpen = closeMin > openMin
        ? nowMin >= openMin && nowMin < closeMin
        : nowMin >= openMin || nowMin < closeMin;
      if (isOpen) return 'Open now';
    }
    return parsed ? 'Closed' : '';
  })();

  const verdict = asString(card.hook || card.verdict || data.foreigner_hook);
  const priceCny = asNumber(price.price_per_person_cny);
  const priceUsd = asNumber(price.price_per_person_usd);
  const priceTier = asString(price.price_tier, 'Moderate');

  const vibeDescription = asString(vibe.description);
  const vibeCaptions = asArray<string>(vibe.captions || vibe.tags)
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, 4);

  const topDishes = asArray<any>(whatToOrder.top_dishes);
  const skipNote = asString(whatToOrder.skip);

  const visitorMistakesRaw = howToOrder.what_visitors_get_wrong || howToOrder.common_mistakes || [];
  const visitorMistakes = Array.isArray(visitorMistakesRaw)
    ? visitorMistakesRaw.map((m) => asString(m)).filter(Boolean)
    : [asString(visitorMistakesRaw)].filter(Boolean);

  const fullMenu = asArray<any>(internal.full_dish_database);
  const warnings = asArray<any>(detail.warnings);
  const orderSteps = asArray<string>(howToOrder.steps).map((s) => asString(s)).filter(Boolean);

  const hoursNote = asString(practical.hours_note || practical.note);
  const reservation = asString(practical.reservation);
  const payment = asString(practical.payment);
  const bestTime = asString(practical.best_time);

  const addressCn = asString(gettingThere.address_cn || data.address_cn || data.address);
  const taxiTip = asString(gettingThere.taxi_tip);
  const taxiTipLines = taxiTip.split('\n').map((line) => line.trim()).filter(Boolean);
  const taxiMain = taxiTipLines[0] || addressCn;
  const taxiSub = taxiTipLines[1] || '';

  const nearestMetroRaw = gettingThere.nearest_metro;
  const nearestMetroName = typeof nearestMetroRaw === 'string'
    ? nearestMetroRaw
    : asString(nearestMetroRaw?.name || nearestMetroRaw?.station || nearestMetroRaw?.line_station);
  const nearestMetroDesc = typeof nearestMetroRaw === 'string'
    ? ''
    : asString(nearestMetroRaw?.note || nearestMetroRaw?.walk || nearestMetroRaw?.walking_info);

  const dietItems = [
    { icon: '🥗', label: 'Vegetarian', value: asString(dietary.vegetarian, 'Limited') },
    { icon: '🌱', label: 'Vegan', value: asString(dietary.vegan, 'No') },
    { icon: '🥩', label: 'Pork-free', value: asString(dietary.pork_free, 'No') },
    { icon: '☪️', label: 'Halal', value: asString(dietary.halal, 'No') },
    { icon: '🌶️', label: 'Spice', value: asString(dietaryDetail.spice_level || dietary.spice_level, 'Mild-Med') },
    { icon: '🌾', label: 'Gluten-free', value: asString(dietaryDetail.gluten_free || dietary.gluten_free, 'No') },
  ];

  const dietaryNotes = [
    asString(dietary.note),
    asString(dietaryDetail.spice_note),
    asString(dietaryDetail.common_allergens)
      ? `Allergens: ${asString(dietaryDetail.common_allergens)}`
      : '',
  ].filter(Boolean);

  const pairsWellWith = asArray<string>(relational.pairs_well_with).map((item) => asString(item)).filter(Boolean);
  const similarAlternative = asString(relational.similar_alternative);
  const bestFor = asArray<string>(tags.best_for).map((item) => asString(item)).filter(Boolean);

  const soloFriendlyRaw = tags.solo_friendly;
  const soloFriendly = typeof soloFriendlyRaw === 'boolean'
    ? `Solo-friendly: ${soloFriendlyRaw ? 'yes' : 'no'}`
    : asString(soloFriendlyRaw);

  const locationLine = [neighborhood, city].filter(Boolean).join(', ');
  const headerCnLine = [nameCn, locationLine].filter(Boolean).join(' · ');

  const footerSub = [neighborhood, cuisineSubtype || cuisineType].filter(Boolean).join(' · ');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const copyAddress = async () => {
    const copyText = [nameCn, addressCn].filter(Boolean).join(' ');
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      showToast('Address copied');
    } catch {
      showToast('Copy failed');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ url: window.location.href, title: nameEn });
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied');
      } catch {
        showToast('Share unavailable');
      }
    }
  };

  const handleAsk = () => {
    window.location.href = `/chat?restaurant=${data.slug}`;
  };

  const handleNav = () => {
    const params = new URLSearchParams();
    params.set('nav', nameCn || nameEn);
    if (nameCn) params.set('nameCn', nameCn);
    if (addressCn) params.set('addr', addressCn);
    params.set('from', `/restaurants/${data.slug}`);
    window.location.href = `/v2?${params.toString()}`;
  };

  const vibeCards = vibeCaptions.length > 0
    ? vibeCaptions
    : [
        'Warm glow, low-lit industrial chic.',
        'Window seats with neighborhood views.',
        'Mix of expats and locals.',
        'Casual but polished energy.',
      ];

  const heroPhotoCount = 3;
  const vibePhotoStart = heroPhotoCount;
  const vibePhotoCount = Math.min(
    vibeCards.length,
    Math.max(images.length - heroPhotoCount, 0),
  );
  const dishPhotoStart = heroPhotoCount + vibePhotoCount;

  const footerPriceText = priceCny ? `¥${priceCny} / person` : 'Price varies';

  return (
    <div className="hc-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,500&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap');

        .hc-page{
          --bg:#fff;--gray-50:#f9f9f9;--gray-100:#f3f3f3;--gray-200:#e5e5e5;--gray-300:#d4d4d4;
          --gray-400:#a3a3a3;--gray-500:#8c8c8c;--gray-600:#666;--gray-700:#4a4a4a;
          --gray-800:#2a2a2a;--gray-900:#1a1a1a;
          --green:#22c55e;--green-dark:#16a34a;--red:#dc2626;--red-soft:#c0392b;
          --amber:#d97706;--amber-light:#fef9e7;--amber-border:#f0d87a;
          --cream:#fdf6e3;--cream-border:#e8d5a3;
          font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;
          background:var(--bg);
          color:var(--gray-900);
          line-height:1.55;
          -webkit-font-smoothing:antialiased;
          padding-bottom:92px;
          max-width:100vw;
          overflow-x:clip;
          position:relative;
        }

        .hc-page *{box-sizing:border-box}
        @keyframes hcShimmer{
          0%{background-position:200% 0}
          100%{background-position:-200% 0}
        }
        .img-shell{position:relative;overflow:hidden;background:#efefef}
        .img-skeleton{
          position:absolute;inset:0;
          background:linear-gradient(110deg,#f1f1f1 20%,#fafafa 45%,#f1f1f1 70%);
          background-size:220% 100%;
          animation:hcShimmer 1.2s ease-in-out infinite;
          transition:opacity .35s ease;
        }
        .img-shell img{
          position:relative;z-index:1;display:block;width:100%;height:100%;
          opacity:0;transform:scale(1.02);
          transition:opacity .45s ease,transform .6s cubic-bezier(.22,.61,.36,1);
        }
        .img-shell.loaded img{opacity:1;transform:scale(1)}
        .img-shell.loaded .img-skeleton{opacity:0;animation:none}
        @media (prefers-reduced-motion: reduce){
          .img-skeleton{animation:none}
          .img-shell img{transition:none;transform:none}
        }

        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;position:sticky;top:0;z-index:100;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        .nav-btn{width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;color:#222;box-shadow:0 1px 4px rgba(0,0,0,.12)}
        .nav-title{font-size:16px;font-weight:700}
        .nav-right{display:flex;gap:8px}

        .hero-grid{display:grid;grid-template-columns:1.2fr 1fr;grid-template-rows:220px 150px;gap:3px;margin:0 12px;border-radius:12px;overflow:hidden}
        .hero-slot{position:relative;overflow:hidden;background:var(--gray-100)}
        .hero-slot:first-child{grid-row:1/-1}
        .hero-img{width:100%;height:100%;object-fit:cover;display:block}
        .hero-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--gray-400);letter-spacing:.5px;text-transform:uppercase;background:linear-gradient(135deg,var(--gray-100),#e8e4de)}
        .hero-badge-btn{
          position:absolute;bottom:10px;right:10px;z-index:3;
          width:36px;height:36px;border-radius:50%;
          background:rgba(255,255,255,.9);
          border:1px solid rgba(0,0,0,.08);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 1px 3px rgba(0,0,0,.1);
          cursor:pointer;
          padding:0;
          appearance:none;
          -webkit-appearance:none;
        }

        .content{padding:0 20px;max-width:640px;margin:0 auto}

        .header{padding-top:16px}
        .header-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
        .tag{font-size:13px;font-weight:500;padding:6px 14px;border-radius:100px;border:1px solid var(--gray-200);background:var(--bg);color:var(--gray-700)}
        .header h1{font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:0}
        .header-cn{font-family:'Noto Sans SC',sans-serif;font-size:14px;color:var(--gray-500);font-weight:400;margin-top:2px}
        .header-open{margin-top:8px;font-size:14px;color:var(--gray-600);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .open-dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block}
        .open-dot.closed{background:#e53e3e}
        .open-label{color:var(--green-dark);font-weight:600}
        .open-label.closed{color:#e53e3e}

        .quick-stats{display:flex;border:1px solid var(--gray-200);border-radius:12px;overflow:hidden;margin-top:14px}
        .qs{flex:1;padding:14px 10px;text-align:center;border-right:1px solid var(--gray-200)}
        .qs:last-child{border-right:none}
        .qs-val{font-size:18px;font-weight:800}
        .qs-label{font-size:11px;color:var(--gray-500);margin-top:1px}

        .section-divider{height:1px;background:var(--gray-200);margin:28px 0}

        .verdict{font-size:18px;color:var(--gray-800);line-height:1.6;font-style:italic;padding:4px 0}
        .verdict-attr{display:flex;align-items:center;gap:8px;margin-top:12px}
        .verdict-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#e8553d,#d97706);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
        .verdict-label{font-size:13px;font-weight:600;color:var(--gray-700)}
        .verdict-sub{font-size:12px;color:var(--gray-500)}

        .s-title{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 16px}

        .vibe-scroll{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
        .vibe-scroll::-webkit-scrollbar{display:none}
        .vibe-card{flex:0 0 260px;scroll-snap-align:start}
        .vibe-card-ph{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;background:linear-gradient(135deg,#8b7355,#a08868)}
        .vibe-card-img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
        .vibe-card-media{border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .vibe-card-label{
          display:block;
          margin-top:8px;
          font-size:13px;
          line-height:1.45;
          color:var(--gray-800);
          font-weight:600;
          background:#fff;
          border:1px solid #ececec;
          border-radius:10px;
          padding:9px 11px;
          box-shadow:0 1px 2px rgba(0,0,0,.04);
        }
        .vibe-desc{font-size:14px;color:var(--gray-600);line-height:1.65;margin-top:14px;white-space:pre-line}

        .dish-card{display:flex;gap:14px;background:var(--bg);border:1px solid var(--gray-200);border-radius:14px;overflow:hidden;margin-bottom:12px}
        .dish-img{width:130px;min-height:130px;flex-shrink:0;object-fit:cover;display:block}
        .dish-img-ph{width:130px;min-height:130px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--gray-400);text-transform:uppercase;background:linear-gradient(135deg,#e8e4de,#d8d4cc)}
        .dish-body{padding:14px 14px 14px 0;flex:1;display:flex;flex-direction:column}
        .dish-badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 10px;border-radius:6px;margin-bottom:6px;width:fit-content}
        .badge-must{background:#fef2e0;color:#c0392b}
        .badge-highlight{background:#e8f5e9;color:#2d8a4e}
        .dish-name{font-size:16px;font-weight:700;line-height:1.25}
        .dish-cn{font-family:'Noto Sans SC',sans-serif;font-size:12px;color:var(--gray-500);margin-top:1px}
        .dish-desc{font-size:13px;color:var(--gray-600);line-height:1.55;margin-top:6px;flex:1}
        .dish-comfort{display:flex;gap:2px;align-items:center;margin-top:6px}
        .comfort-dot{width:8px;height:8px;border-radius:50%;background:var(--gray-200)}
        .comfort-dot.on{background:var(--green)}
        .comfort-label{font-size:10px;font-weight:700;color:var(--green-dark);text-transform:uppercase;letter-spacing:.3px;margin-left:5px}
        .dish-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px}
        .dish-price{font-size:17px;font-weight:800}
        .dish-tip-pill{font-size:11px;color:var(--amber);font-weight:600;padding:4px 10px;background:var(--amber-light);border-radius:100px;white-space:nowrap;display:flex;align-items:center;gap:3px}

        .skip-note{display:flex;align-items:flex-start;gap:10px;padding:16px 18px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;font-size:14px;color:var(--gray-700);line-height:1.55;margin-top:4px}
        .skip-note strong{color:var(--red-soft)}

        .insider-note{display:flex;align-items:flex-start;gap:10px;padding:16px 18px;background:var(--cream);border:1px solid var(--cream-border);border-radius:12px;font-size:14px;color:var(--gray-800);line-height:1.55;margin-bottom:10px}

        .heads-up-item{padding:16px 18px;background:var(--gray-50);border-left:3px solid var(--amber);border-radius:0 12px 12px 0;margin-bottom:10px}
        .heads-up-title{font-size:15px;font-weight:700;color:var(--amber);margin-bottom:4px}
        .heads-up-body{font-size:14px;color:var(--gray-600);line-height:1.55}

        .order-step{display:flex;gap:12px;align-items:flex-start;padding:10px 0}
        .order-num{width:28px;height:28px;border-radius:50%;background:var(--gray-900);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .order-text{font-size:14px;color:var(--gray-700);line-height:1.55}

        .zone-break{padding:80px 0 60px;text-align:center}
        .zone-break-text{font-size:20px;font-weight:300;color:var(--gray-400);letter-spacing:-.01em}

        .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .plan-card{border:1px solid var(--gray-200);border-radius:14px;padding:16px;background:var(--bg)}
        .plan-card-icon{font-size:24px;margin-bottom:8px}
        .plan-card-label{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--gray-500);margin-bottom:4px}
        .plan-card-val{font-size:15px;font-weight:700;line-height:1.3}
        .plan-card-sub{font-size:12px;color:var(--gray-500);margin-top:3px;line-height:1.4}

        .address-cn{font-family:'Noto Sans SC',sans-serif;font-size:15px;color:var(--gray-700);margin-bottom:16px}
        .taxi-card{border:1px dashed var(--gray-300);border-radius:14px;padding:20px;text-align:center}
        .taxi-label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gray-500);margin-bottom:10px}
        .taxi-cn{font-family:'Noto Sans SC',sans-serif;font-size:28px;font-weight:900;user-select:all}
        .taxi-sub{font-family:'Noto Sans SC',sans-serif;font-size:13px;color:var(--gray-500);margin-top:4px}
        .taxi-copy-btn{margin-top:14px;display:inline-flex;align-items:center;gap:6px;background:var(--gray-900);color:#fff;border:none;border-radius:100px;padding:10px 24px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer}
        .metro-row{display:flex;gap:10px;align-items:flex-start;margin-top:16px;padding:12px 0}
        .metro-icon{font-size:20px;flex-shrink:0;margin-top:2px}
        .metro-name{font-size:15px;font-weight:700}
        .metro-desc{font-size:13px;color:var(--gray-600);line-height:1.5;margin-top:2px}

        .dietary-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
        .diet-card{border:1px solid var(--gray-200);border-radius:12px;padding:14px 10px;text-align:center}
        .diet-icon{font-size:24px;margin-bottom:6px}
        .diet-label{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--gray-500);margin-bottom:3px}
        .diet-val{font-size:13px;font-weight:700}
        .diet-val.green{color:var(--green-dark)}
        .diet-val.red{color:var(--red)}
        .diet-val.amber{color:var(--amber)}
        .diet-note{font-size:13px;color:var(--gray-600);line-height:1.55;margin-top:12px}

        .menu-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100);gap:8px;font-size:13px}
        .menu-row:last-child{border-bottom:none}
        .menu-name{font-family:'Noto Sans SC',sans-serif;font-weight:500;color:var(--gray-800);flex:1}
        .menu-note{color:var(--gray-500);font-style:italic;text-align:right;max-width:160px;font-size:11px}
        .menu-price{font-weight:700;color:var(--gray-700);white-space:nowrap;margin-left:8px}

        .pair-card{display:flex;gap:12px;align-items:center;padding:16px;border:1px solid var(--gray-200);border-radius:14px;margin-bottom:8px}
        .pair-text{font-size:14px;color:var(--gray-700);line-height:1.5}

        .bf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .bf-tag{border:1px solid var(--gray-200);border-radius:12px;padding:12px 14px;text-align:center;font-size:14px;font-weight:500;color:var(--gray-700);display:flex;align-items:center;justify-content:center;gap:5px}

        .collapse-header{display:flex;justify-content:space-between;align-items:center;padding:16px 0;cursor:pointer;border-bottom:1px solid var(--gray-100)}
        .collapse-title{font-size:16px;font-weight:700}
        .collapse-arrow{font-size:14px;color:var(--gray-400);transition:transform .25s}
        .collapse-header.open .collapse-arrow{transform:rotate(180deg)}
        .collapse-body{display:none;padding:0 0 16px;font-size:14px;color:var(--gray-700);line-height:1.6}
        .collapse-body.show{display:block}

        .sticky-footer{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid rgba(0,0,0,.06);padding:12px 20px calc(12px + env(safe-area-inset-bottom));z-index:100;display:flex;justify-content:space-between;align-items:center}
        .footer-price{font-size:18px;font-weight:800}
        .footer-sub{font-size:12px;color:var(--gray-500)}
        .footer-btns{display:flex;gap:10px}
        .btn-ask{padding:12px 22px;border-radius:14px;font-size:15px;font-weight:600;border:1.5px solid var(--gray-200);background:var(--bg);color:var(--gray-900);cursor:pointer;display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;transition:all .2s ease;letter-spacing:-.01em}
        .btn-ask:active{background:var(--gray-100);transform:scale(.97)}
        .btn-go{padding:12px 28px;border-radius:14px;font-size:15px;font-weight:600;border:none;background:linear-gradient(135deg,#e8382e 0%,#c41e14 100%);color:#fff;cursor:pointer;display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;box-shadow:0 2px 12px rgba(196,30,20,.28);transition:all .2s ease;letter-spacing:-.01em}
        .btn-go:active{transform:scale(.97);box-shadow:0 1px 6px rgba(196,30,20,.3)}

        .toast{position:fixed;top:72px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.78);color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;z-index:300}

        @media(max-width:480px){
          .hero-grid{margin:0 12px;grid-template-rows:200px 120px}
          .content{padding:0 16px}
        }
      `}</style>

      {toast ? <div className="toast">{toast}</div> : null}

      <nav className="nav">
        <button className="nav-btn" onClick={() => window.history.back()} aria-label="Back">←</button>
        <span className="nav-title">{nameEn}</span>
        <div className="nav-right">
          <button className="nav-btn" onClick={handleShare} aria-label="Share">↗</button>
          <button className="nav-btn" onClick={() => setSaved((prev) => !prev)} aria-label="Save" style={{ color: saved ? '#D0021B' : '#222' }}>{saved ? '♥' : '♡'}</button>
        </div>
      </nav>

      <div className="hero-grid">
        {[0, 1, 2].map((index) => (
          <div
            className="hero-slot"
            key={index}
            onClick={() => {
              if (!images[index]) return;
              setViewerIndex(index);
              setGalleryMode('viewer');
            }}
            style={{
              borderRadius:
                index === 0
                  ? '12px 3px 3px 12px'
                  : index === 1
                    ? '3px 12px 3px 3px'
                    : '3px 3px 12px 3px',
              cursor: images[index] ? 'pointer' : 'default',
            }}
          >
            {images[index] ? (
              index === 0 ? (
                <ViewTransition name={`hero-restaurant-${data.slug}`}>
                  <SmoothImage
                    src={images[index]}
                    alt={`${nameEn} photo ${index + 1}`}
                    imgClassName="hero-img"
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    loading="eager"
                  />
                </ViewTransition>
              ) : (
                <SmoothImage
                  src={images[index]}
                  alt={`${nameEn} photo ${index + 1}`}
                  imgClassName="hero-img"
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  loading="lazy"
                />
              )
            ) : (
              <div className="hero-ph">Photo {index + 1}</div>
            )}
            {index === 2 && images.length > 3 ? (
              <button
                type="button"
                className="hero-badge-btn"
                aria-label="View all photos"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryMode('grid');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="4" width="8.5" height="8.5" rx="1.5" stroke="#222" strokeWidth="1.5" />
                  <path d="M6 4V2.5A1.5 1.5 0 0 1 7.5 1H13.5A1.5 1.5 0 0 1 15 2.5V8.5A1.5 1.5 0 0 1 13.5 10H12" stroke="#222" strokeWidth="1.5" />
                </svg>
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="content">
        <div className="header">
          <div className="header-tags">
            {cuisineType ? <span className="tag">{cuisineType}</span> : null}
            {cuisineSubtype ? <span className="tag">{cuisineSubtype}</span> : null}
            {venueType ? <span className="tag">{venueType}</span> : null}
          </div>

          <h1>{nameEn}</h1>
          {headerCnLine ? <p className="header-cn">{headerCnLine}</p> : null}

          {openingTime ? (
            <div className="header-open">
              <span className={`open-dot ${openLabel === 'Closed' ? 'closed' : ''}`} />
              <span className={`open-label ${openLabel === 'Closed' ? 'closed' : ''}`}>{openLabel || 'Hours'}</span>
              <span>· {openingTime}</span>
            </div>
          ) : null}
        </div>

        <div className="section-divider" />

        {verdict ? (
          <>
            <div className="verdict">&ldquo;{verdict}&rdquo;</div>
            <div className="verdict-attr">
              <div className="verdict-avatar">HC</div>
              <div>
                <div className="verdict-label">HelloChina AI Guide</div>
                <div className="verdict-sub">Local knowledge</div>
              </div>
            </div>
          </>
        ) : null}

        <div className="quick-stats" style={{ marginTop: 20 }}>
          <div className="qs">
            <div className="qs-val">{priceCny ? `¥${priceCny}` : 'N/A'}</div>
            <div className="qs-label">per person</div>
          </div>
          <div className="qs">
            <div className="qs-val">{priceUsd ? `$${priceUsd}` : 'N/A'}</div>
            <div className="qs-label">USD</div>
          </div>
          <div className="qs">
            <div className="qs-val">{priceTier}</div>
            <div className="qs-label">price tier</div>
          </div>
        </div>

        <div className="section-divider" />

        <h2 className="s-title">The Vibe</h2>
        <div className="vibe-scroll">
          {vibeCards.map((caption, index) => (
            <div className="vibe-card" key={`vibe-${index}`}>
              <div className="vibe-card-media">
                {asString(images[vibePhotoStart + index]) ? (
                  <SmoothImage
                    src={asString(images[vibePhotoStart + index])}
                    alt={`${nameEn} vibe ${index + 1}`}
                    wrapperStyle={{ width: '100%', aspectRatio: '1 / 1' }}
                    imgClassName="vibe-card-img"
                  />
                ) : (
                  <div className="vibe-card-ph">Photo</div>
                )}
              </div>
              <span className="vibe-card-label">{caption}</span>
            </div>
          ))}
        </div>
        {vibeDescription ? <div className="vibe-desc">{vibeDescription}</div> : null}
        {vibe.noise_level || vibe.dress_code ? (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)' }}>
            {vibe.noise_level ? <span>🔊 {asString(vibe.noise_level)}</span> : null}
            {vibe.noise_level && vibe.dress_code ? ' · ' : null}
            {vibe.dress_code ? <span>👔 {asString(vibe.dress_code)}</span> : null}
          </div>
        ) : null}

        <div className="section-divider" />

        <h2 className="s-title">Hit Dishes</h2>
        {topDishes.map((dish, index) => {
          const comfortLevel = Math.max(0, Math.min(5, asNumber(dish.comfort_level) || 0));
          const isMust = asString(dish.badge).toLowerCase().includes('must') || comfortLevel >= 4;
          const dishNameEn = asString(dish.dish_name_en || dish.name_en || dish.name);
          const dishNameCn = asString(dish.dish_name_cn || dish.name_cn);
          const dishDesc = asString(dish.description);
          const dishPrice = asNumber(dish.price_cny);
          const dishImage = asString(dish.image_url) || asString(images[dishPhotoStart + index]);

          return (
            <div className="dish-card" key={`dish-${index}-${dishNameEn}`}>
              {dishImage ? (
                <SmoothImage
                  src={dishImage}
                  alt={dishNameEn || `Dish ${index + 1}`}
                  wrapperStyle={{ width: 130, minHeight: 130, flexShrink: 0 }}
                  imgClassName="dish-img"
                />
              ) : (
                <div className="dish-img-ph">Photo</div>
              )}
              <div className="dish-body">
                <span className={`dish-badge ${isMust ? 'badge-must' : 'badge-highlight'}`}>
                  {isMust ? 'Must Order' : 'Highlight'}
                </span>
                {dishNameEn ? <div className="dish-name">{dishNameEn}</div> : null}
                {dishNameCn ? <div className="dish-cn">{dishNameCn}</div> : null}
                {dishDesc ? <div className="dish-desc">{dishDesc}</div> : null}
                <div className="dish-comfort">
                  {[0, 1, 2, 3, 4].map((dot) => (
                    <span key={dot} className={`comfort-dot ${dot < comfortLevel ? 'on' : ''}`} />
                  ))}
                  <span className="comfort-label">{comfortLabel(comfortLevel)}</span>
                </div>
                <div className="dish-bottom">
                  {dishPrice ? <span className="dish-price">{`~¥${dishPrice}`}</span> : null}
                </div>
              </div>
            </div>
          );
        })}

        {skipNote ? (
          <div className="skip-note">
            <span>🚫</span>
            <div>
              <strong>Skip:</strong> {skipNote}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }} />
        {visitorMistakes.map((note, index) => (
          <div className="insider-note" key={`insider-${index}`}>
            <span>{index % 2 === 0 ? '🥬' : '🍚'}</span>
            <div>{note}</div>
          </div>
        ))}

        {fullMenu.length > 0 ? (
          <>
            <div
              className={`collapse-header ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setMenuOpen((open) => !open);
                }
              }}
            >
              <span className="collapse-title">Full menu · {fullMenu.length} more dishes</span>
              <span className="collapse-arrow">▾</span>
            </div>
            <div className={`collapse-body ${menuOpen ? 'show' : ''}`}>
              {fullMenu.map((item, index) => {
                const menuName = asString(item.dish_name_cn || item.name_cn || item.name || item.dish_name_en);
                const menuNote = asString(item.note || item.short_note || item.description);
                const menuPrice = asNumber(item.price_cny);
                return (
                  <div className="menu-row" key={`menu-${index}-${menuName}`}>
                    <span className="menu-name">{menuName || `Dish ${index + 1}`}</span>
                    {menuNote ? <span className="menu-note">{menuNote}</span> : null}
                    <span className="menu-price">{menuPrice ? `~¥${menuPrice}` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        <div className="section-divider" />

        {warnings.length > 0 ? (
          <>
            <h2 className="s-title">Heads up</h2>
            {warnings.map((warning, index) => (
              <div className="heads-up-item" key={`warning-${index}`}>
                <div className="heads-up-title">{asString(warning.complaint || warning.title || warning.warning)}</div>
                <div className="heads-up-body">{asString(warning.practical_note || warning.note || warning.advice)}</div>
              </div>
            ))}
            <div className="section-divider" />
          </>
        ) : null}

        {orderSteps.length > 0 ? (
          <>
            <h2 className="s-title">How to order</h2>
            {orderSteps.map((step, index) => (
              <div className="order-step" key={`step-${index}`}>
                <span className="order-num">{index + 1}</span>
                <span className="order-text">{step}</span>
              </div>
            ))}
          </>
        ) : null}

        <div className="zone-break">
          <div className="zone-break-text">Plan your visit</div>
        </div>

        <div className="plan-grid">
          <div className="plan-card">
            <div className="plan-card-icon">🕐</div>
            <div className="plan-card-label">Hours</div>
            <div className="plan-card-val">{openingTime || 'Hours vary'}</div>
            {hoursNote ? <div className="plan-card-sub">{hoursNote}</div> : null}
          </div>
          <div className="plan-card">
            <div className="plan-card-icon">📋</div>
            <div className="plan-card-label">Reservation</div>
            <div className="plan-card-val">{reservation || 'Walk in'}</div>
            <div className="plan-card-sub">Number system or walk-in.</div>
          </div>
          <div className="plan-card">
            <div className="plan-card-icon">💳</div>
            <div className="plan-card-label">Payment</div>
            <div className="plan-card-val">{payment || 'Alipay, WeChat Pay'}</div>
            <div className="plan-card-sub">Cash may be accepted but rarely used.</div>
          </div>
          <div className="plan-card">
            <div className="plan-card-icon">⏰</div>
            <div className="plan-card-label">Best time</div>
            <div className="plan-card-val">{bestTime || 'Weekday lunch'}</div>
            <div className="plan-card-sub">Weekends are usually busiest.</div>
          </div>
        </div>

        <div className="section-divider" />

        <h2 className="s-title">Where it is</h2>
        {addressCn ? <p className="address-cn">{addressCn}</p> : null}
        <div className="taxi-card">
          <div className="taxi-label">Show this to your taxi driver</div>
          <div className="taxi-cn">{taxiMain || nameCn || nameEn}</div>
          {taxiSub ? <div className="taxi-sub">{taxiSub}</div> : null}
          <button className="taxi-copy-btn" onClick={copyAddress}>📋 Copy address</button>
        </div>

        {nearestMetroName ? (
          <div className="metro-row">
            <span className="metro-icon">🚇</span>
            <div>
              <div className="metro-name">{nearestMetroName}</div>
              {nearestMetroDesc ? <div className="metro-desc">{nearestMetroDesc}</div> : null}
            </div>
          </div>
        ) : null}

        <div className="section-divider" />

        <h2 className="s-title">Dietary</h2>
        <div className="dietary-grid">
          {dietItems.map((item) => {
            const value = item.value || 'Unknown';
            return (
              <div className="diet-card" key={item.label}>
                <div className="diet-icon">{item.icon}</div>
                <div className="diet-label">{item.label}</div>
                <div className={`diet-val ${toDietClass(value)}`}>{value}</div>
              </div>
            );
          })}
        </div>
        {dietaryNotes.map((note, index) => (
          <p className="diet-note" key={`diet-note-${index}`}>{note}</p>
        ))}

        <div className="section-divider" />

        <h2 className="s-title">Pairs well with</h2>
        {pairsWellWith.map((pair, index) => (
          <div className="pair-card" key={`pair-${index}`}>
            <div className="pair-text">{pair}</div>
          </div>
        ))}
        {similarAlternative ? (
          <div className="pair-card">
            <div className="pair-text">If full: {similarAlternative}</div>
          </div>
        ) : null}

        <div className="section-divider" />

        <h2 className="s-title">Best for</h2>
        <div className="bf-grid">
          {(bestFor.length > 0 ? bestFor : ['Group', 'Date night', 'Solo', 'Celebration']).map((item) => (
            <span className="bf-tag" key={item}>{item}</span>
          ))}
        </div>
        {soloFriendly ? (
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 10, lineHeight: 1.5 }}>{soloFriendly}</p>
        ) : null}

        <div style={{ height: 40 }} />
      </div>

      <div className="sticky-footer">
        <div>
          <div className="footer-price">{footerPriceText}</div>
          <div className="footer-sub">{footerSub || 'Local favorite'}</div>
        </div>
        <div className="footer-btns">
          <button className="btn-ask" onClick={handleAsk}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Ask
          </button>
          <button className="btn-go" onClick={handleNav}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            GO
          </button>
        </div>
      </div>

      {galleryMode === 'grid' ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 260, background: '#fff', overflowY: 'auto' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ececec', padding: '14px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setGalleryMode('closed')}
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.05)', cursor: 'pointer', fontSize: 16 }}
              aria-label="Close photos"
            >
              ←
            </button>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{images.length} photos</div>
            <div style={{ width: 32 }} />
          </div>
          <div style={{ columnCount: 2, columnGap: 4, padding: '10px 10px 14px' }}>
            {images.map((src, idx) => (
              <button
                key={`gallery-${idx}`}
                type="button"
                onClick={() => {
                  setViewerIndex(idx);
                  setGalleryMode('viewer');
                }}
                style={{
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  background: 'transparent',
                  width: '100%',
                  display: 'block',
                  marginBottom: 4,
                  breakInside: 'avoid',
                }}
                aria-label={`Open photo ${idx + 1}`}
              >
                <SmoothImage
                  src={src}
                  alt={`${nameEn} gallery ${idx + 1}`}
                  wrapperStyle={{ width: '100%', borderRadius: 20 }}
                  imgStyle={{ width: '100%', height: 'auto' }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {galleryMode === 'viewer' && images[viewerIndex] ? (
        <ViewerSwipe
          images={images}
          viewerIndex={viewerIndex}
          setViewerIndex={setViewerIndex}
          altPrefix={nameEn}
          onClose={() => setGalleryMode('closed')}
          onSwipeDown={() => setGalleryMode('grid')}
        />
      ) : null}
    </div>
  );
}
