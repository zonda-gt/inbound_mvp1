'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchIndex } from './hooks/useSearchIndex';
import type { SearchItem, SearchItemType } from './data/search-index';

/* ─── Recent searches (localStorage) ─── */

const RECENT_KEY = 'v2-recent-searches';
const MAX_RECENT = 5;

interface RecentSearch {
  id: string;
  name: string;
  emoji: string;
  type: SearchItemType;
  slug: string;
}

function getRecents(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(item: SearchItem) {
  const recents = getRecents().filter((r) => r.id !== item.id);
  recents.unshift({ id: item.id, name: item.name, emoji: item.emoji, type: item.type, slug: item.slug });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
}

function clearRecents() {
  localStorage.removeItem(RECENT_KEY);
}

/* ─── Tab definitions ─── */

type SearchTab = 'all' | 'eat' | 'experience' | 'drink';

const TABS: { id: SearchTab; emoji: string; label: string }[] = [
  { id: 'eat', emoji: '🍜', label: 'Eat' },
  { id: 'experience', emoji: '🎡', label: 'Experience' },
  { id: 'drink', emoji: '🍸', label: 'Drink' },
];

const TAB_FILTER: Record<SearchTab, (item: SearchItem) => boolean> = {
  all: () => true,
  eat: (item) => item.type === 'restaurant' && item.category !== 'bars',
  experience: (item) => item.type === 'attraction' || item.type === 'collection',
  drink: (item) => item.type === 'restaurant' && item.category === 'bars',
};

/* ─── Component ─── */

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onOpenAttraction: (slug: string, heroImage: string) => void;
}

export default function SearchOverlay({ open, onClose, onNavigate, onOpenAttraction }: SearchOverlayProps) {
  const router = useRouter();
  const { fuse, loading } = useSearchIndex(open);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('experience');
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recents on open
  useEffect(() => {
    if (open) {
      setRecents(getRecents());
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setActiveTab('experience');
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Search results
  const results = useMemo(() => {
    if (!fuse || query.trim().length < 2) return [];
    const raw = fuse.search(query.trim(), { limit: 20 });
    return raw.map((r) => r.item).filter(TAB_FILTER[activeTab]);
  }, [fuse, query, activeTab]);

  const showResults = query.trim().length >= 2;

  // Group results by type
  const grouped = useMemo(() => {
    if (!showResults) return { restaurants: [], experiences: [] };
    const restaurants = results.filter((r) => r.type === 'restaurant');
    const experiences = results.filter((r) => r.type === 'attraction' || r.type === 'collection');
    return { restaurants, experiences };
  }, [results, showResults]);

  const handleResultTap = useCallback(
    (item: SearchItem) => {
      saveRecent(item);
      onClose();
      switch (item.type) {
        case 'restaurant':
          router.push(`/restaurants/${item.slug}`);
          break;
        case 'collection':
          onNavigate(item.slug);
          break;
        case 'attraction':
          onOpenAttraction(item.slug, item.image || '');
          break;
      }
    },
    [onClose, onNavigate, onOpenAttraction, router],
  );

  const handleRecentTap = useCallback(
    (recent: RecentSearch) => {
      onClose();
      switch (recent.type) {
        case 'restaurant':
          router.push(`/restaurants/${recent.slug}`);
          break;
        case 'collection':
          onNavigate(recent.slug);
          break;
        case 'attraction':
          onOpenAttraction(recent.slug, '');
          break;
      }
    },
    [onClose, onNavigate, onOpenAttraction, router],
  );

  const handleClearAll = useCallback(() => {
    setQuery('');
    clearRecents();
    setRecents([]);
  }, []);

  const handleAskAI = useCallback(() => {
    onClose();
    router.push(`/chat${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }, [onClose, query, router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          className="v2-search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="v2-search-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* ─── Header: Tabs + Close ─── */}
            <div className="v2-search-header">
              <div className="v2-search-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`v2-search-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="v2-search-tab-emoji">{tab.emoji}</span>
                    <span className="v2-search-tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>
              <button className="v2-search-close" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ─── "Where?" Card ─── */}
            <div className="v2-search-where-card">
              <div className="v2-search-where-label">Where?</div>
              <div className="v2-search-input-wrap">
                <svg className="v2-search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  className="v2-search-input"
                  placeholder="Search by name or keyword"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button className="v2-search-input-clear" onClick={() => setQuery('')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Recent searches */}
              {!showResults && recents.length > 0 && (
                <div className="v2-search-recents">
                  <div className="v2-search-recents-label">Recent searches</div>
                  {recents.map((r) => (
                    <div key={r.id} className="v2-search-recent-item" onClick={() => handleRecentTap(r)}>
                      <div className="v2-search-recent-icon">{r.emoji}</div>
                      <div className="v2-search-recent-body">
                        <div className="v2-search-recent-name">{r.name}</div>
                        <div className="v2-search-recent-type">{r.type === 'restaurant' ? 'Restaurant' : r.type === 'collection' ? 'Collection' : 'Experience'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Results ─── */}
            {showResults && (
              <div className="v2-search-results">
                {loading && (
                  <div className="v2-search-loading">Loading...</div>
                )}

                {!loading && results.length === 0 && (
                  <div className="v2-search-empty">
                    <div className="v2-search-empty-text">No results found</div>
                    <div className="v2-search-cta" onClick={handleAskAI}>
                      <div className="v2-search-cta-icon">🤖</div>
                      <div className="v2-search-cta-body">
                        <div className="v2-search-cta-title">Can&apos;t find what you&apos;re looking for?</div>
                        <div className="v2-search-cta-desc">Ask our AI — it knows Shanghai inside out</div>
                      </div>
                      <div className="v2-search-cta-arrow">→</div>
                    </div>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <>
                    {grouped.restaurants.length > 0 && (activeTab === 'all' || activeTab === 'eat' || activeTab === 'drink') && (
                      <div className="v2-search-section">
                        {activeTab === 'all' && <div className="v2-search-section-label">Restaurants</div>}
                        {grouped.restaurants.map((item) => (
                          <ResultRow key={item.id} item={item} onTap={handleResultTap} />
                        ))}
                      </div>
                    )}

                    {grouped.experiences.length > 0 && (activeTab === 'all' || activeTab === 'experience') && (
                      <div className="v2-search-section">
                        {activeTab === 'all' && <div className="v2-search-section-label">Experiences</div>}
                        {grouped.experiences.map((item) => (
                          <ResultRow key={item.id} item={item} onTap={handleResultTap} />
                        ))}
                      </div>
                    )}

                    {/* AI fallback CTA at bottom of results */}
                    <div className="v2-search-cta" onClick={handleAskAI}>
                      <div className="v2-search-cta-icon">🤖</div>
                      <div className="v2-search-cta-body">
                        <div className="v2-search-cta-title">Can&apos;t find what you&apos;re looking for?</div>
                        <div className="v2-search-cta-desc">Ask our AI — it knows Shanghai inside out</div>
                      </div>
                      <div className="v2-search-cta-arrow">→</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── Bottom Bar ─── */}
            <div className="v2-search-footer">
              <button className="v2-search-clear-btn" onClick={handleClearAll}>Clear all</button>
              <button className="v2-search-go-btn" onClick={() => { /* results already shown inline */ }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Result Row ─── */

function ResultRow({ item, onTap }: { item: SearchItem; onTap: (item: SearchItem) => void }) {
  return (
    <div className="v2-search-result-row" onClick={() => onTap(item)}>
      <div className="v2-search-result-thumb">
        {item.image ? (
          <img src={item.image} alt="" />
        ) : (
          <span className="v2-search-result-emoji">{item.emoji}</span>
        )}
      </div>
      <div className="v2-search-result-body">
        <div className="v2-search-result-name">
          {item.name}
          {item.nameCn && <span className="v2-search-result-cn">{item.nameCn}</span>}
        </div>
        <div className="v2-search-result-hook">{item.hook || item.subtitle}</div>
        <div className="v2-search-result-meta">
          <span className="v2-search-result-type-pill">
            {item.type === 'restaurant' ? 'Restaurant' : item.type === 'collection' ? 'Collection' : 'Experience'}
          </span>
          {item.price && <span className="v2-search-result-meta-pill">{item.price}</span>}
          {item.rating && <span className="v2-search-result-meta-pill">★ {item.rating}</span>}
        </div>
      </div>
    </div>
  );
}
