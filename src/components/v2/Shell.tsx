'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AttractionPage from '../guides/attractions/AttractionDetail';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import NavigateScreen from './screens/NavigateScreen';
import PhotoScreen from './screens/PhotoScreen';
import JournalScreen from './screens/JournalScreen';
import ShanghaiAllScreen from './screens/ShanghaiAllScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import { COLLECTION_IDS } from './data/collections-data';

type NavTab = 'home' | 'discover' | 'navigate' | 'photo' | 'journal';
type CollectionScreen = 'blow-off-steam' | 'down-the-rabbit-hole' | 'the-long-afternoon' | 'blow-your-mind' | 'make-something' | 'melt-into-it' | 'after-dark';
type Screen = NavTab | 'shanghai-all' | CollectionScreen;

const collectionScreenToTab: Record<string, NavTab> = {};
COLLECTION_IDS.forEach((id) => { collectionScreenToTab[id] = 'discover'; });

const screenToTab: Record<string, NavTab> = {
  home: 'home',
  discover: 'discover',
  navigate: 'navigate',
  photo: 'photo',
  journal: 'journal',
  'shanghai-all': 'discover',
  ...collectionScreenToTab,
};

const navItems: { id: NavTab; icon: string; label: string; badge?: number; isLens?: boolean }[] = [
  { id: 'home', icon: '\uD83C\uDFE0', label: 'Home' },
  { id: 'discover', icon: '\uD83D\uDDFA\uFE0F', label: 'Shanghai' },
  { id: 'photo', icon: '', label: 'Lens', isLens: true },
  { id: 'navigate', icon: '\uD83D\uDE87', label: 'Navigate' },
  { id: 'journal', icon: '\uD83D\uDCD3', label: 'Journey', badge: 3 },
];

export default function Shell() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');

  const handleFinishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setActiveScreen('home');
  }, []);

  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen as Screen);
  }, []);

  // Attraction detail overlay
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedAttraction, setSelectedAttraction] = useState<{ slug: string; heroImage: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attractionData, setAttractionData] = useState<any>(null);
  const overlayScrollRef = useRef<HTMLDivElement>(null);

  const handleOpenAttraction = useCallback((slug: string, heroImage: string) => {
    setSelectedAttraction({ slug, heroImage });
    setAttractionData(null);
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

  const isActive = (screen: Screen) => !showOnboarding && activeScreen === screen;
  const isCollectionScreen = COLLECTION_IDS.includes(activeScreen);

  return (
    <div className="v2-shell">
      {/* Onboarding */}
      <div className={`v2-screen v2-onboard ${showOnboarding ? 'active' : ''}`}>
        <OnboardingScreen onFinish={handleFinishOnboarding} />
      </div>

      {/* Home */}
      <div className={`v2-screen v2-home ${isActive('home') ? 'active' : ''}`}>
        <HomeScreen onNavigate={handleNavigate} />
      </div>

      {/* Discover / Shanghai */}
      <div className={`v2-screen v2-discover ${isActive('discover') ? 'active' : ''}`}>
        <DiscoverScreen onNavigate={handleNavigate} />
      </div>

      {/* Navigate */}
      <div className={`v2-screen v2-navigate ${isActive('navigate') ? 'active' : ''}`}>
        <NavigateScreen onNavigate={handleNavigate} />
      </div>

      {/* Photo AI */}
      <div className={`v2-screen v2-photo ${isActive('photo') ? 'active' : ''}`}>
        <PhotoScreen onNavigate={handleNavigate} isActive={isActive('photo')} />
      </div>

      {/* Journal */}
      <div className={`v2-screen v2-journal ${isActive('journal') ? 'active' : ''}`}>
        <JournalScreen onNavigate={handleNavigate} />
      </div>

      {/* Shanghai All */}
      <div className={`v2-screen ${isActive('shanghai-all') ? 'active' : ''}`}>
        <ShanghaiAllScreen onNavigate={handleNavigate} />
      </div>

      {/* Collection Detail — data-driven, renders whichever collection is active */}
      <div className={`v2-screen ${isCollectionScreen ? 'active' : ''}`}>
        {isCollectionScreen && (
          <CollectionDetailScreen collectionId={activeScreen} onNavigate={handleNavigate} onOpenAttraction={handleOpenAttraction} selectedSlug={selectedAttraction?.slug || null} />
        )}
      </div>

      {/* Bottom Nav */}
      {!showOnboarding && (
        <nav className="v2-bottom-nav">
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
                  {item.icon}
                  {item.badge && <div className="v2-nav-badge">{item.badge}</div>}
                </div>
                <div className="v2-nav-btn-label">{item.label}</div>
              </button>
            );
          })}
        </nav>
      )}
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
