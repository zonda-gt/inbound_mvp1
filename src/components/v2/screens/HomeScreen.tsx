'use client';

import { useState } from 'react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="v2-scroll-body">
      {/* 1. Hero Header */}
      <div className="v2-home-hero">
        <div className="v2-home-hero-glow" />
        <div className="v2-home-top">
          <div className="v2-home-logo">
            <div className="v2-logo-mark">你</div>
            <span className="v2-logo-text">Hello<em>China</em></span>
          </div>
          <div className="v2-home-top-right">
            <div className="v2-notif-btn">🔔<div className="v2-notif-dot" /></div>
            <div className="v2-avatar-btn">A</div>
          </div>
        </div>
        <div className="v2-home-greeting">
          <div className="v2-greeting-eyebrow">Thursday · Shanghai · 7°C ☁️</div>
          <div className="v2-greeting-text">
            Morning, Alex <span className="wave">👋</span><br />Ready to eat?
          </div>
        </div>
        <div className="v2-context-strip" style={{ marginTop: 14 }}>
          <div className="v2-ctx-pill"><div className="v2-ctx-live-dot" /> People&apos;s Square</div>
          <div className="v2-ctx-pill">🌐 Connected</div>
          <div className="v2-ctx-pill">🔋 Offline ready</div>
        </div>
      </div>

      {/* 2. Search */}
      <div className="v2-search-wrap v2-fade-up v2-d1">
        <div className="v2-search-bar">
          <span className="v2-search-icon">🔍</span>
          <input
            className="v2-search-input"
            type="text"
            placeholder="Ask anything — food, directions, phrases…"
          />
          <div className="v2-search-cam" onClick={() => onNavigate('photo')}>📷</div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="v2-quick-actions v2-fade-up v2-d2">
        <div className="v2-section-label">Quick access</div>
        <div className="v2-qa-grid">
          <div className="v2-qa-item" onClick={() => onNavigate('discover')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#FF6B35,#D0021B)' }}>🍜</div>
            <div className="v2-qa-label">Find Food</div>
          </div>
          <div className="v2-qa-item" onClick={() => onNavigate('navigate')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>🚇</div>
            <div className="v2-qa-label">Navigate</div>
          </div>
          <div className="v2-qa-item" onClick={() => onNavigate('photo')}>
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#34C759,#30D158)' }}>📷</div>
            <div className="v2-qa-label">Photo AI</div>
          </div>
          <div className="v2-qa-item">
            <div className="v2-qa-icon" style={{ background: 'linear-gradient(135deg,#C9A84C,#FF9500)' }}>🗺️</div>
            <div className="v2-qa-label">Explore</div>
          </div>
        </div>
      </div>

      {/* 4. Today's Pick */}
      <div className="v2-todays-pick v2-fade-up v2-d2">
        <div className="v2-section-label">✦ Today&apos;s Pick for you</div>
        <div className="v2-pick-card" onClick={() => onNavigate('discover')}>
          <div className="v2-pick-card-img-ph">🍱</div>
          <div className="v2-pick-overlay" />
          <div className="v2-pick-badge">✦ AI Pick · Lunch</div>
          <div className="v2-pick-save" onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}>
            {saved ? '❤️' : '🤍'}
          </div>
          <div className="v2-pick-body">
            <div className="v2-pick-name">COMMUNE Reserve</div>
            <div className="v2-pick-meta">
              <div className="v2-pick-meta-item">⭐ 4.7</div>
              <div className="v2-pick-meta-item">· ¥130/person</div>
              <div className="v2-pick-meta-item">· 440m away</div>
            </div>
            <div className="v2-pick-ai-reason">
              &ldquo;Perfect for a solo lunch — skyline views, English menu, and they&apos;re never too crowded on weekdays.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* 5. Dish Passport */}
      <div className="v2-passport-section v2-fade-up v2-d3">
        <div className="v2-passport-card" onClick={() => onNavigate('discover')}>
          <div className="v2-passport-bg-pattern" />
          <div className="v2-passport-top">
            <div>
              <div className="v2-passport-title">🍜 Dish Passport</div>
              <div className="v2-passport-subtitle">Your Shanghai food journey</div>
            </div>
            <div className="v2-passport-badge">Level 2</div>
          </div>
          <div className="v2-passport-dishes">
            <div className="v2-dish-stamp done" title="Xiaolongbao">🥟</div>
            <div className="v2-dish-stamp done" title="Noodles">🍜</div>
            <div className="v2-dish-stamp done" title="Scallion pancake">🫓</div>
            <div className="v2-dish-stamp" title="Peking Duck">🦆</div>
            <div className="v2-dish-stamp locked" title="Hotpot">🍲</div>
            <div className="v2-dish-stamp locked" title="Mapo Tofu">🌶️</div>
          </div>
          <div className="v2-passport-progress">
            <div className="v2-progress-bar-wrap">
              <div className="v2-progress-bar-fill" style={{ width: '50%' }} />
            </div>
            <div className="v2-progress-text"><strong>3 of 6</strong> Shanghai classics tried · 3 more to unlock</div>
          </div>
        </div>
      </div>

      {/* 6. Pocket Phrases */}
      <div className="v2-phrase-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Pocket Phrases</span>
          <span className="v2-sec-link">See all</span>
        </div>
        <div className="v2-phrase-scroll">
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">No spicy please</div>
            <div className="v2-phrase-cn">不要辣</div>
            <div className="v2-phrase-pinyin">Bù yào là</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">The bill please</div>
            <div className="v2-phrase-cn">买单</div>
            <div className="v2-phrase-pinyin">Mǎi dān</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">Where is the toilet?</div>
            <div className="v2-phrase-cn">厕所在哪里？</div>
            <div className="v2-phrase-pinyin">Cèsuǒ zài nǎlǐ?</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
          <div className="v2-phrase-card">
            <div className="v2-phrase-en">I&apos;m allergic to...</div>
            <div className="v2-phrase-cn">我对...过敏</div>
            <div className="v2-phrase-pinyin">Wǒ duì... guòmǐn</div>
            <div className="v2-phrase-audio">🔊 Tap to hear</div>
          </div>
        </div>
      </div>

      {/* 7. Neighbourhood Vibes */}
      <div className="v2-vibes-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Neighbourhood Vibes</span>
          <span className="v2-sec-link">Map view</span>
        </div>
        <div className="v2-vibes-scroll">
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#2d1b69,#11998e)' }}>🌿</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">French Concession</div>
              <div className="v2-vibe-mood">Coffee · Vintage · Brunch</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#1a0508,#4a0e1a)' }}>🌃</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">The Bund</div>
              <div className="v2-vibe-mood">Cocktails · Views · Rooftop</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#0d4f3c,#1a8c5a)' }}>🏮</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">Xintiandi</div>
              <div className="v2-vibe-mood">Upscale · History · Tapas</div>
            </div>
          </div>
          <div className="v2-vibe-card">
            <div className="v2-vibe-bg" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>🍜</div>
            <div className="v2-vibe-overlay" />
            <div className="v2-vibe-body">
              <div className="v2-vibe-name">People&apos;s Square</div>
              <div className="v2-vibe-mood">Street Food · Metro Hub</div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Tonight's Plan */}
      <div className="v2-tonight-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr" style={{ marginBottom: 10 }}>
          <span className="v2-sec-title">Tonight&apos;s Plan ✨</span>
          <span className="v2-sec-link">Customise</span>
        </div>
        <div className="v2-tonight-card">
          <div className="v2-tonight-stars" />
          <div className="v2-tonight-top">
            <div className="v2-tonight-title">AI-curated evening for you</div>
            <div className="v2-tonight-time">From 6pm</div>
          </div>
          <div className="v2-tonight-steps">
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">1</div>
              <div className="v2-tonight-step-text"><strong>6:30pm</strong> — Xiaolongbao at Din Tai Fung (30 min walk)</div>
            </div>
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">2</div>
              <div className="v2-tonight-step-text"><strong>8:00pm</strong> — Rooftop cocktails at Bar Rouge, The Bund</div>
            </div>
            <div className="v2-tonight-step">
              <div className="v2-tonight-step-num">3</div>
              <div className="v2-tonight-step-text"><strong>10:00pm</strong> — Night market snacks at Yuyuan Bazaar</div>
            </div>
          </div>
          <div className="v2-tonight-cta" onClick={() => onNavigate('navigate')}>
            <div className="v2-tonight-cta-text">Start this evening →</div>
            <div className="v2-tonight-cta-arrow">→</div>
          </div>
        </div>
      </div>

      {/* 9. Survival Kit */}
      <div className="v2-survival-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">Survival Kit 🛟</span>
          <span className="v2-sec-link">See all</span>
        </div>
        <div className="v2-survival-grid">
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#FF9500,#FF6B35)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(255,149,0,0.1)' }}>💳</div>
            <div className="v2-survival-card-title">Alipay Setup</div>
            <div className="v2-survival-card-sub">Pay everywhere in 5 min</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#D0021B,#FF3B30)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(208,2,27,0.08)' }}>🚨</div>
            <div className="v2-survival-card-title">Emergency</div>
            <div className="v2-survival-card-sub">Phrases & numbers</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(0,122,255,0.08)' }}>📶</div>
            <div className="v2-survival-card-title">VPN & SIM</div>
            <div className="v2-survival-card-sub">Stay connected guide</div>
          </div>
          <div className="v2-survival-card">
            <div className="v2-survival-card-stripe" style={{ background: 'linear-gradient(90deg,#34C759,#30D158)' }} />
            <div className="v2-survival-card-icon" style={{ background: 'rgba(52,199,89,0.08)' }}>🏥</div>
            <div className="v2-survival-card-title">Medical Help</div>
            <div className="v2-survival-card-sub">English-speaking clinics</div>
          </div>
        </div>
      </div>

      {/* 10. Traveller Reviews */}
      <div className="v2-reviews-section v2-fade-up v2-d5">
        <div className="v2-sec-hdr">
          <span className="v2-sec-title">From Travellers Like You</span>
          <span className="v2-sec-link">See more</span>
        </div>
        <div className="v2-reviews-scroll">
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#FF6B35,#D0021B)' }}>S</div>
              <div>
                <div className="v2-review-name">Sophie M.</div>
                <div className="v2-review-from">🇬🇧 London · 3 days ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;Used the photo AI to identify a dish I couldn&apos;t read — turned out to be the best thing I ate in Shanghai. Game changer.&rdquo;
            </div>
            <div className="v2-review-place">📍 Xun Yu Ji Noodles</div>
          </div>
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>J</div>
              <div>
                <div className="v2-review-name">James K.</div>
                <div className="v2-review-from">🇦🇺 Sydney · 1 week ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;The metro navigation saved me so many times. It even tells you which exit to use. Absolutely essential app.&rdquo;
            </div>
            <div className="v2-review-place">📍 People&apos;s Square Station</div>
          </div>
          <div className="v2-review-card">
            <div className="v2-review-top">
              <div className="v2-review-avatar" style={{ background: 'linear-gradient(135deg,#34C759,#30D158)' }}>M</div>
              <div>
                <div className="v2-review-name">Maria L.</div>
                <div className="v2-review-from">🇩🇪 Berlin · 2 weeks ago</div>
              </div>
            </div>
            <div className="v2-review-stars">
              <span className="v2-review-star">★★★★★</span>
            </div>
            <div className="v2-review-text">
              &ldquo;The Tonight&apos;s Plan feature gave me the perfect evening in Shanghai. Felt like I had a local friend planning my night.&rdquo;
            </div>
            <div className="v2-review-place">📍 The Bund</div>
          </div>
        </div>
      </div>

      <div className="v2-spacer-lg" />
    </div>
  );
}
