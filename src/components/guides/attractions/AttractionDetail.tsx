'use client';

import { useState, useEffect, useCallback } from 'react';

// ════════════════════════════════════════════════════════════════
// ATTRACTION PAGE v2 — Universal Template Engine
//
// <AttractionPage data={attractionJson} onAsk={fn} onNavigate={fn} />
//
// Section order (v2):
//   Title → Hook → Stat Strip → Make-or-Break → Pricing →
//   When to Go → ★ Highlights (visual break) → Where It Is →
//   Friend's Take → Route → What Visitors Miss → Heads Up →
//   Preparation → Phrases → Photo Spots → Nearby →
//   Cultural Context → Best For
// ════════════════════════════════════════════════════════════════

// —— Helpers ——

function extractShortPrice(priceRmb: string | number | undefined): string | null {
  if (priceRmb == null) return null;
  const s = typeof priceRmb === 'number' ? `¥${priceRmb}` : String(priceRmb);
  const m = s.match(/[~]?¥?[\d,.]+([\s]*[-–][\s]*[~]?¥?[\d,.]+)?/);
  if (!m) return null;
  let p = m[0].replace(/\s+/g, '');
  if (!p.startsWith('¥')) p = '¥' + p;
  return p;
}

function langInfo(rating: string | number | undefined) {
  if (rating == null) return null;
  const s = String(rating);
  if (s.includes('no-chinese-needed')) return { text: 'No Chinese needed', color: '#008A05' };
  if (s.includes('some-chinese-helps')) return { text: 'Some Chinese helps', color: '#484848' };
  if (s.includes('chinese-required') || s.includes('chinese-essential')) return { text: 'Chinese required', color: '#D0021B' };
  const n = s.match(/^(\d+)(\/10)?/);
  if (n) { const v = parseInt(n[1]); if (v <= 3) return { text: 'No Chinese needed', color: '#008A05' }; if (v <= 6) return { text: 'Some Chinese helps', color: '#484848' }; return { text: 'Chinese helps a lot', color: '#D0021B' }; }
  return null;
}

function badge(appeal: string | number | undefined) {
  if (appeal == null) return { bg: '#F0F5FE', color: '#1a56db', label: 'HIGHLIGHT' };
  const a = '' + appeal;
  if (/^high$/i.test(a)) return { bg: '#FEF0F0', color: '#D0021B', label: "DON'T MISS" };
  if (/^medium$/i.test(a)) return { bg: '#F0F5FE', color: '#1a56db', label: 'WORTH SEEING' };
  if (/^low$/i.test(a)) return { bg: '#FFF8E6', color: '#946800', label: 'IF YOU HAVE TIME' };
  if (/chinese/i.test(a)) return { bg: '#FEF0F0', color: '#D0021B', label: 'UNIQUELY CHINESE' };
  if (/universal/i.test(a)) return { bg: '#F0F5FE', color: '#1a56db', label: 'UNIVERSAL APPEAL' };
  if (/cultural/i.test(a)) return { bg: '#FFF8E6', color: '#946800', label: 'CULTURALLY INTERESTING' };
  return { bg: '#F0F5FE', color: '#1a56db', label: 'HIGHLIGHT' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStats(data: any) {
  const s: { value: string; label: string }[] = [];
  const gi = data.getting_in || {};
  const tn = data.time_needed || {};
  const p = extractShortPrice(gi.price_rmb);
  if (p) s.push({ value: p, label: 'per person' });
  if (tn.recommended) {
    const dm = String(tn.recommended).match(/([\d.]+[-–][\d.]+\s*hours?|[\d.]+\s*hours?)/i);
    if (dm) s.push({ value: dm[0], label: 'duration' });
  }
  const types = [data.experience_type, data.experience_type_secondary].filter(Boolean);
  const icons: Record<string, string> = { social: '🎵', immersive: '🎭', activity: '🏃', cultural: '🏛️', aesthetic: '📸', nightlife: '🌃', family: '👨‍👩‍👧‍👦' };
  if (types.length > 0 && s.length < 3) s.push({ value: icons[String(types[0])] || '✦', label: types.map((t) => { const ts = String(t); return ts.charAt(0).toUpperCase() + ts.slice(1); }).join(' · ') });
  return s.slice(0, 3);
}

const W_ICO = ['⚠️','🔊','🚬','💰','🎵','🪑','🌡️','⏰','📱','🚗'];
const P_ICO = ['🎯','🏠','📸','🎭','🏛️','🌳','✨','🎪'];
const T_ICO = ['🎯','🏷️','🧠','💡','⏰'];
const M_ICO = ['🔮','💡','🌅','👀','🔑'];

// —— Sub-components ——

function Divider() { return <><div style={{ height: 32 }} /><div style={{ height: 1, background: '#ebebeb', margin: '0 20px' }} /><div style={{ height: 32 }} /></>; }

function SH({ children }: { children: React.ReactNode }) { return <div style={{ padding: '0 20px' }}><div className="dm-serif" style={{ fontSize: 22, color: '#222', lineHeight: 1.25, marginBottom: 16 }}>{children}</div></div>; }

function Coll({ title, children, open: defaultOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (<div style={{ borderTop: '1px solid #f5f5f5' }}>
    <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#222', margin: 0 }}>{title}</h3>
      <span style={{ fontSize: 12, color: '#717171', transition: 'transform .3s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
    </div>
    <div style={{ maxHeight: open ? 2000 : 0, overflow: 'hidden', transition: 'max-height .4s ease' }}>{children}</div>
  </div>);
}

function RM({ text, lines = 5 }: { text: string; lines?: number }) {
  const [exp, setExp] = useState(false);
  return (<>
    <div style={exp ? {} : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{text}</div>
    <button onClick={() => setExp(!exp)} style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: '#222', textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none', padding: 0, textUnderlineOffset: 3 }}>{exp ? 'Show less' : 'Show more'}</button>
  </>);
}

function Info({ icon, title, desc }: { icon: string; title?: string; desc: string }) {
  return (<div style={{ display: 'flex', gap: 14, padding: '14px 20px', alignItems: 'flex-start', borderTop: '1px solid #f5f5f5' }}>
    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 1 }}>{title}</div>}
      <div style={{ fontSize: 13, color: '#717171', lineHeight: 1.5 }}>{desc}</div>
    </div>
  </div>);
}

interface PhraseData { pinyin: string; chinese: string; english: string }

function Phrase({ phrase, onLongPress }: { phrase: PhraseData; onLongPress: (p: PhraseData) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(phrase.chinese).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  return (<div onClick={copy} onContextMenu={(e) => { e.preventDefault(); onLongPress(phrase); }}
    style={{ padding: 12, background: '#f7f7f7', borderRadius: 10, cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 1 }}>{phrase.chinese}</div>
    <div style={{ fontSize: 10, color: '#717171', marginBottom: 4 }}>{phrase.pinyin}</div>
    <div style={{ fontSize: 11, color: '#484848', fontWeight: 500, lineHeight: 1.3 }}>{phrase.english}</div>
    {copied && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,138,5,.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, borderRadius: 10 }}>Copied ✓</div>}
  </div>);
}

function StaffOverlay({ phrase, onClose }: { phrase: PhraseData | null; onClose: () => void }) {
  if (!phrase) return null;
  return (<div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 30px', textAlign: 'center' }}>
    <div style={{ fontSize: 48, fontWeight: 700, color: '#222', lineHeight: 1.3, marginBottom: 8 }}>{phrase.chinese}</div>
    <div style={{ fontSize: 16, color: '#717171', marginBottom: 4 }}>{phrase.pinyin}</div>
    <div style={{ fontSize: 14, color: '#484848', marginBottom: 32 }}>{phrase.english}</div>
    <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: 10, background: '#222', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Done</button>
    <div style={{ fontSize: 11, color: '#b0b0b0', marginTop: 16 }}>Show this screen to the person you&apos;re talking to</div>
  </div>);
}

function SmartRoute({ text }: { text: string }) {
  if (!text) return null;
  if (text.includes('→')) {
    const steps = text.split(/\s*→\s*/);
    return (<div style={{ padding: '0 20px' }}>{steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < steps.length - 1 ? 16 : 0, position: 'relative' }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#D0021B' : '#222', zIndex: 1, flexShrink: 0, marginTop: 5 }} />
          {i < steps.length - 1 && <div style={{ position: 'absolute', top: 17, left: '50%', transform: 'translateX(-50%)', width: 1, bottom: 0, background: '#e0e0e0' }} />}
        </div>
        <div style={{ flex: 1, fontSize: 13, color: '#484848', lineHeight: 1.55 }}>{s.trim()}</div>
      </div>))}</div>);
  }
  if (/^\d+[.)]\s/m.test(text)) {
    const steps = text.split(/(?=\d+[.)]\s)/).filter(s => s.trim());
    return (<div style={{ padding: '0 20px' }}>{steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#222', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
        <div style={{ flex: 1, fontSize: 13, color: '#484848', lineHeight: 1.55 }}>{s.replace(/^\d+[.)]\s*/, '').trim()}</div>
      </div>))}</div>);
  }
  return <div style={{ padding: '0 20px', fontSize: 13, color: '#484848', lineHeight: 1.55 }}>{text}</div>;
}

// —— Main Component ——————————————————————————————————————————————

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AttractionPage({ data, onAsk, onNavigate }: { data: any; onAsk?: () => void; onNavigate?: () => void }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [staffPhrase, setStaffPhrase] = useState<PhraseData | null>(null);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 200);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); }, []);
  const copyText = useCallback((text: string, msg?: string) => { navigator.clipboard.writeText(text).catch(() => {}); showToast(msg || 'Copied!'); }, [showToast]);

  if (!data) return null;

  const gi = data.getting_in || {};
  const tn = data.time_needed || {};
  const bt = data.best_time || {};
  const prep = data.preparation || {};
  const pa = data.physical_accessibility || {};
  const strat = data.strategy || {};
  const highlights = data.highlights || data.experience_highlights || [];
  const headsUp = data.heads_up || [];
  const phrases = data.useful_chinese || [];
  const photoSpots = data.photo_spots || [];
  const pairWith = data.pair_with || [];
  const missItems = data.what_visitors_miss || [];
  const bestFor = data.best_for || [];
  const priceBreakdown = gi.price_breakdown || [];
  const images = data.images || [];

  const stats = buildStats(data);
  const lang = langInfo(gi.language_barrier_rating);
  const shortPrice = extractShortPrice(gi.price_rmb);
  const types = [data.experience_type, data.experience_type_secondary].filter(Boolean).map(String);
  const taxiText = `${data.attraction_name_cn} ${data.address_cn || ''}`.trim();

  const handleAsk = onAsk || (() => { window.location.href = `/chat?attraction=${data.slug}`; });
  const handleNav = onNavigate || (() => {
    const dest = encodeURIComponent(`${data.attraction_name_cn} ${data.address_cn || ''}`.trim());
    window.open(`https://uri.amap.com/search?keyword=${dest}&callnative=1`, '_blank');
  });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#fff', color: '#222', lineHeight: 1.5, maxWidth: 430, margin: '0 auto', overflowX: 'hidden', paddingBottom: 80, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');.dm-serif{font-family:'DM Serif Display',Georgia,serif}.hl-scroll::-webkit-scrollbar{display:none}.hl-scroll{scrollbar-width:none}`}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '48px 16px 10px', zIndex: 100, transition: 'background .3s, box-shadow .3s', ...(navScrolled ? { background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(0,0,0,.06)' } : {}) }}>
        <button onClick={() => window.history.back()} style={{ width: 32, height: 32, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#222', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}>←</button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: '#222', opacity: navScrolled ? 1 : 0, transition: 'opacity .3s', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.attraction_name_en}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#222', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}>⤴</button>
          <button onClick={() => { setSaved(!saved); showToast(saved ? 'Removed' : 'Saved to your trip'); }} style={{ width: 32, height: 32, borderRadius: '50%', background: navScrolled ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', border: 'none', color: saved ? '#D0021B' : '#222', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,.12)' }}>{saved ? '♥' : '♡'}</button>
        </div>
      </nav>

      {/* ═══ IMAGE GRID ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3, height: 340, paddingTop: 44 }}>
        {[0,1,2,3].map(i => (<div key={i} style={{ backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#e8e8e8', backgroundImage: images[i] ? `url(${images[i]})` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b0', fontSize: 24 }}>{!images[i] && '📷'}</div>))}
      </div>

      {/* ═══ TITLE ═══ */}
      <div style={{ padding: '24px 20px 0' }}>
        {types.length > 0 && <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{types.map((t: string, i: number) => <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#717171', background: '#f7f7f7', padding: '4px 10px', borderRadius: 20, letterSpacing: .3, textTransform: 'capitalize' }}>{t}</span>)}</div>}
        <h1 className="dm-serif" style={{ fontSize: 26, fontWeight: 400, color: '#222', lineHeight: 1.2, letterSpacing: -.2, marginBottom: 4 }}>{data.attraction_name_en}</h1>
        <p style={{ fontSize: 13, color: '#717171', marginBottom: 0 }}>{data.attraction_name_cn}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 13, color: '#484848', fontWeight: 500 }}>
          {tn.recommended && <><span>{String(tn.recommended).split('—')[0].trim()}</span><span style={{ color: '#c0c0c0', margin: '0 2px' }}>·</span></>}
          {lang && <span style={{ color: lang.color, fontWeight: 600 }}>{lang.text}</span>}
        </div>
      </div>
      <Divider />

      {/* ═══ HOOK ═══ */}
      {data.hook && (<><div style={{ padding: '0 20px' }}>
        <p className="dm-serif" style={{ fontSize: 18, fontStyle: 'italic', color: '#222', lineHeight: 1.5 }}>&ldquo;{data.hook}&rdquo;</p>
        {data.vibe && <p style={{ fontSize: 13, color: '#717171', marginTop: 10, lineHeight: 1.55 }}>{data.vibe}</p>}
      </div></>)}

      {/* ═══ STAT STRIP ═══ */}
      {stats.length > 0 && (<div style={{ display: 'flex', margin: '20px 20px 0', border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
        {stats.map((s, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderRight: i < stats.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
          <div className="dm-serif" style={{ fontSize: 17, color: '#222' }}>{s.value}</div>
          <div style={{ fontSize: 10, color: '#717171', fontWeight: 500, marginTop: 2, letterSpacing: .2 }}>{s.label}</div>
        </div>))}
      </div>)}
      <Divider />

      {/* ═══ MAKE-OR-BREAK ═══ */}
      {data.foreigner_top_question && (<><div style={{ margin: '0 20px', padding: 18, background: '#f7f7f7', borderRadius: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#D0021B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Make-or-Break Question</div>
        <div className="dm-serif" style={{ fontSize: 17, color: '#222', marginBottom: 10, lineHeight: 1.3 }}>&ldquo;{data.foreigner_top_question}&rdquo;</div>
        <div style={{ fontSize: 14, color: '#484848', lineHeight: 1.6 }}><RM text={data.foreigner_top_answer} lines={3} /></div>
      </div>
      {data.experience_format_note && <Coll title="How it works"><div style={{ padding: '0 20px 16px', fontSize: 13, color: '#484848', lineHeight: 1.65 }}>{data.experience_format_note}</div></Coll>}
      <Divider /></>)}

      {/* ═══ PRICING ═══ */}
      {gi.price_rmb && (<><SH>Pricing &amp; booking</SH>
        <div style={{ margin: '0 20px', padding: 16, background: '#222', borderRadius: 12, color: '#fff', marginBottom: priceBreakdown.length ? 0 : 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>Realistic budget</div>
          <div className="dm-serif" style={{ fontSize: 24 }}>{shortPrice || String(gi.price_rmb).split('.')[0]}</div>
          {gi.price_usd && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{typeof gi.price_usd === 'number' ? `~$${gi.price_usd}` : gi.price_usd}</div>}
        </div>
        {priceBreakdown.length > 0 && priceBreakdown.map((row: { item: string; price: string; highlight?: boolean }, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
            <span style={{ fontSize: 13, color: '#717171' }}>{row.item}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: row.highlight ? '#008A05' : '#222' }}>{row.price}</span>
          </div>
        ))}
        <div style={{ padding: '8px 20px 0', textAlign: 'right' }}><span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>Prices checked Feb 2026</span></div>
        <Coll title="Booking & reservation"><div style={{ padding: '0 20px 16px', fontSize: 13, color: '#484848', lineHeight: 1.65 }}>
          {gi.booking_required && <><strong>Booking: </strong>{typeof gi.booking_required === 'string' ? gi.booking_required : 'Required'}<br /><br /></>}
          {gi.booking_method && <><strong>How: </strong>{gi.booking_method}<br /><br /></>}
          {gi.passport_accepted !== undefined && <><strong>ID: </strong>{typeof gi.passport_accepted === 'string' ? gi.passport_accepted : gi.passport_accepted ? 'Passport accepted' : 'No ID needed'}<br /><br /></>}
          {gi.queue_situation && <><strong>Queue: </strong>{gi.queue_situation}</>}
        </div></Coll>
      <Divider /></>)}

      {/* ═══ WHEN TO GO ═══ */}
      {(bt.best_time_of_day || bt.worst_time) && (<><SH>When to go</SH>
        {bt.best_time_of_day && <Info icon="✓" title="Best time" desc={bt.best_time_of_day} />}
        {bt.worst_time && <Info icon="✗" title="Worst time" desc={bt.worst_time} />}
        {bt.pro_tip && <Info icon="💡" title="Pro tip" desc={bt.pro_tip} />}
        {bt.seasonal_notes && <Info icon="🍂" title="Seasonal" desc={bt.seasonal_notes} />}
      <Divider /></>)}

      {/* ═══ HIGHLIGHTS (after When to Go — visual break) ═══ */}
      {highlights.length > 0 && (<><SH>What makes this special</SH>
        <div className="hl-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 20px 4px' }}>
          {highlights.map((hl: { name: string; description: string; foreigner_appeal?: string; foreigner_note?: string; tip?: string; image?: string }, i: number) => { const b = badge(hl.foreigner_appeal); const hlImg = hl.image && !/^https?:\/\//.test(hl.image) ? `https://exybdmfburmyseaqchat.supabase.co/storage/v1/object/public/attraction-images/${data.slug}/${hl.image}` : hl.image; return (
            <div key={i} style={{ minWidth: hlImg ? 280 : 240, maxWidth: 280, scrollSnapAlign: 'start', borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #ebebeb', flexShrink: 0 }}>
              {hlImg && <div style={{ width: '100%', height: 220, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${hlImg})` }} />}
              <div style={{ padding: '12px 14px' }}>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, padding: '2px 7px', borderRadius: 4, marginBottom: 6, background: b.bg, color: b.color }}>{b.label}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 4, lineHeight: 1.3 }}>{hl.name}</div>
                <div style={{ fontSize: 12, color: '#717171', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{hl.description}</div>
                {hl.tip && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#484848', lineHeight: 1.45 }}><strong style={{ color: '#222' }}>Tip:</strong> {hl.tip}</div>}
              </div>
            </div>); })}
        </div>
      <Divider /></>)}

      {/* ═══ WHERE IT IS ═══ */}
      {data.address_cn && (<><SH>Where it is</SH>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{data.address_cn}</div>
          <div style={{ marginTop: 14, padding: 14, border: '1.5px dashed #d0d0d0', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#717171', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>Show this to your taxi driver</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 2 }}>{data.attraction_name_cn}</div>
            <div style={{ fontSize: 11, color: '#717171', marginBottom: 10 }}>{data.address_cn}</div>
            <button onClick={() => copyText(taxiText, 'Address copied!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, background: '#222', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>📋 Copy address</button>
          </div>
        </div>
      <Divider /></>)}

      {/* ═══ FRIEND'S TAKE (with bottom-line TLDR) ═══ */}
      {data.honest_description && (<><div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #D0021B, #ff4757)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>HC</div>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>HelloChina AI Guide</div><div style={{ fontSize: 11, color: '#717171' }}>Local knowledge · Updated Feb 2026</div></div>
        </div>
        {data.vibe && <div style={{ padding: '12px 14px', background: '#f7f7f7', borderRadius: 10, marginBottom: 12 }}><strong style={{ fontSize: 13, color: '#222' }}>Bottom line: </strong><span style={{ fontSize: 13, color: '#484848' }}>{data.vibe}</span></div>}
        <div style={{ fontSize: 15, color: '#484848', lineHeight: 1.65 }}><RM text={data.honest_description} lines={4} /></div>
      </div><Divider /></>)}

      {/* ═══ ROUTE ═══ */}
      {strat.smart_route && (<><SH>Your best route</SH>
        <SmartRoute text={strat.smart_route} />
        {strat.pro_tips?.length > 0 && (<><div style={{ padding: '16px 20px 8px' }}><span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>Pro tips</span></div>
          {strat.pro_tips.map((t: string, i: number) => <Info key={i} icon={T_ICO[i % 5]} desc={t} />)}</>)}
        {strat.what_to_skip && <Coll title="What to skip"><div style={{ padding: '0 20px 16px', fontSize: 13, color: '#484848', lineHeight: 1.65 }}>{strat.what_to_skip}</div></Coll>}
      <Divider /></>)}

      {/* ═══ WHAT VISITORS MISS ═══ */}
      {missItems.length > 0 && (<><SH>What most visitors miss</SH>
        {missItems.map((m: { what: string; why: string }, i: number) => <Info key={i} icon={M_ICO[i % 5]} title={m.what} desc={m.why} />)}
      <Divider /></>)}

      {/* ═══ HEADS UP ═══ */}
      {headsUp.length > 0 && (<><SH>Things to know</SH>
        {headsUp.map((h: { warning: string; advice: string }, i: number) => { const item = typeof h === 'object' && h ? h : { warning: '', advice: String(h ?? '') }; return <Info key={i} icon={W_ICO[i % 10]} title={item.warning} desc={item.advice} />; })}
      <Divider /></>)}

      {/* ═══ PREPARATION ═══ */}
      {(prep.what_to_wear || prep.what_to_bring) && (<Coll title="What to wear & bring">
        {prep.what_to_wear && <Info icon="👔" title="Wear" desc={prep.what_to_wear} />}
        {prep.what_to_bring && <Info icon="🎒" title="Bring" desc={prep.what_to_bring} />}
        {prep.what_not_to_bring && <Info icon="🚫" title="Don't bring" desc={prep.what_not_to_bring} />}
      </Coll>)}
      {pa.physical_intensity && (<Coll title="Physical & accessibility"><div style={{ padding: '0 20px 16px', fontSize: 13, color: '#484848', lineHeight: 1.65 }}>
        <strong>{String(pa.physical_intensity).charAt(0).toUpperCase() + String(pa.physical_intensity).slice(1)} intensity</strong>
        {pa.physical_details && <> — {pa.physical_details}</>}<br /><br />
        {pa.age_notes && <><strong>Age: </strong>{pa.age_notes}<br /><br /></>}
        {pa.health_warnings && <><strong>Health: </strong>{pa.health_warnings}</>}
      </div></Coll>)}
      {(prep.what_to_wear || prep.what_to_bring || pa.physical_intensity) && <Divider />}

      {/* ═══ PHRASES ═══ */}
      {phrases.length > 0 && (<><SH>Useful Chinese</SH>
        <div style={{ padding: '0 20px 12px', fontSize: 12, color: '#717171' }}>Tap to copy · Long-press to show full screen</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px' }}>
          {phrases.map((p: PhraseData, i: number) => <Phrase key={i} phrase={p} onLongPress={setStaffPhrase} />)}
        </div>
      <Divider /></>)}

      {/* ═══ PHOTO SPOTS ═══ */}
      {photoSpots.length > 0 && (<><SH>Best photo spots</SH>
        {photoSpots.map((s: { location: string; tip: string; why?: string }, i: number) => (<div key={i} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 3 }}>📸 {s.location}</div>
          <div style={{ fontSize: 13, color: '#717171', lineHeight: 1.5, marginBottom: 4 }}>{s.tip}</div>
          {s.why && <div style={{ fontSize: 12, color: '#484848', fontStyle: 'italic' }}>{s.why}</div>}
        </div>))}
      <Divider /></>)}

      {/* ═══ NEARBY ═══ */}
      {pairWith.length > 0 && (<><SH>Nearby</SH>
        {pairWith.map((p: { suggestion: string; why: string; travel_time?: string }, i: number) => (<div key={i} style={{ display: 'flex', gap: 12, padding: '14px 20px', alignItems: 'flex-start', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{P_ICO[i % 8]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 1 }}>{p.suggestion}</div>
            {p.travel_time && <div style={{ fontSize: 11, color: '#717171', marginBottom: 3 }}>{p.travel_time}</div>}
            <div style={{ fontSize: 12, color: '#717171', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{p.why}</div>
          </div>
          <div style={{ color: '#b0b0b0', fontSize: 14, flexShrink: 0, marginTop: 4 }}>›</div>
        </div>))}
      <Divider /></>)}

      {/* ═══ CULTURAL CONTEXT ═══ */}
      {data.cultural_context && (<><SH>Why this matters</SH>
        <div style={{ padding: '0 20px', fontSize: 14, color: '#484848', lineHeight: 1.65 }}><RM text={data.cultural_context} lines={4} /></div>
      <Divider /></>)}

      {/* ═══ BEST FOR ═══ */}
      {bestFor.length > 0 && (<>
        <div style={{ padding: '0 20px 8px' }}><span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>Best for</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px 24px' }}>
          {bestFor.map((t: string, i: number) => <span key={i} onClick={() => showToast(`Browsing ${String(t).replace(/-/g, ' ')} attractions...`)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #e0e0e0', fontSize: 12, fontWeight: 500, color: '#484848', textTransform: 'capitalize', cursor: 'pointer', transition: 'all .15s' }}>{String(t).replace(/-/g, ' ')}</span>)}
        </div>
      </>)}

      <div style={{ height: 60 }} />

      {/* ═══ STICKY BOTTOM (dual CTA) ═══ */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid #ebebeb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 100 }}>
        <div style={{ fontSize: 10, color: '#717171' }}><strong style={{ fontSize: 15, fontWeight: 700, color: '#222', display: 'block' }}>{shortPrice || 'See pricing'}</strong>per person</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleAsk} style={{ padding: '10px 14px', borderRadius: 10, background: '#fff', color: '#222', fontSize: 13, fontWeight: 600, border: '1.5px solid #222', cursor: 'pointer', whiteSpace: 'nowrap' }}>💬 Ask</button>
          <button onClick={handleNav} style={{ padding: '10px 14px', borderRadius: 10, background: '#D0021B', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>🧭 Go</button>
        </div>
      </div>

      {/* ═══ TOAST ═══ */}
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#222', color: '#fff', padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 200 }}>{toast}</div>}

      {/* ═══ SHOW-TO-STAFF OVERLAY ═══ */}
      <StaffOverlay phrase={staffPhrase} onClose={() => setStaffPhrase(null)} />
    </div>
  );
}
