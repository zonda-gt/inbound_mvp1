'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTimeAwareMessage, searchPlaces, getQuickActions } from '../data/discover-data';
import { COLLECTION_LIST } from '../data/collections-data';
import { useCollectionData } from '../hooks/useCollectionData';

interface DiscoverScreenProps {
  onNavigate: (screen: string) => void;
}

// Grab a diverse mix of attraction slugs across collections for the "Only in Shanghai" scroll
const featuredSlugs = COLLECTION_LIST.flatMap((col) => col.slugs.slice(0, 2)).slice(0, 12);

function SmoothImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <div className={`v2-img-skel ${loaded ? 'loaded' : ''}`} aria-hidden="true" />
      <img
        className={`${className} v2-lazy-img ${loaded ? 'loaded' : ''}`}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { attractions: featuredAttractions, loading: featuredLoading } = useCollectionData(featuredSlugs);

  // Fetch featured restaurants from restaurants_v2
  const [featuredRestaurants, setFeaturedRestaurants] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/restaurants-v2')
      .then(r => r.json())
      .then(d => setFeaturedRestaurants(d.restaurants || []))
      .catch(() => {});
  }, []);

  // Pick a hero attraction based on time of day
  const heroAttraction = useMemo(() => {
    if (featuredAttractions.length === 0) return null;
    const withImages = featuredAttractions.filter((a) => a.images?.[0] && !a.slug.includes('disney'));
    if (withImages.length === 0) return featuredAttractions[0];
    const scored = withImages.map((a) => ({ a, score: getTimeScore(a) }));
    scored.sort((x, y) => y.score - x.score);
    // Pick randomly among the top-scored candidates
    const topScore = scored[0].score;
    const top = scored.filter((s) => s.score === topScore);
    return top[Math.floor(Math.random() * top.length)].a;
  }, [featuredAttractions]);

  return (
    <div className="v2-scroll-body">
      {/* Masthead Hero */}
      <div className="v2-sh-masthead">
        {heroAttraction?.images?.[0] ? (
          <SmoothImage key={`discover-hero-${heroAttraction.images[0]}`} className="v2-sh-masthead-img" src={heroAttraction.images[0]} alt="" />
        ) : (
          <div
            className="v2-sh-masthead-img"
            style={{ background: 'linear-gradient(135deg, #1a0508, #0a0a1a)' }}
          />
        )}
        <div className="v2-sh-masthead-overlay" />
        <div className="v2-sh-masthead-content">
          <div className="v2-sh-hero-message">{heroAttraction?.card_hook ? `\u201C${heroAttraction.card_hook}\u201D` : ''}</div>
          <div className="v2-sh-hero-search" onClick={() => setSearchOpen(true)}>
            <span className="v2-sh-hero-search-icon">🔍</span>
            <span className="v2-sh-hero-search-placeholder">
              Noodles, bars, &ldquo;something weird&rdquo;&hellip;
            </span>
          </div>
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
              <AttractionCoverCard key={a.slug} attraction={a} />
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
          <div className="v2-sh-see-all">See all &rarr;</div>
        </div>
        <div className="v2-sh-hscroll">
          {featuredRestaurants.length > 0 ? featuredRestaurants.map((r: any) => (
            <FoodCard key={r.slug} slug={r.slug} image={r.image} name={r.name_en} hook={r.verdict} price={r.price_cny ? `¥${r.price_cny}/pp` : ''} rating={r.rating ? String(r.rating) : ''} cuisine={r.cuisine} />
          )) : (
            <>
              <FoodCard slug="" image={null} name="Loading..." hook="" price="" rating="" cuisine="" />
              <FoodCard slug="" image={null} name="Loading..." hook="" price="" rating="" cuisine="" />
            </>
          )}
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

      <div className="v2-sh-divider" />

      {/* SECTION 4: Plan your day */}
      <div className="v2-sh-section v2-fade-up v2-d3">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">Plan your day</div>
            <div className="v2-sh-section-sub">
              Curated itineraries by our local team
            </div>
          </div>
          <div className="v2-sh-see-all">See all &rarr;</div>
        </div>
        <div className="v2-sh-hscroll">
          <PlanCard bg="linear-gradient(135deg,#c8b89a,#a89878)" tag="Half day · 4–5 hrs" title="The perfect French Concession afternoon" stops={['☕ Coffee', '🛍 Boutiques', '🍷 Wine bar']} />
          <PlanCard bg="linear-gradient(135deg,#0a0a1a,#1a1a2d)" tag="Evening · 5–6 hrs" title="Bund to bar — the classic Shanghai night" stops={['🌆 Sunset Bund', '🍜 Dinner', '🎵 Live music']} />
          <PlanCard bg="linear-gradient(135deg,#1a0a0a,#2d1a1a)" tag="Full day · 8 hrs" title="Old Shanghai — Tianzifang to Xintiandi" stops={['🏮 Tianzifang', '🥟 Dumplings', '🏛 Xintiandi']} />
        </div>
      </div>

      <div className="v2-sh-divider" />

      {/* SECTION 5: Hidden gems */}
      <div className="v2-sh-section v2-fade-up v2-d3">
        <div className="v2-sh-section-hdr">
          <div>
            <div className="v2-sh-section-title">Hidden gems this month</div>
            <div className="v2-sh-section-sub">Not on the tourist trail</div>
          </div>
          <div className="v2-sh-see-all">See all &rarr;</div>
        </div>
        <div className="v2-sh-gem-list">
          <GemCard emoji="🎭" tag="Experience" name="The Paramount Ballroom&apos;s secret bar" desc="Most visitors only see the main floor. Ask for the side tables — no minimum spend, best view of the band." pills={['🌃 Nightlife', '¥200–500']} />
          <GemCard emoji="🏯" tag="Culture" name="Jing&apos;an Temple at 7 AM" desc="Before the crowds arrive, monks chant in the golden halls. Free to enter before 8 AM on weekdays." pills={['🕌 Temple', 'Free entry']} />
          <GemCard emoji="🌿" tag="Neighbourhood" name="Wukang Road on a Tuesday morning" desc="The most photographed street in Shanghai is empty on weekday mornings. Golden light through the plane trees." pills={['📸 Photo spot', 'Free']} />
        </div>
      </div>

      <div className="v2-sh-bottom-pad" />

      {/* Search Overlay */}
      {searchOpen && (
        <SearchOverlayInline onClose={() => setSearchOpen(false)} />
      )}
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

function AttractionCoverCard({ attraction }: { attraction: import('@/types/attraction').AttractionData }) {
  const [saved, setSaved] = useState(false);
  const img = attraction.images?.[0];
  return (
    <a href={`/attractions/${attraction.slug}`} className="v2-sh-cover-card" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
      {img ? (
        <SmoothImage key={`${attraction.slug}-${img}`} className="v2-sh-cover-img" src={img} alt={attraction.card_name || attraction.attraction_name_en} />
      ) : (
        <div className="v2-sh-cover-img" style={{ background: 'linear-gradient(135deg,#1a1a2d,#2d2d4a)' }} />
      )}
      <div className="v2-sh-cover-overlay" />
      <button
        className="v2-sh-food-fav"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
        aria-label={saved ? 'Unsave attraction' : 'Save attraction'}
      >
        <svg viewBox="0 0 32 32" width="24" height="24" fill={saved ? '#FF385C' : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
          <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
        </svg>
      </button>
      <div className="v2-sh-cover-body">
        <div className="v2-sh-cover-tag">{attraction.card_type || attraction.experience_type}</div>
        <div className="v2-sh-cover-name">{attraction.card_name || attraction.attraction_name_en}</div>
        <div className="v2-sh-cover-hook">{attraction.card_hook || shortHook(attraction.hook)}</div>
      </div>
    </a>
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

function FoodCard({ slug, image, name, price, rating, cuisine }: {
  slug: string; image: string | null; name: string; hook: string; price: string; rating: string; cuisine: string;
}) {
  const [saved, setSaved] = useState(false);
  const card = (
    <div className="v2-sh-food-card">
      <div className="v2-sh-food-img-wrap">
        {image ? (
          <img className="v2-sh-food-img" src={image} alt={name} />
        ) : (
          <div className="v2-sh-food-img v2-sh-food-img-placeholder">🍽️</div>
        )}
        <button
          className="v2-sh-food-fav"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
          aria-label="Save"
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
  return <a href={`/restaurants/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</a>;
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

/* ─── Inline Search Overlay ─── */

function SearchOverlayInline({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [quickActions] = useState(getQuickActions);
  const results = query.trim().length > 1 ? searchPlaces(query) : [];
  const showResults = query.trim().length > 1;

  return (
    <div
      className="v2-sh-search-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="v2-sh-search-modal">
        <div className="v2-sh-search-modal-bar">
          <span className="v2-sh-search-icon">🔍</span>
          <input
            className="v2-sh-search-input"
            placeholder="noodles near me · open now under ¥50 · something fun indoors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="v2-sh-search-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        {!showResults && (
          <div className="v2-sh-search-suggestions">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {quickActions.map((a, i) => (
                <div
                  key={i}
                  className="v2-sh-quick-action"
                  onClick={() => setQuery(a.query)}
                >
                  {a.label}
                </div>
              ))}
            </div>
            <div className="v2-sh-search-sugg-label">Try asking</div>
            {[
              { emoji: '🍜', text: 'Noodles near me', q: 'noodles near me' },
              { emoji: '⏰', text: 'Open right now under ¥50', q: 'open right now under ¥50' },
              { emoji: '🏛', text: 'Something fun indoors', q: 'something fun indoors' },
              { emoji: '🌙', text: 'Late night eats', q: 'late night eats' },
              { emoji: '☕', text: 'Best coffee in French Concession', q: 'best coffee in French Concession' },
              { emoji: '🔎', text: 'Hidden spots locals love', q: 'hidden spots locals love' },
            ].map((s, i) => (
              <div
                key={i}
                className="v2-sh-search-sugg"
                onClick={() => setQuery(s.q)}
              >
                {s.emoji} {s.text}
              </div>
            ))}
          </div>
        )}

        {showResults && (
          <div className="v2-sh-search-results">
            <div className="v2-sh-results-meta">
              {results.length > 0
                ? `${results.length} place${results.length !== 1 ? 's' : ''} · sorted by relevance`
                : 'No matches — try different words'}
            </div>
            <div>
              {results.map((p) => (
                <div key={p.id} className="v2-sh-result-card">
                  <div className="v2-sh-result-thumb" style={{ background: p.bg }}>
                    {p.emoji}
                  </div>
                  <div className="v2-sh-result-body">
                    <div className="v2-sh-result-hook">{p.hook}</div>
                    <div className="v2-sh-result-name">
                      {p.name}{' '}
                      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{p.cn}</span>
                    </div>
                    <div className="v2-sh-result-tags">
                      {p.open && <span className="v2-sh-result-tag open">● Open now</span>}
                      <span className="v2-sh-result-tag price">{p.price}</span>
                      <span className="v2-sh-result-tag">{p.dist}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
