'use client';

import { useState } from 'react';
import { COLLECTION_LIST } from '../data/collections-data';
import { useCollectionData } from '../hooks/useCollectionData';
import type { AttractionData } from '@/types/attraction';

interface ShanghaiAllScreenProps {
  onNavigate: (screen: string) => void;
}

const TOP_TABS = [
  { id: 'eat',        emoji: '🍜', label: 'Eat',        isNew: false },
  { id: 'experience', emoji: '🎡', label: 'Experience',  isNew: false },
  { id: 'drink',      emoji: '🍸', label: 'Drink',       isNew: true  },
];

const VIBE_FILTERS: { id: string; emoji: string; label: string }[] = [
  { id: 'blow-off-steam',        emoji: '⚡', label: 'Active'       },
  { id: 'down-the-rabbit-hole',  emoji: '🌀', label: 'Immersive'    },
  { id: 'the-long-afternoon',    emoji: '🎭', label: 'Arts & Culture'},
  { id: 'blow-your-mind',        emoji: '🤩', label: 'Spectacular'  },
  { id: 'make-something',        emoji: '🔨', label: 'Workshops'    },
  { id: 'melt-into-it',          emoji: '🧘', label: 'Wellness'     },
  { id: 'after-dark',            emoji: '🌙', label: 'Nightlife'    },
];

export default function ShanghaiAllScreen({ onNavigate }: ShanghaiAllScreenProps) {
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);

  function handleTopTabClick(id: string) {
    if (id === 'eat') onNavigate('eat');
    if (id === 'drink') onNavigate('drink');
  }

  const visibleCollections = activeVibe
    ? COLLECTION_LIST.filter((c) => c.id === activeVibe)
    : COLLECTION_LIST;

  return (
    <div className={`v2-scroll-body${activeVibe ? ' v2-scroll-body--light' : ''}`} onScroll={(e) => setCompact(e.currentTarget.scrollTop > 30)}>
      {/* Airbnb-style sticky top bar */}
      <div className={`v2-sha-sticky-bar${compact ? ' v2-sha-sticky-bar--compact' : ''}`}>
        <div className="v2-sha-pill">
          <span className="v2-sha-pill-icon">🔍</span>
          <span>Start your search</span>
        </div>
        <div className="v2-sha-tabs">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`v2-sha-tab ${tab.id === 'experience' ? 'active' : ''}`}
              onClick={() => handleTopTabClick(tab.id)}
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

        {/* Vibe filter chips — inside sticky bar so they always sit right below tabs */}
        <div className={`v2-eat-moods${activeVibe ? ' v2-eat-moods--light' : ''}`} style={{ position: 'static' }}>
          <div className="v2-eat-moods-scroll">
            <button
              className={`v2-eat-mood-chip ${activeVibe === null ? 'active' : ''}`}
              onClick={() => setActiveVibe(null)}
            >
              <span className="v2-eat-mood-emoji">✨</span>
              All
            </button>
            {VIBE_FILTERS.map((v) => (
              <button
                key={v.id}
                className={`v2-eat-mood-chip ${activeVibe === v.id ? 'active' : ''}`}
                onClick={() => setActiveVibe(v.id)}
              >
                <span className="v2-eat-mood-emoji">{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All view: horizontal scroll clusters */}
      {activeVibe === null && (
        <>
          {visibleCollections.map((col) => (
            <div key={col.id} id={`sha-section-${col.id}`}>
              <CollectionCluster collectionId={col.id} onNavigate={onNavigate} />
            </div>
          ))}
          <div style={{ height: 20 }} />
        </>
      )}

      {/* Filtered view: list rows */}
      {activeVibe !== null && (
        <CollectionListView collectionId={activeVibe} />
      )}
    </div>
  );
}

/* ─── Collection Cluster (All view) ─── */

function CollectionCluster({ collectionId, onNavigate }: { collectionId: string; onNavigate: (screen: string) => void }) {
  const col = COLLECTION_LIST.find((c) => c.id === collectionId)!;
  const previewSlugs = col.slugs.slice(0, 4);
  const { attractions, loading } = useCollectionData(previewSlugs);

  return (
    <div className="v2-sha-cluster-section">
      <div className="v2-sha-cluster-sec-hdr">
        <div className="v2-sha-cluster-sec-title">{col.emoji} {col.title}</div>
        <div className="v2-sha-cluster-sec-seeall" onClick={() => onNavigate(col.id)}>See all &rarr;</div>
      </div>
      <div className="v2-sha-hscroll">
        {loading ? (
          <><ShaCardSkeleton /><ShaCardSkeleton /><ShaCardSkeleton /></>
        ) : (
          attractions.map((a) => (
            <ShaCardFromData key={a.slug} attraction={a} />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Collection List View (filtered) ─── */

function CollectionListView({ collectionId }: { collectionId: string }) {
  const col = COLLECTION_LIST.find((c) => c.id === collectionId)!;
  const { attractions, loading } = useCollectionData(col.slugs);

  return (
    <div>
      <div className="v2-attr-list-hdr">
        <span className="v2-attr-list-hdr-emoji">{col.emoji}</span>
        <span className="v2-attr-list-hdr-title">{col.title}</span>
        {!loading && <span className="v2-attr-list-hdr-count">{attractions.length} experiences</span>}
      </div>
      {loading ? (
        <>{[0,1,2].map(i => <AttractionRowSkeleton key={i} />)}</>
      ) : (
        attractions.map((a) => <AttractionCard key={a.slug} attraction={a} />)
      )}
      <div className="v2-sh-bottom-pad" />
    </div>
  );
}

/* ─── Helpers ─── */

function extractPrice(raw?: string | number | null): string | null {
  if (raw == null) return null;
  const str = String(raw);
  const m = str.match(/(\d[\d,]*(?:\s*[-–~]\s*\d[\d,]*)?)/);
  return m ? m[1].replace(/,/g, '') : null;
}

function shortHook(hook?: string): string {
  if (!hook) return '';
  const firstSentence = hook.match(/^[^.!?]*[.!?]/)?.[0] || hook;
  if (firstSentence.length <= 120) return firstSentence;
  return firstSentence.slice(0, 117) + '...';
}

/* ─── Attraction Card (filtered view) ─── */

function AttractionCard({ attraction }: { attraction: AttractionData }) {
  const price = extractPrice(attraction.getting_in?.price_rmb);
  const type = attraction.card_type || attraction.experience_type || '';
  const photos = [...new Set(attraction.images ?? [])].slice(0, 6);

  return (
    <a href={`/attractions/${attraction.slug}`} className="v2-eatcat-row" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div className="v2-eatcat-photos">
        {photos.length > 0 ? (
          photos.map((src, i) => (
            <div key={i} className="v2-eatcat-photo-wrap">
              <img src={src} alt="" className="v2-eatcat-photo" loading="lazy" />
            </div>
          ))
        ) : (
          <div className="v2-eatcat-photo-wrap">
            <div className="v2-eatcat-photo-placeholder">🎭</div>
          </div>
        )}
      </div>
      <div className="v2-eatcat-info">
        <div className="v2-eatcat-name-row">
          <div className="v2-eatcat-name">{attraction.card_name || attraction.attraction_name_en}</div>
          {price && <div className="v2-eatcat-rating">¥{price}</div>}
        </div>
        {attraction.hook && <div className="v2-eatcat-hook">{shortHook(attraction.hook)}</div>}
        {type && <div className="v2-eatcat-cuisine">{type}</div>}
      </div>
    </a>
  );
}

function AttractionRowSkeleton() {
  return (
    <div className="v2-eatcat-row">
      <div className="v2-eatcat-photos">
        <div className="v2-eatcat-photo-wrap" style={{ background: '#f0f0f0' }} />
        <div className="v2-eatcat-photo-wrap" style={{ background: '#f0f0f0' }} />
      </div>
      <div className="v2-eatcat-info">
        <div style={{ height: 16, width: '70%', background: '#f0f0f0', borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 13, width: '90%', background: '#f0f0f0', borderRadius: 5, marginBottom: 4 }} />
        <div style={{ height: 12, width: '40%', background: '#f0f0f0', borderRadius: 5 }} />
      </div>
    </div>
  );
}

/* ─── Cover card sub-components (All view) ─── */

function getImageBg(images?: string[]): React.CSSProperties {
  const img = images?.[0];
  if (img) {
    return { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: 'linear-gradient(135deg,#1a1a2d,#2d2d4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 };
}

function ShaCardFromData({ attraction }: { attraction: AttractionData }) {
  const [saved, setSaved] = useState(false);
  const price = extractPrice(attraction.getting_in?.price_rmb);
  return (
    <a href={`/attractions/${attraction.slug}`} className="v2-sha-cover-card" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
      <div className="v2-sha-cover-img" style={getImageBg(attraction.images)} />
      <div className="v2-sha-cover-overlay" />
      {price && <div className="v2-sha-cover-badge dark">{"\u00A5"}{price}</div>}
      <button
        type="button"
        className="v2-sh-food-fav"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved((prev) => !prev); }}
        aria-label={saved ? 'Unsave attraction' : 'Save attraction'}
      >
        <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
          <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
        </svg>
      </button>
      <div className="v2-sha-cover-body">
        <div className="v2-sha-cover-tag">{attraction.card_type || attraction.experience_type}</div>
        <div className="v2-sha-cover-name">{attraction.card_name || attraction.attraction_name_en}</div>
        <div className="v2-sha-cover-hook">{attraction.card_hook || shortHook(attraction.hook)}</div>
      </div>
    </a>
  );
}

function ShaCardSkeleton() {
  return (
    <div className="v2-sha-cover-card">
      <div className="v2-sha-cover-img" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="v2-sha-cover-body">
        <div style={{ height: 10, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 5, marginBottom: 6 }} />
        <div style={{ height: 14, width: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 7, marginBottom: 6 }} />
        <div style={{ height: 10, width: 100, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }} />
      </div>
    </div>
  );
}
