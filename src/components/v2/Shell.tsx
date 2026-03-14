'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AttractionPage from '../guides/attractions/AttractionDetail';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import NavigateScreen, { type NavigateDestination } from './screens/NavigateScreen';
import PhotoScreen from './screens/PhotoScreen';
import JournalScreen from './screens/JournalScreen';
import ShanghaiAllScreen from './screens/ShanghaiAllScreen';
import EatScreen from './screens/EatScreen';
import EatCategoryScreen from './screens/EatCategoryScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import SearchOverlay from './SearchOverlay';
import type { EatCategory } from './data/eat-restaurants';
import { COLLECTION_IDS } from './data/collections-data';
import { track } from '@/lib/analytics';

type NavTab = 'home' | 'discover' | 'navigate' | 'photo' | 'journal';
type CollectionScreen = 'blow-off-steam' | 'down-the-rabbit-hole' | 'the-long-afternoon' | 'blow-your-mind' | 'make-something' | 'melt-into-it' | 'after-dark';
type EatCategoryScreenId = 'eat-chinese' | 'eat-asian' | 'eat-middle_eastern' | 'eat-western' | 'eat-bars';
type Screen = NavTab | 'shanghai-all' | 'eat' | 'drink' | 'feedback' | EatCategoryScreenId | CollectionScreen;

const collectionScreenToTab: Record<string, NavTab> = {};
COLLECTION_IDS.forEach((id) => { collectionScreenToTab[id] = 'discover'; });

const screenToTab: Record<string, NavTab> = {
  home: 'home',
  discover: 'discover',
  navigate: 'navigate',
  photo: 'photo',
  journal: 'journal',
  'shanghai-all': 'discover',
  'eat': 'discover',
  'feedback': 'home',
  'drink': 'discover',
  'eat-chinese': 'discover',
  'eat-asian': 'discover',
  'eat-middle_eastern': 'discover',
  'eat-western': 'discover',
  'eat-bars': 'discover',
  ...collectionScreenToTab,
};

const navItems: { id: NavTab; label: string; badge?: number; isLens?: boolean }[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Shanghai' },
  { id: 'photo', label: 'Lens', isLens: true },
  { id: 'navigate', label: 'Navigate' },
  { id: 'journal', label: 'Journey', badge: 3 },
];

function NavGlyph({ tab, active }: { tab: NavTab; active: boolean }) {
  const cls = `v2-nav-glyph ${active ? 'active' : ''}`;
  const strokeWidth = active ? 2.15 : 1.95;

  if (tab === 'home') {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M3.5 10.2 12 3.8l8.5 6.4v9a1 1 0 0 1-1 1h-5.2v-5.5H9.7v5.5H4.5a1 1 0 0 1-1-1z" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (tab === 'discover') {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M12 21s6.5-5.6 6.5-10.8a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" strokeWidth={strokeWidth} />
        <circle cx="12" cy="10" r="2.4" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (tab === 'navigate') {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" strokeWidth={strokeWidth} />
        <path d="m10.3 10.3 5.9-2.2-2.2 5.9-5.9 2.2z" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
      <path d="M6 4.2h12.5v15.2H6.1A2.6 2.6 0 0 0 3.5 22V6.7A2.5 2.5 0 0 1 6 4.2z" strokeWidth={strokeWidth} />
      <path d="M7.8 8h7m-7 3.3h7" strokeWidth={strokeWidth} />
    </svg>
  );
}

export default function Shell() {
  const [activeScreen, setActiveScreenRaw] = useState<Screen>('home');

  // Restore saved screen + scroll position after hydration
  useEffect(() => {
    const saved = sessionStorage.getItem('v2-screen');
    if (saved && saved in screenToTab) setActiveScreenRaw(saved as Screen);

    // Restore scroll after DOM updates with the correct active screen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const screenId = saved || 'home';
        const scrollTop = sessionStorage.getItem(`v2-scroll-${screenId}`);
        if (scrollTop) {
          const el = document.querySelector('.v2-screen.active .v2-scroll-body');
          if (el) el.scrollTop = parseInt(scrollTop);
        }
      });
    });
  }, []);

  const setActiveScreen = useCallback((screen: Screen) => {
    setActiveScreenRaw(screen);
    sessionStorage.setItem('v2-screen', screen);
    track('screen_view', { screen });
  }, []);

  // Save scroll position of active screen (so it survives full-page navigation)
  useEffect(() => {
    const el = document.querySelector('.v2-screen.active .v2-scroll-body');
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          sessionStorage.setItem(`v2-scroll-${activeScreen}`, String(el.scrollTop));
          ticking = false;
        });
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeScreen]);

  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen as Screen);
  }, [setActiveScreen]);

  // Navigate screen destination
  const [navigateDestination, setNavigateDestination] = useState<NavigateDestination | null>(null);
  const [navReferrer, setNavReferrer] = useState<string | null>(null);
  const handleNavigateToDestination = useCallback((dest: NavigateDestination) => {
    setNavigateDestination(dest);
    setActiveScreen('navigate');
  }, []);

  // Read ?nav= query params to deep-link into NavigateScreen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const navName = params.get('nav');
    if (navName) {
      handleNavigateToDestination({
        name: navName,
        chineseName: params.get('nameCn') || undefined,
        address: params.get('addr') || undefined,
      });
      const from = params.get('from');
      if (from) setNavReferrer(from);
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attraction detail overlay
  const [selectedAttraction, setSelectedAttraction] = useState<{ slug: string; heroImage: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attractionData, setAttractionData] = useState<any>(null);
  const overlayScrollRef = useRef<HTMLDivElement>(null);

  const handleOpenAttraction = useCallback((slug: string, heroImage: string) => {
    setSelectedAttraction({ slug, heroImage });
    setAttractionData(null);
    track('place_view', { slug, type: 'attraction', source: 'overlay' });
    fetch(`/api/attractions?slug=${slug}`)
      .then(res => res.json())
      .then(json => setAttractionData(json.attraction))
      .catch(() => {});
  }, []);

  const handleCloseAttraction = useCallback(() => {
    setSelectedAttraction(null);
    setAttractionData(null);
  }, []);

  useEffect(() => {
    if (selectedAttraction) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedAttraction]);

  // Search overlay
  const [searchOpen, setSearchOpen] = useState(false);
  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);

  const isActive = (screen: Screen) => activeScreen === screen;
  const isCollectionScreen = COLLECTION_IDS.includes(activeScreen);

  return (
    <div className="v2-shell">
      {/* Home */}
      <div className={`v2-screen v2-home ${isActive('home') ? 'active' : ''}`}>
        <HomeScreen onNavigate={handleNavigate} isActive={isActive('home')} />
      </div>

      {/* Discover / Shanghai */}
      <div className={`v2-screen v2-discover ${isActive('discover') ? 'active' : ''}`}>
        <DiscoverScreen onNavigate={handleNavigate} isActive={isActive('discover')} onSearchOpen={handleSearchOpen} />
      </div>

      {/* Navigate */}
      <div className={`v2-screen v2-navigate ${isActive('navigate') ? 'active' : ''}`}>
        {isActive('navigate') && <NavigateScreen onNavigate={handleNavigate} destination={navigateDestination} onClearDestination={() => setNavigateDestination(null)} referrer={navReferrer} />}
      </div>

      {/* Photo AI */}
      <div className={`v2-screen v2-photo ${isActive('photo') ? 'active' : ''}`}>
        {isActive('photo') && <PhotoScreen onNavigate={handleNavigate} isActive />}
      </div>

      {/* Journal */}
      <div className={`v2-screen v2-journal ${isActive('journal') ? 'active' : ''}`}>
        {isActive('journal') && <JournalScreen onNavigate={handleNavigate} />}
      </div>

      {/* Shanghai All */}
      <div className={`v2-screen ${isActive('shanghai-all') ? 'active' : ''}`}>
        {isActive('shanghai-all') && <ShanghaiAllScreen onNavigate={handleNavigate} onSearchOpen={handleSearchOpen} />}
      </div>

      {/* Eat / Restaurant Picker */}
      <div className={`v2-screen ${isActive('eat') ? 'active' : ''}`}>
        {isActive('eat') && <EatCategoryScreen categoryId="chinese" onNavigate={handleNavigate} onSearchOpen={handleSearchOpen} />}
      </div>

      {/* Drink */}
      <div className={`v2-screen ${isActive('drink') ? 'active' : ''}`}>
        {isActive('drink') && <EatCategoryScreen categoryId="bars" topTab="drink" onNavigate={handleNavigate} onSearchOpen={handleSearchOpen} />}
      </div>

      {/* Eat Category Detail */}
      {(['eat-chinese', 'eat-asian', 'eat-middle_eastern', 'eat-western', 'eat-bars'] as const).map((id) => (
        <div key={id} className={`v2-screen ${isActive(id) ? 'active' : ''}`}>
          {isActive(id) && <EatCategoryScreen categoryId={id.replace('eat-', '') as EatCategory} onNavigate={handleNavigate} onSearchOpen={handleSearchOpen} />}
        </div>
      ))}

      {/* Collection Detail — data-driven, renders whichever collection is active */}
      <div className={`v2-screen ${isCollectionScreen ? 'active' : ''}`}>
        {isCollectionScreen && (
          <CollectionDetailScreen collectionId={activeScreen} onNavigate={handleNavigate} onOpenAttraction={handleOpenAttraction} selectedSlug={selectedAttraction?.slug || null} />
        )}
      </div>

      {/* Feedback */}
      <div className={`v2-screen ${isActive('feedback') ? 'active' : ''}`}>
        {isActive('feedback') && <FeedbackScreen onNavigate={handleNavigate} />}
      </div>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={handleSearchClose} onNavigate={handleNavigate} onOpenAttraction={handleOpenAttraction} />

      {/* Bottom Nav — hidden when Lens is active */}
      <nav className={`v2-bottom-nav${activeScreen === 'photo' ? ' v2-bottom-nav--hidden' : ''}`}>
          {navItems.map((item) => {
            const isItemActive = (screenToTab[activeScreen] || 'discover') === item.id;

            if (item.isLens) {
              return (
                <button
                  key={item.id}
                  className={`v2-nav-btn v2-nav-btn-lens ${isItemActive ? 'active' : ''}`}
                  onClick={() => setActiveScreen(item.id)}
                >
                  <div className="v2-nav-lens-bubble">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="13" cy="13" r="8" stroke="white" strokeWidth="2"/>
                      <circle cx="13" cy="13" r="4" fill="white" opacity="0.9"/>
                      <path d="M9 4h8l1.5 2.5H21a1 1 0 011 1v11a1 1 0 01-1 1H5a1 1 0 01-1-1V7.5a1 1 0 011-1h2.5L9 4z" stroke="white" strokeWidth="1.5" fill="none"/>
                      <path d="M20 6l1.5-1.5M6 6L4.5 4.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <span className="v2-nav-lens-spark">✦</span>
                  </div>
                  <div className="v2-nav-btn-label v2-nav-lens-label">{item.label}</div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                className={`v2-nav-btn ${isItemActive ? 'active' : ''}`}
                onClick={() => setActiveScreen(item.id)}
              >
                <div className="v2-nav-btn-icon">
                  <NavGlyph tab={item.id} active={isItemActive} />
                  {item.badge && <div className="v2-nav-badge">{item.badge}</div>}
                </div>
                <div className="v2-nav-btn-label">{item.label}</div>
              </button>
            );
          })}
      </nav>
      {/* Attraction Detail Overlay */}
      <AnimatePresence>
        {selectedAttraction && (
          <motion.div
            key="attraction-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff' }}
          >
            <div ref={overlayScrollRef} style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {attractionData ? (
                <AttractionPage
                  data={attractionData}
                  onBack={handleCloseAttraction}
                  onNavigate={() => {
                    handleCloseAttraction();
                    handleNavigateToDestination({
                      name: attractionData.card_name || attractionData.attraction_name_en,
                      chineseName: attractionData.attraction_name_cn,
                      address: attractionData.address_cn || attractionData.address_en,
                      slug: attractionData.slug,
                      placeType: 'attraction',
                    });
                  }}
                  layoutId={`attraction-hero-${selectedAttraction.slug}`}
                  scrollRef={overlayScrollRef}
                />
              ) : (
                <div>
                  <div style={{ paddingTop: 96, paddingLeft: 10, paddingRight: 10 }}>
                    <motion.div
                      layoutId={`attraction-hero-${selectedAttraction.slug}`}
                      style={{ height: 290, borderRadius: 12, backgroundImage: `url(${selectedAttraction.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </div>
                  <div style={{ padding: '24px 20px' }}>
                    <div style={{ height: 12, width: '30%', background: '#f0f0f0', borderRadius: 6, marginBottom: 14 }} />
                    <div style={{ height: 22, width: '65%', background: '#f0f0f0', borderRadius: 8, marginBottom: 10 }} />
                    <div style={{ height: 12, width: '45%', background: '#f0f0f0', borderRadius: 6, marginBottom: 20 }} />
                    <div style={{ height: 1, background: '#ebebeb', marginBottom: 20 }} />
                    <div style={{ height: 60, width: '100%', background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
                    <div style={{ height: 14, width: '55%', background: '#f0f0f0', borderRadius: 6 }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
