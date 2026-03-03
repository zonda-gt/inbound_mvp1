'use client';

import { useState } from 'react';
import { COLLECTION_LIST } from '../data/collections-data';
import { useCollectionData } from '../hooks/useCollectionData';
import type { AttractionData } from '@/types/attraction';

interface ShanghaiAllScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ShanghaiAllScreen({ onNavigate }: ShanghaiAllScreenProps) {
  const totalVenues = COLLECTION_LIST.reduce((sum, c) => sum + c.slugs.length, 0);

  return (
    <div className="v2-scroll-body">
      {/* Header */}
      <div className="v2-sha-hdr">
        <button className="v2-sha-back" onClick={() => onNavigate('discover')}>
          &larr; Back
        </button>
        <div>
          <div className="v2-sha-eyebrow">Shanghai &middot; {totalVenues} experiences</div>
          <div className="v2-sha-title">Only in Shanghai</div>
          <div className="v2-sha-subtitle">
            Places and experiences that exist nowhere else on earth. Curated by
            locals who live here.
          </div>
        </div>
      </div>

      {/* 7 Collection Clusters */}
      {COLLECTION_LIST.map((col) => (
        <CollectionCluster key={col.id} collectionId={col.id} onNavigate={onNavigate} />
      ))}

      <div style={{ height: 20 }} />
    </div>
  );
}

/* ─── Collection Cluster ─── */

function CollectionCluster({ collectionId, onNavigate }: { collectionId: string; onNavigate: (screen: string) => void }) {
  const col = COLLECTION_LIST.find((c) => c.id === collectionId)!;
  // Only fetch first 4 slugs for preview
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
          <>
            <ShaCardSkeleton />
            <ShaCardSkeleton />
            <ShaCardSkeleton />
          </>
        ) : (
          attractions.map((a) => (
            <ShaCardFromData key={a.slug} attraction={a} />
          ))
        )}
      </div>
    </div>
  );
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
  if (firstSentence.length <= 120) return firstSentence;
  return firstSentence.slice(0, 117) + '...';
}

/* ─── Sub-components ─── */

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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSaved((prev) => !prev);
        }}
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
