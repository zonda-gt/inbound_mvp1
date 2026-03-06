"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
);

interface JournalScreenProps {
  onNavigate: (screen: string) => void;
}

export default function JournalScreen({ onNavigate }: JournalScreenProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    setLoggingIn(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) { setLoginError(error.message); setLoggingIn(false); }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoggingIn(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (error) { setLoginError(error.message); setLoggingIn(false); }
    else { setEmailSent(true); setLoggingIn(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Loading
  if (user === undefined) {
    return <div className="v2-scroll-body" />;
  }

  // Not logged in — show login gate
  if (user === null) {
    return (
      <div className="v2-login-gate">
        {/* Atmospheric backdrop */}
        <div className="v2-login-backdrop">
          <div className="v2-login-orb v2-login-orb-1" />
          <div className="v2-login-orb v2-login-orb-2" />
          <div className="v2-login-orb v2-login-orb-3" />
        </div>

        {/* Top visual */}
        <div className="v2-login-visual">
          <div className="v2-login-brand">
            <span className="v2-login-brand-dot" />
            <span className="v2-login-brand-name">HelloChina</span>
          </div>
          <div className="v2-login-headline">
            <h1 className="v2-login-h1">Your Journey.<br />Your Story.</h1>
            <p className="v2-login-tagline">Save places, track experiences<br />and relive every moment.</p>
          </div>
        </div>

        {/* Bottom sheet */}
        <div className="v2-login-sheet">
          <div className="v2-login-sheet-handle" />

          {emailSent ? (
            <div className="v2-login-sent">
              <div className="v2-login-sent-icon">✉️</div>
              <p className="v2-login-sent-title">Check your inbox</p>
              <p className="v2-login-sent-sub">Magic link sent to <strong>{email}</strong></p>
              <button className="v2-login-back-btn" onClick={() => { setEmailSent(false); setEmail(''); }}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Apple — must be first per Apple HIG */}
              <button className="v2-signin-btn v2-signin-apple" onClick={async () => {
                setLoggingIn(true); setLoginError('');
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'apple',
                  options: { redirectTo: window.location.href },
                });
                if (error) { setLoginError(error.message); setLoggingIn(false); }
              }} disabled={loggingIn}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </button>

              {/* Google */}
              <button className="v2-signin-btn v2-signin-google" onClick={handleGoogleLogin} disabled={loggingIn}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="v2-login-divider"><span>or</span></div>

              <form className="v2-login-email-form" onSubmit={handleEmailLogin}>
                <input
                  className="v2-login-email-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loggingIn}
                  autoComplete="email"
                />
                <button
                  className="v2-signin-btn v2-signin-email"
                  type="submit"
                  disabled={loggingIn || !email.trim()}
                >
                  {loggingIn ? 'Sending…' : 'Continue with email'}
                </button>
              </form>

              {loginError && <p className="v2-login-error">{loginError}</p>}
              <p className="v2-login-terms">By continuing you agree to our Terms &amp; Privacy Policy</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Logged in — show journal
  return (
    <div className="v2-scroll-body">
      {/* ───── 1. Header ───── */}
      <section className="v2-journal-hdr v2-fade-up v2-d1">
        <div className="v2-journal-title-row">
          <h1 className="v2-journal-title">My Journey</h1>
          <button className="v2-journal-add-btn">+</button>
        </div>
        <p className="v2-journal-sub">
          Shanghai &middot; Day 4 of your trip
        </p>
        <button className="v2-journal-logout-btn" onClick={handleLogout}>Sign out</button>
      </section>

      {/* ───── 2. Trip Stats ───── */}
      <section className="v2-trip-stats v2-fade-up v2-d1">
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num red">12</span>
          <span className="v2-trip-stat-label">Places visited</span>
        </div>
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num">3</span>
          <span className="v2-trip-stat-label">Dishes tried</span>
        </div>
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num">8</span>
          <span className="v2-trip-stat-label">Photos scanned</span>
        </div>
      </section>

      {/* ───── 3. Dish Passport ───── */}
      <section className="v2-passport-section v2-fade-up v2-d2">
        <div className="v2-passport-card">
          <div className="v2-passport-bg-pattern" />
          <div className="v2-passport-top">
            <div>
              <h3 className="v2-passport-title">🍜 Dish Passport</h3>
              <p className="v2-passport-subtitle">
                3 of 6 Shanghai classics
              </p>
            </div>
            <span className="v2-passport-badge">Level 2</span>
          </div>
          <div className="v2-passport-dishes">
            <span className="v2-dish-stamp done">🥟</span>
            <span className="v2-dish-stamp done">🍜</span>
            <span className="v2-dish-stamp done">🫓</span>
            <span className="v2-dish-stamp">🦆</span>
            <span className="v2-dish-stamp locked">🍲</span>
            <span className="v2-dish-stamp locked">🌶️</span>
          </div>
          <div className="v2-passport-progress">
            <div className="v2-progress-bar-wrap">
              <div className="v2-progress-bar-fill" style={{ width: "50%" }} />
            </div>
            <p className="v2-progress-text">
              3 of 6 unlocked &middot; Try Peking Duck next!
            </p>
          </div>
        </div>
      </section>

      {/* ───── 4. Saved Places ───── */}
      <section className="v2-saved-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr" style={{ padding: 0 }}>
          <h2 className="v2-sec-title">Saved Places</h2>
          <button className="v2-sec-link">Map view</button>
        </div>

        <div className="v2-saved-card" onClick={() => onNavigate("navigate")}>
          <div className="v2-saved-img">🍜</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">Xun Yu Ji Noodles</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥38</span>
              <span className="v2-pill gray">320m away</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-saved-visited">✓ Visited</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>

        <div className="v2-saved-card" onClick={() => onNavigate("navigate")}>
          <div className="v2-saved-img">🍱</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">COMMUNE Reserve</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥130</span>
              <span className="v2-pill gray">440m away</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-pill gray">Tonight?</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>

        <div className="v2-saved-card" onClick={() => onNavigate("navigate")}>
          <div className="v2-saved-img">🌃</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">Bar Rouge, The Bund</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥80 cocktails</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-pill gold">On plan</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>
      </section>

      {/* ───── 5. Trip Diary ───── */}
      <section className="v2-diary-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr" style={{ padding: 0 }}>
          <h2 className="v2-sec-title">Trip Diary</h2>
          <button className="v2-sec-link">+ Add note</button>
        </div>

        <div className="v2-diary-card">
          <p className="v2-diary-date">Thursday, 26 Feb &middot; Day 4</p>
          <p className="v2-diary-text">
            Finally tried xiaolongbao at Din Tai Fung &mdash; the soup inside
            explodes in your mouth. Worth every minute of the queue. Used the
            photo AI to figure out what the mystery dish next to me was (turned
            out to be scallion pancake, now obsessed).
          </p>
          <div className="v2-diary-photos">
            <div className="v2-diary-photo"><div className="v2-diary-photo-ph">🥟</div></div>
            <div className="v2-diary-photo"><div className="v2-diary-photo-ph">🍜</div></div>
            <div className="v2-diary-photo"><div className="v2-diary-photo-ph">🫓</div></div>
          </div>
        </div>

        <div className="v2-diary-card">
          <p className="v2-diary-date">Wednesday, 25 Feb &middot; Day 3</p>
          <p className="v2-diary-text">
            Took the metro to The Bund &mdash; the navigation feature told me
            exactly which exit to use. Sunset over Pudong was unreal. Had
            cocktails at Bar Rouge, felt very fancy for ¥80.
          </p>
          <div className="v2-diary-photos">
            <div className="v2-diary-photo"><div className="v2-diary-photo-ph">🌃</div></div>
            <div className="v2-diary-photo"><div className="v2-diary-photo-ph">🍸</div></div>
          </div>
        </div>
      </section>

      <div className="v2-spacer-lg" />
    </div>
  );
}
