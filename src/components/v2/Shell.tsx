'use client';

import { useState, useCallback } from 'react';
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

const navItems: { id: NavTab; icon: string; label: string; badge?: number }[] = [
  { id: 'home', icon: '\uD83C\uDFE0', label: 'Home' },
  { id: 'discover', icon: '\uD83D\uDDFA\uFE0F', label: 'Shanghai' },
  { id: 'navigate', icon: '\uD83D\uDE87', label: 'Navigate' },
  { id: 'photo', icon: '\uD83D\uDCF7', label: 'Photo AI' },
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
        <PhotoScreen onNavigate={handleNavigate} />
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
          <CollectionDetailScreen collectionId={activeScreen} onNavigate={handleNavigate} />
        )}
      </div>

      {/* Bottom Nav */}
      {!showOnboarding && (
        <nav className="v2-bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`v2-nav-btn ${(screenToTab[activeScreen] || 'discover') === item.id ? 'active' : ''}`}
              onClick={() => setActiveScreen(item.id)}
            >
              <div className="v2-nav-btn-icon">
                {item.icon}
                {item.badge && <div className="v2-nav-badge">{item.badge}</div>}
              </div>
              <div className="v2-nav-btn-label">{item.label}</div>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
