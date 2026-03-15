'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { COLLECTIONS, getThemeStyles } from '../data/collections-data';
import { useCollectionData } from '../hooks/useCollectionData';
import type { AttractionData } from '@/types/attraction';

interface CollectionDetailScreenProps {
  onNavigate: (screen: string) => void;
  collectionId: string;
  onOpenAttraction?: (slug: string, heroImage: string) => void;
  selectedSlug?: string | null;
}

export default function CollectionDetailScreen({ onNavigate, collectionId, onOpenAttraction, selectedSlug }: CollectionDetailScreenProps) {
  const def = COLLECTIONS[collectionId];
  const theme = useMemo(() => getThemeStyles(def), [def]);
  const { attractions, loading } = useCollectionData(def.slugs);

  const hero = attractions[0] ?? null;
  const rest = attractions.slice(1);

  return (
    <div className="v2-scroll-body" style={{ background: def.bgColor, paddingBottom: 'calc(var(--v2-bottom-nav-total-height) + 16px)' }}>
      {/* HERO */}
      <div className={`v2-fg-hero ${def.isDark ? 'v2-fg-hero-dark' : ''}`}>
        <div className="v2-fg-hero-img" style={{ background: def.heroBg }}>
          <div className="v2-fg-hero-emoji" style={def.heroEmojiStyle}>{def.emoji}</div>
          {def.heroNeon && <div className="v2-fg-hero-neon" style={def.heroNeonStyle}>{def.heroNeon}</div>}
        </div>
        <div className={theme.heroOverlayClass} />
        <div className="v2-fg-back-btn" style={theme.backBtnStyle} onClick={() => onNavigate('shanghai-all')}>&larr; Back</div>
        <div className="v2-fg-hero-body">
          <div className="v2-fg-eyebrow" style={{ color: theme.eyebrowColor }}>{def.eyebrow}</div>
          <div className="v2-fg-hero-title" style={{ color: theme.titleColor }}>{def.title}</div>
          <div className="v2-fg-hero-desc" style={{ color: theme.descColor }}>{def.desc}</div>
        </div>
      </div>

      {/* HERO PLACE CARD */}
      {loading ? (
        <LoadingSkeleton isDark={def.isDark} />
      ) : hero ? (
        <HeroCard attraction={hero} theme={theme} onOpenAttraction={onOpenAttraction} />
      ) : null}

      {/* SUPPORTING CARDS */}
      <div className="v2-fg-section-label" style={theme.sectionLabelStyle}>{def.sectionLabel}</div>

      {loading ? (
        <>
          <LoadingCardSkeleton isDark={def.isDark} />
          <LoadingCardSkeleton isDark={def.isDark} />
        </>
      ) : (
        rest.map((a, i) => {
          if (i === 0) {
            return <FullCard key={a.slug} attraction={a} theme={theme} isDark={def.isDark} onOpenAttraction={onOpenAttraction} selectedSlug={selectedSlug} />;
          }
          if (i === 1) {
            const next = rest[i + 1];
            return (
              <div key={a.slug} className="v2-fg-card-row">
                <HalfCard attraction={a} theme={theme} isDark={def.isDark} onOpenAttraction={onOpenAttraction} selectedSlug={selectedSlug} />
                {next && <HalfCard attraction={next} theme={theme} isDark={def.isDark} onOpenAttraction={onOpenAttraction} selectedSlug={selectedSlug} />}
              </div>
            );
          }
          if (i === 2) return null; // rendered in the row above
          return <FullCard key={a.slug} attraction={a} theme={theme} isDark={def.isDark} onOpenAttraction={onOpenAttraction} selectedSlug={selectedSlug} />;
        })
      )}

      {/* Bottom CTA */}
      <div className="v2-fg-bottom-cta" style={{ background: def.bgColor }}>
        <div className="v2-fg-map-btn" style={theme.mapBtnStyle}>{"\uD83D\uDDFA "}{def.mapText}</div>
        <div className="v2-fg-also-like">
          <div className="v2-fg-also-label" style={theme.alsoLabelStyle}>You might also like</div>
          <div className="v2-fg-also-chips">
            {def.alsoLike.map((a, i) => (
              <div key={i} className="v2-fg-also-chip" style={theme.alsoChipStyle} onClick={() => onNavigate(a.screen)}>{a.label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

/** Extract first number/range from verbose price text like "Around 298-328 RMB per person..." → "298-328" */
function extractPrice(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d[\d,]*(?:\s*[-–~]\s*\d[\d,]*)?)/);
  return m ? m[1].replace(/,/g, '') : null;
}

/** Truncate hook to first sentence, max ~100 chars */
function shortHook(hook?: string): string {
  if (!hook) return '';
  // Take up to first period that's followed by a space or end
  const firstSentence = hook.match(/^[^.!?]*[.!?]/)?.[0] || hook;
  if (firstSentence.length <= 120) return firstSentence;
  return firstSentence.slice(0, 117) + '...';
}

/* ─── Sub-components ─── */

type ThemeStyles = ReturnType<typeof getThemeStyles>;

function getImageStyle(images?: string[]): React.CSSProperties {
  const img = images?.[0];
  if (img) {
    return { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: 'linear-gradient(135deg,#1a1a2d,#2d2d4a)' };
}

function getPriceTags(attraction: AttractionData, theme: ThemeStyles): { label: string; style: React.CSSProperties }[] {
  const tags: { label: string; style: React.CSSProperties }[] = [];
  const price = extractPrice(attraction.getting_in?.price_rmb);
  if (price) {
    tags.push({ label: `\u00A5${price}`, style: theme.accentTagStyle });
  }
  const typeLabel = attraction.card_type || attraction.experience_type;
  if (typeLabel) {
    tags.push({ label: typeLabel, style: theme.mutedTagStyle });
  }
  return tags;
}

function HeroCard({ attraction, theme, onOpenAttraction }: { attraction: AttractionData; theme: ThemeStyles; onOpenAttraction?: (slug: string, heroImage: string) => void }) {
  const tags = getPriceTags(attraction, theme);
  const handleExplore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenAttraction) {
      onOpenAttraction(attraction.slug, attraction.images?.[0] || '');
    } else {
      window.location.href = `/attractions/${attraction.slug}`;
    }
  };
  return (
    <div className="v2-fg-hero-card" style={theme.heroCardStyle}>
      <div className="v2-fg-hero-hook" style={theme.heroHookStyle}>{attraction.card_hook || shortHook(attraction.hook)}</div>
      <div className="v2-fg-hero-venue">
        <div className="v2-fg-hero-venue-name" style={theme.heroVenueStyle}>
          {attraction.card_name || attraction.attraction_name_en} <span className="v2-fg-cn" style={theme.heroCnStyle}>{attraction.attraction_name_cn}</span>
        </div>
      </div>
      <div className="v2-fg-hero-tags">
        {tags.map((t, i) => (
          <span key={i} className="v2-fg-tag" style={t.style}>{t.label}</span>
        ))}
      </div>
      <div className="v2-fg-hero-actions">
        <button onClick={handleExplore} className="v2-fg-explore-btn" style={{ ...theme.exploreStyle, textDecoration: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}>{"Explore \u2192"}</button>
        <div className="v2-fg-save-btn">{"\uD83E\uDD0D"}</div>
      </div>
    </div>
  );
}

function FullCard({ attraction, theme, isDark, onOpenAttraction, selectedSlug }: { attraction: AttractionData; theme: ThemeStyles; isDark: boolean; onOpenAttraction?: (slug: string, heroImage: string) => void; selectedSlug?: string | null }) {
  const tags = getPriceTags(attraction, theme);
  const handleClick = () => {
    if (onOpenAttraction) {
      onOpenAttraction(attraction.slug, attraction.images?.[0] || '');
    } else {
      window.location.href = `/attractions/${attraction.slug}`;
    }
  };
  return (
    <div onClick={handleClick} className="v2-fg-card v2-fg-card-full" style={{ ...theme.cardStyle, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
      <motion.div
        layoutId={onOpenAttraction ? `attraction-hero-${attraction.slug}` : undefined}
        className="v2-fg-card-img v2-fg-card-img-full"
        style={{ ...getImageStyle(attraction.images), opacity: selectedSlug === attraction.slug ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      <div className="v2-fg-card-body" style={isDark ? {} : { background: 'white' }}>
        <div className="v2-fg-card-hook" style={theme.cardHookStyle}>{attraction.card_hook || shortHook(attraction.hook)}</div>
        <div className="v2-fg-card-name" style={theme.cardNameStyle}>
          {attraction.card_name || attraction.attraction_name_en} <span className="v2-fg-cn" style={theme.heroCnStyle}>{attraction.attraction_name_cn}</span>
        </div>
        <div className="v2-fg-card-tags">
          {tags.map((t, j) => <span key={j} className="v2-fg-tag" style={t.style}>{t.label}</span>)}
        </div>
      </div>
    </div>
  );
}

function HalfCard({ attraction, theme, isDark, onOpenAttraction, selectedSlug }: { attraction: AttractionData; theme: ThemeStyles; isDark: boolean; onOpenAttraction?: (slug: string, heroImage: string) => void; selectedSlug?: string | null }) {
  const tags = getPriceTags(attraction, theme);
  const handleClick = () => {
    if (onOpenAttraction) {
      onOpenAttraction(attraction.slug, attraction.images?.[0] || '');
    } else {
      window.location.href = `/attractions/${attraction.slug}`;
    }
  };
  return (
    <div onClick={handleClick} className="v2-fg-card v2-fg-card-half" style={{ ...theme.cardStyle, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
      <motion.div
        layoutId={onOpenAttraction ? `attraction-hero-${attraction.slug}` : undefined}
        className="v2-fg-card-img v2-fg-card-img-half"
        style={{ ...getImageStyle(attraction.images), opacity: selectedSlug === attraction.slug ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      <div className="v2-fg-card-body" style={isDark ? {} : { background: 'white' }}>
        <div className="v2-fg-card-hook" style={theme.cardHookStyle}>{attraction.card_hook || shortHook(attraction.hook)}</div>
        <div className="v2-fg-card-name" style={theme.cardNameStyle}>
          {attraction.card_name || attraction.attraction_name_en} <span className="v2-fg-cn" style={theme.heroCnStyle}>{attraction.attraction_name_cn}</span>
        </div>
        <div className="v2-fg-card-tags">
          {tags.map((t, j) => <span key={j} className="v2-fg-tag" style={t.style}>{t.label}</span>)}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#141418' : 'white';
  const shimmer = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return (
    <div className="v2-fg-hero-card" style={{ background: bg, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
      <div style={{ height: 16, width: '90%', background: shimmer, borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 16, width: '70%', background: shimmer, borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 14, width: '50%', background: shimmer, borderRadius: 8, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ height: 24, width: 60, background: shimmer, borderRadius: 12 }} />
        <div style={{ height: 24, width: 80, background: shimmer, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function LoadingCardSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#141418' : 'white';
  const shimmer = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return (
    <div className="v2-fg-card v2-fg-card-full" style={{ background: bg, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
      <div className="v2-fg-card-img v2-fg-card-img-full" style={{ background: shimmer }} />
      <div className="v2-fg-card-body">
        <div style={{ height: 14, width: '80%', background: shimmer, borderRadius: 8, marginBottom: 10 }} />
        <div style={{ height: 12, width: '60%', background: shimmer, borderRadius: 8, marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 22, width: 50, background: shimmer, borderRadius: 10 }} />
          <div style={{ height: 22, width: 70, background: shimmer, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}
