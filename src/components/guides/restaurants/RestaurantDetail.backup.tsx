'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAMap } from '@/hooks/useAMap';

// ════════════════════════════════════════════════════════════════
// RESTAURANT PAGE — Belloco Template Engine
//
// <RestaurantDetail data={restaurantRow} />
//
// Expects a restaurants_v2 row: { slug, name_en, name_cn, images, profile }
// profile has: layer1_card, layer2_detail, internal
//
// Section order (matching index_cdn.html):
//   Nav → Photo Grid → Identity → Stats Row → Verdict →
//   The Vibe → Pricing → When to Go →
//   What to Order → Heads Up → How to Order →
//   Plan Your Visit → Where It Is → Dietary →
//   Pairs Well With → Best For → Sticky CTA
// ════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

// —— Location Map (Amap) ——

function LocationMap({ lng, lat, name, onNav }: { lng: number; lat: number; name: string; onNav: () => void }) {
  const { AMap, loaded } = useAMap();
  const [fullscreen, setFullscreen] = useState(false);
  const inlineRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const inlineMapInst = useRef<any>(null);
  const fullMapInst = useRef<any>(null);

  const addMarker = useCallback((map: any, AMapLib: any, showLabel = false) => {
    const mc = document.createElement('div');
    mc.innerHTML = showLabel
      ? `<div style="display:flex;flex-direction:column;align-items:center">
          <div style="width:28px;height:28px;background:#222;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35)">
            <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
          </div>
          <div style="margin-top:4px;font-size:13px;font-weight:700;color:#222;white-space:nowrap;font-family:'Inter',-apple-system,sans-serif;text-shadow:0 0 4px #fff,0 0 4px #fff">${name}</div>
        </div>`
      : `<div style="width:28px;height:28px;background:#222;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35)">
          <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
        </div>`;
    new AMapLib.Marker({ position: [lng, lat], content: mc, anchor: 'center', map });
  }, [lng, lat, name]);

  useEffect(() => {
    if (!loaded || !AMap || !inlineRef.current || inlineMapInst.current) return;
    const map = new AMap.Map(inlineRef.current, {
      center: [lng, lat], zoom: 13, mapStyle: 'amap://styles/normal',
      dragEnable: false, zoomEnable: false, touchZoom: false, scrollWheel: false,
      doubleClickZoom: false, keyboardEnable: false, showIndoorMap: false, viewMode: '2D',
    });
    addMarker(map, AMap, false);
    inlineMapInst.current = map;
    return () => { map.destroy(); inlineMapInst.current = null; };
  }, [loaded, AMap, lng, lat, addMarker]);

  useEffect(() => {
    if (!fullscreen || !loaded || !AMap || !fullRef.current) return;
    let map: any;
    const timer = setTimeout(() => {
      if (!fullRef.current) return;
      map = new AMap.Map(fullRef.current, {
        center: [lng, lat], zoom: 12, mapStyle: 'amap://styles/normal',
        showIndoorMap: false, viewMode: '2D',
      });
      addMarker(map, AMap, true);
      AMap.plugin('AMap.Geolocation', () => {
        const geo = new AMap.Geolocation({
          enableHighAccuracy: true, showButton: false, showMarker: true, showCircle: true,
          markerOptions: { content: '<div style="width:14px;height:14px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(66,133,244,.5)"></div>', offset: new AMap.Pixel(-7, -7) },
          circleOptions: { fillColor: 'rgba(66,133,244,0.1)', strokeColor: 'rgba(66,133,244,0.3)', strokeWeight: 1 },
        });
        map.addControl(geo);
        geo.getCurrentPosition();
      });
      fullMapInst.current = map;
    }, 50);
    return () => { clearTimeout(timer); if (map) { map.destroy(); fullMapInst.current = null; } };
  }, [fullscreen, loaded, AMap, lng, lat, addMarker]);

  useEffect(() => { if (fullscreen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; } }, [fullscreen]);

  if (!loaded) return <div style={{ aspectRatio: '4/3.5', borderRadius: 20, background: '#f5f5f5', margin: '16px 0' }} />;

  return (
    <>
      <style>{`.amap-logo,.amap-copyright,.amap-mcode{display:none!important}`}</style>
      <div style={{ margin: '16px 0', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3.5', position: 'relative' }}>
        <div ref={inlineRef} style={{ width: '100%', height: '100%' }} />
        <button onClick={() => setFullscreen(true)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.92)', border: '1px solid rgba(0,0,0,.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} aria-label="Expand map">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <AnimatePresence>
        {fullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 310, background: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '52px 16px 12px' }}>
              <button onClick={onNav} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="7" stroke="#222" strokeWidth="2"/><path d="M16 16l5 5" stroke="#222" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button onClick={() => setFullscreen(false)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#222', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>✕</button>
            </div>
            <div ref={fullRef} style={{ flex: 1 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// —— Gallery ——

function ImageViewer({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(startIndex);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollLeft = startIndex * window.innerWidth; }, [startIndex]);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { setCurrent(Math.round(el.scrollLeft / window.innerWidth)); ticking = false; }); } };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 310, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '52px 16px 12px', flexShrink: 0 }}>
        <button onClick={() => { try { navigator.share({ url: window.location.href }); } catch { navigator.clipboard.writeText(window.location.href); } }}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⤴</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{current + 1} / {images.length}</span>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div ref={scrollRef} className="img-viewer-scroll" style={{ flex: 1, display: 'flex', overflowX: 'scroll', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {images.map((src, i) => (
          <div key={i} style={{ width: '100vw', flexShrink: 0, scrollSnapAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {Math.abs(i - current) <= 5 ? <img src={src} alt="" loading={Math.abs(i - current) <= 1 ? 'eager' : 'lazy'} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 4 }} /> : <div style={{ width: '100%', height: 300 }} />}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ImageGrid({ images, onClose, onImageTap }: { images: string[]; onClose: () => void; onImageTap: (i: number) => void }) {
  const even = images.filter((_, i) => i % 2 === 0);
  const odd = images.filter((_, i) => i % 2 === 1);
  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, zIndex: 310, background: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '52px 16px 12px', borderBottom: '1px solid #ebebeb' }}>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.05)', border: 'none', color: '#222', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{images.length} photos</span>
        <div style={{ width: 32 }} />
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>{even.map((src, ci) => { const idx = ci * 2; return <img key={idx} src={src} alt="" loading="lazy" onClick={() => onImageTap(idx)} style={{ width: '100%', borderRadius: 2, cursor: 'pointer', display: 'block' }} />; })}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>{odd.map((src, ci) => { const idx = ci * 2 + 1; return <img key={idx} src={src} alt="" loading="lazy" onClick={() => onImageTap(idx)} style={{ width: '100%', borderRadius: 2, cursor: 'pointer', display: 'block' }} />; })}</div>
      </div>
    </motion.div>
  );
}

// —— Dietary color ——
function dietColor(status: string) {
  const s = String(status).toLowerCase();
  if (s === 'yes' || s === 'great') return { bg: '#f0fdf4', color: '#16a34a' };
  if (s === 'no') return { bg: '#fef2f2', color: '#dc2626' };
  return { bg: '#fffbeb', color: '#b45309' };
}

// ════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════

export default function RestaurantDetail({ data }: { data: any }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [galleryMode, setGalleryMode] = useState<'closed' | 'viewer' | 'grid'>('closed');
  const [viewerIndex, setViewerIndex] = useState(0);
  const gallerySource = useRef<'hero' | 'grid'>('hero');

  useEffect(() => { const fn = () => setNavScrolled(window.scrollY > 200); window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn); }, []);
  useEffect(() => { if (galleryMode !== 'closed') { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; } }, [galleryMode]);

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); }, []);
  const copyText = useCallback((text: string, msg?: string) => { navigator.clipboard.writeText(text).catch(() => {}); showToast(msg || 'Copied!'); }, [showToast]);

  if (!data) return null;

  // ── Destructure nested profile ──
  const p = data.profile || {};
  const card = p.layer1_card || {};
  const detail = p.layer2_detail || {};
  const internal = p.internal || {};

  const identity = card.identity || {};
  const vibe = card.vibe || {};
  const price = card.price || {};
  const dietary = card.dietary || {};
  const tags = card.tags || {};
  const practical = detail.practical || {};
  const gettingThere = detail.getting_there || {};
  const whatToOrder = detail.what_to_order || {};
  const howToOrder = detail.how_to_order || {};
  const barSpecific = detail.bar_specific || {};
  const relational = internal.relational || {};

  // ── Derived ──
  const images: string[] = (data.images || []).filter((s: any) => typeof s === 'string');
  const nameEn = data.name_en || identity.name_en || '';
  const nameCn = data.name_cn || identity.name_cn || '';
  const neighborhood = identity.neighborhood_en || '';
  const cuisineType = identity.cuisine_type || '';
  const venueType = identity.venue_type || '';
  const verdict = card.verdict || '';
  const rating = tags.rating_adjusted || tags.rating;
  const bestFor: string[] = tags.best_for || [];
  const priceCny = price.price_per_person_cny;
  const priceUsd = price.price_per_person_usd;
  const priceTier = price.price_tier || '';
  const shortPrice = priceCny ? `¥${priceCny}` : null;
  const vibeTags: string[] = vibe.tags || [];
  const vibeDesc = vibe.description || '';
  const topDishes: any[] = whatToOrder.top_dishes || [];
  const drinks: any[] = barSpecific.what_to_drink || [];
  const skipNote = whatToOrder.skip || '';
  const completeMeal = whatToOrder.complete_meal || '';
  const warnings: any[] = detail.warnings || [];
  const orderSteps: string[] = howToOrder.steps || [];
  const commonMistakes: string[] = howToOrder.common_mistakes || [];
  const pairsWellWith: string[] = relational.pairs_well_with || [];
  const hasCoords = data.latitude && data.longitude;

  const handleAsk = () => { window.location.href = `/chat?restaurant=${data.slug}`; };
  const handleNav = () => {
    const dest = encodeURIComponent(`${nameCn} ${gettingThere.address_cn || ''}`.trim());
    window.open(`https://uri.amap.com/search?keyword=${dest}&callnative=1`, '_blank');
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#fff', color: '#111', maxWidth: 430, margin: '0 auto', fontSize: 15, lineHeight: 1.55, paddingBottom: 80 }}>
      <style>{`.hl-scroll::-webkit-scrollbar{display:none}.hl-scroll{scrollbar-width:none}.img-viewer-scroll::-webkit-scrollbar{display:none}.img-viewer-scroll{scrollbar-width:none}`}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', height: 52 }}>
        <button onClick={() => window.history.back()} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', opacity: navScrolled ? 1 : 0, transition: 'opacity .3s' }}>{nameEn}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { try { navigator.share({ url: window.location.href }); } catch { navigator.clipboard.writeText(window.location.href); showToast('Link copied!'); } }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>⤴</button>
          <button onClick={() => { setSaved(!saved); showToast(saved ? 'Removed' : 'Saved'); }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: saved ? '#e53e3e' : '#111' }}>{saved ? '♥' : '♡'}</button>
        </div>
      </nav>

      {/* ═══ PHOTO GRID — 1 hero + 2 small (Belloco layout) ═══ */}
      {images.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '160px 120px', gap: 2 }}>
            <div style={{ gridColumn: '1 / 3', gridRow: 1, cursor: 'pointer' }}
              onClick={() => { gallerySource.current = 'hero'; setViewerIndex(0); setGalleryMode('viewer'); }}>
              <img src={images[0]} alt={nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {[1, 2].map(i => images[i] ? (
              <div key={i} style={{ cursor: 'pointer' }} onClick={() => { gallerySource.current = 'hero'; setViewerIndex(i); setGalleryMode('viewer'); }}>
                <img src={images[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null)}
          </div>
          {images.length > 3 && (
            <button onClick={() => { gallerySource.current = 'hero'; setGalleryMode('grid'); }}
              style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              📷 See all {images.length} photos
            </button>
          )}
        </div>
      )}

      {/* ═══ IDENTITY ═══ */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {cuisineType && <span style={{ fontSize: 11, fontWeight: 500, background: '#f3f4f6', color: '#555', padding: '3px 10px', borderRadius: 20, border: '1px solid #e8e8e8' }}>{cuisineType}</span>}
          {venueType && <span style={{ fontSize: 11, fontWeight: 500, background: '#f3f4f6', color: '#555', padding: '3px 10px', borderRadius: 20, border: '1px solid #e8e8e8' }}>{venueType}</span>}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 3 }}>{nameEn}</div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>{nameCn}{neighborhood ? ` · ${neighborhood}` : ''}</div>
        {practical.hours && (
          <div style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>{practical.hours}</div>
        )}
        {rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 1 }}>{'★'.repeat(Math.round(Number(rating)))}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{rating}</span>
            <span style={{ fontSize: 12, color: '#888' }}>Adjusted</span>
          </div>
        )}
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
        {shortPrice && <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{shortPrice}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>per person</div>
        </div>}
        {priceTier && <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{priceTier}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>price tier</div>
        </div>}
        {cuisineType && <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>🍽️</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{cuisineType}</div>
        </div>}
      </div>

      {/* ═══ VERDICT ═══ */}
      {verdict && (
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: '#222', lineHeight: 1.6, marginBottom: 10 }}>&ldquo;{verdict}&rdquo;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e53e3e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>HC</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>HelloChina AI Guide</div>
              <div style={{ fontSize: 11, color: '#888' }}>Local knowledge · Updated Mar 2026</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ THE VIBE ═══ */}
      {(vibeTags.length > 0 || vibeDesc) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>The vibe</div>
        </div>
        {vibeDesc && <div style={{ padding: '0 16px', fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 12 }}>{vibeDesc}</div>}
        {vibeTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 16px' }}>
            {vibeTags.map((t: string, i: number) => <span key={i} style={{ fontSize: 12, background: '#f3f4f6', color: '#444', padding: '5px 12px', borderRadius: 20, border: '1px solid #e8e8e8' }}>{t}</span>)}
          </div>
        )}
        {vibe.dress_code && <div style={{ padding: '10px 16px 0', fontSize: 12, color: '#888' }}>Dress code: {vibe.dress_code}</div>}
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ PRICING ═══ */}
      {shortPrice && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Pricing &amp; booking</div>
          <div style={{ background: '#111', borderRadius: 12, padding: 16, color: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>Realistic budget</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{shortPrice}</div>
            {priceUsd && <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>Approximately ${priceUsd} USD</div>}
          </div>
        </div>
        {practical.reservation && <div style={{ padding: '12px 16px 0', fontSize: 13, color: '#666', lineHeight: 1.5 }}><strong style={{ color: '#111' }}>Reservation: </strong>{practical.reservation}</div>}
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ WHEN TO GO ═══ */}
      {practical.best_time && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>When to go</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 22, flexShrink: 0, fontSize: 16, marginTop: 1, textAlign: 'center', color: '#16a34a' }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', marginBottom: 2 }}>Best time</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{practical.best_time}</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ WHAT TO ORDER ═══ */}
      {(topDishes.length > 0 || drinks.length > 0) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>What to order</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topDishes.map((dish: any, i: number) => {
              const dishImg = dish.image_url || (images.length > i + 3 ? images[i + 3] : null);
              const isMust = dish.comfort_level >= 4;
              return (
                <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
                  {dishImg && <img src={dishImg} alt={dish.dish_name_en} style={{ width: 110, height: 110, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ padding: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: isMust ? '#e53e3e' : '#2563eb', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 5 }}>{isMust ? 'Must order' : 'Highlight'}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{dish.dish_name_en}</div>
                    {dish.dish_name_cn && <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{dish.dish_name_cn}</div>}
                    {dish.description && <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{dish.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {dish.price_cny && <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>¥{dish.price_cny}</span>}
                      {dish.ordering_tip && <span style={{ fontSize: 11, color: '#b45309', background: '#fffbeb', borderRadius: 6, padding: '3px 7px' }}>💡 {dish.ordering_tip}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Drinks (bars) */}
            {drinks.map((d: any, i: number) => (
              <div key={`d${i}`} style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: '#7c3aed', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 5 }}>Drink</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{d.drink_name_en}</div>
                {d.drink_name_cn && <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{d.drink_name_cn}</div>}
                {d.description && <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{d.description}</div>}
                {d.price_cny && <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>¥{d.price_cny}</span>}
              </div>
            ))}
          </div>
        </div>
        {skipNote && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🚫</span>
              <span style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}><strong>Skip:</strong> {skipNote}</span>
            </div>
          </div>
        )}
        {completeMeal && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              <strong>Complete meal tip: </strong>{completeMeal}
            </div>
          </div>
        )}
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ HEADS UP ═══ */}
      {warnings.length > 0 && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Heads up</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {warnings.map((w: any, i: number) => (
              <div key={i} style={{ borderLeft: '3px solid #f59e0b', background: '#fffbeb', borderRadius: '0 10px 10px 0', padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>{w.complaint || w.title || w.warning}</div>
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>{w.practical_note || w.advice || w.note}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ HOW TO ORDER ═══ */}
      {(orderSteps.length > 0 || barSpecific.door) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>How to order</div>
          {orderSteps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderSteps.map((step: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>{step}</div>
                </div>
              ))}
            </div>
          )}
          {barSpecific.door && (
            <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              <strong>Getting in: </strong>{barSpecific.door}
            </div>
          )}
          {commonMistakes.map((m: string, i: number) => (
            <div key={i} style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>⚠️ {m}</div>
          ))}
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ PLAN YOUR VISIT ═══ */}
      {(practical.hours || practical.reservation || practical.payment) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Plan your visit</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {practical.hours && (
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>🕐</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 3 }}>Hours</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>{practical.hours}</div>
              </div>
            )}
            {practical.reservation && (
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>📋</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 3 }}>Reservation</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>{practical.reservation}</div>
              </div>
            )}
            {practical.payment && (
              <div style={{ gridColumn: '1 / 3', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>💳</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 3 }}>Payment</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#b45309', lineHeight: 1.4 }}>{practical.payment}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ WHERE IT IS ═══ */}
      {(gettingThere.address_cn || hasCoords) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Where it is</div>
          {gettingThere.address_cn && <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{gettingThere.address_cn}</div>}
          {/* Taxi card */}
          {gettingThere.taxi_tip && (
            <div style={{ border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '14px 16px', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Show this to your taxi driver</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>{nameCn}</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>{gettingThere.address_cn}</div>
              <button onClick={() => copyText(`${nameCn} ${gettingThere.address_cn || ''}`.trim())}
                style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>📋 Copy address</button>
            </div>
          )}
          {gettingThere.finding_it && <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5, marginBottom: 12 }}>{gettingThere.finding_it}</div>}
          {gettingThere.nearest_metro && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>🚇</div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}><strong style={{ color: '#111' }}>{gettingThere.nearest_metro}</strong></div>
            </div>
          )}
          {barSpecific.getting_home && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>🚕</div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{barSpecific.getting_home}</div>
            </div>
          )}
          {hasCoords && <LocationMap lng={data.longitude} lat={data.latitude} name={nameEn} onNav={handleNav} />}
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ DIETARY ═══ */}
      {(dietary.vegetarian || dietary.vegan || dietary.halal || dietary.pork_free) && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Dietary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { key: 'vegetarian', icon: '🥗', label: 'Vegetarian' },
              { key: 'vegan', icon: '🌱', label: 'Vegan' },
              { key: 'pork_free', icon: '🥩', label: 'Pork-free' },
              { key: 'halal', icon: '☪️', label: 'Halal' },
            ].filter(d => dietary[d.key] != null).map(d => {
              const c = dietColor(String(dietary[d.key]));
              return (
                <div key={d.key} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{d.label}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, display: 'inline-block', background: c.bg, color: c.color, textTransform: 'capitalize' }}>{String(dietary[d.key])}</span>
                </div>
              );
            })}
          </div>
          {dietary.note && <div style={{ marginTop: 10, fontSize: 12, color: '#888', lineHeight: 1.5 }}>{dietary.note}</div>}
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ PAIRS WELL WITH ═══ */}
      {pairsWellWith.length > 0 && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Pairs well with</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pairsWellWith.map((pw: string, i: number) => {
              const icons = ['☕', '🚶', '🔄', '🍜', '🎵', '🛍️'];
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, border: '1px solid #f0f0f0', borderRadius: 10 }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{icons[i % icons.length]}</div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{pw}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 0' }} />
      </>)}

      {/* ═══ BEST FOR ═══ */}
      {bestFor.length > 0 && (<>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Best for</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {bestFor.map((t: string, i: number) => {
              const icons: Record<string, string> = { 'date-night': '💑', group: '👫', business: '💼', solo: '🧍', celebration: '🎉', instagram: '📸', family: '👨‍👩‍👧', budget: '💰' };
              return <div key={i} style={{ background: '#f3f4f6', border: '1px solid #e8e8e8', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#444', textAlign: 'center', textTransform: 'capitalize' }}>{icons[t] || '✨'} {t.replace(/-/g, ' ')}</div>;
            })}
          </div>
        </div>
      </>)}

      <div style={{ height: 20 }} />

      {/* ═══ STICKY CTA ═══ */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '10px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 200 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{shortPrice ? `${shortPrice} / person` : nameEn}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{neighborhood}{cuisineType ? ` · ${cuisineType}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleAsk} style={{ border: '1.5px solid #e5e5e5', background: '#fff', color: '#111', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>💬 Ask</button>
          <button onClick={handleNav} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>🧭 Go</button>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#222', color: '#fff', padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 300 }}>{toast}</div>}

      {/* Gallery overlays */}
      <AnimatePresence>
        {galleryMode === 'viewer' && images.length > 0 && <ImageViewer images={images} startIndex={viewerIndex} onClose={() => { if (gallerySource.current === 'grid') setGalleryMode('grid'); else setGalleryMode('closed'); }} />}
        {galleryMode === 'grid' && images.length > 0 && <ImageGrid images={images} onClose={() => setGalleryMode('closed')} onImageTap={(idx) => { gallerySource.current = 'grid'; setViewerIndex(idx); setGalleryMode('viewer'); }} />}
      </AnimatePresence>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
