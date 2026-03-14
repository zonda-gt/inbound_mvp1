"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { getSavedPlaces, unsavePlace, fetchExtrasForSavedPlaces, type SavedPlace, type SavedPlaceExtra } from '@/lib/saved-places';
import { ALL_EAT_RESTAURANTS } from '../data/eat-restaurants';
import { useGeolocation } from '../hooks/useGeolocation';
import { track } from '@/lib/analytics';
import posthog from 'posthog-js';

const supabase = getSupabaseBrowserClient();

const fallbackRestaurantExtraBySlug = new Map<string, SavedPlaceExtra>(
  ALL_EAT_RESTAURANTS.map((restaurant) => [
    restaurant.slug,
    {
      images: restaurant.images?.length
        ? restaurant.images
        : restaurant.image
          ? [restaurant.image]
          : [],
      hook: restaurant.hook || restaurant.verdict || '',
      price: restaurant.price_cny != null ? `¥${restaurant.price_cny}/pp` : null,
      neighborhood: null,
      lat: null,
      lng: null,
    },
  ]),
);

function mergeExtra(
  primary: SavedPlaceExtra | undefined,
  fallback: SavedPlaceExtra | undefined,
): SavedPlaceExtra | undefined {
  if (!primary) return fallback;
  if (!fallback) return primary;
  return {
    images: primary.images?.length ? primary.images : fallback.images,
    hook: primary.hook || fallback.hook,
    price: primary.price || fallback.price,
    neighborhood: primary.neighborhood || fallback.neighborhood,
    lat: primary.lat ?? fallback.lat,
    lng: primary.lng ?? fallback.lng,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/* ── Carousel with snap-scroll + dots ── */
function ImageCarousel({ images, placeholder }: { images: string[]; placeholder: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = images.length;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || count <= 1) return;
    function onScroll() {
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActive(idx);
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  if (count === 0) {
    return (
      <div className="v2-saved-vcard-placeholder">{placeholder}</div>
    );
  }

  return (
    <>
      <div className="v2-saved-carousel" ref={scrollRef}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="v2-saved-carousel-slide" draggable={false} />
        ))}
      </div>
      {count > 1 && (
        <div className="v2-saved-dots">
          {images.map((_, i) => (
            <span key={i} className={`v2-saved-dot${i === active ? ' active' : ''}`} />
          ))}
        </div>
      )}
    </>
  );
}

function SavedPlacesList({ user, onNavigate }: { user: User; onNavigate: (screen: string) => void }) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [extraMap, setExtraMap] = useState<Record<string, SavedPlaceExtra>>({});
  const [loading, setLoading] = useState(true);
  const { location: userLoc } = useGeolocation();
  const userCoords = userLoc ? (() => { const [lng, lat] = userLoc.split(',').map(Number); return (lat && lng) ? { lat, lng } : null; })() : null;

  const load = useCallback(async () => {
    const data = await getSavedPlaces(supabase);
    setPlaces(data);
    setLoading(false);
    if (data.length > 0) {
      const extras = await fetchExtrasForSavedPlaces(supabase, data);
      setExtraMap(extras);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUnsave(place: SavedPlace) {
    setPlaces((prev) => prev.filter((p) => p.id !== place.id));
    await unsavePlace(supabase, place.place_type, place.place_slug);
  }

  function handleTap(place: SavedPlace) {
    const route = place.place_type === 'restaurant'
      ? `/restaurants/${place.place_slug}`
      : `/attractions/${place.place_slug}`;
    window.location.href = route;
  }

  if (loading) {
    return (
      <section className="v2-saved-section v2-fade-up v2-d2" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#AEAEB2', fontSize: 14 }}>Loading saved places...</p>
      </section>
    );
  }

  if (places.length === 0) {
    return (
      <section className="v2-saved-empty v2-fade-up v2-d2">
        <div className="v2-saved-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <p className="v2-saved-empty-title">No saved places yet</p>
        <p className="v2-saved-empty-sub">Tap the heart on any restaurant or attraction to save it here.</p>
      </section>
    );
  }

  return (
    <section className="v2-saved-section v2-fade-up v2-d2">
      <div className="v2-sec-hdr" style={{ padding: 0 }}>
        <h2 className="v2-sec-title">Saved Places</h2>
        <span className="v2-sec-link" style={{ color: '#AEAEB2' }}>{places.length} saved</span>
      </div>

      <div className="v2-saved-grid">
        {places.map((place) => {
          const key = `${place.place_type}:${place.place_slug}`;
          const fallbackExtra = place.place_type === 'restaurant'
            ? fallbackRestaurantExtraBySlug.get(place.place_slug)
            : undefined;
          const extra = mergeExtra(extraMap[key], fallbackExtra);
          const images = extra?.images?.length ? extra.images : (place.place_image ? [place.place_image] : []);
          const hook = extra?.hook || '';
          const placeholder = place.place_type === 'restaurant' ? '🍜' : '🏛️';
          const dist = (userCoords && extra?.lat && extra?.lng)
            ? formatDist(haversineKm(userCoords.lat, userCoords.lng, extra.lat, extra.lng))
            : null;
          const meta = [extra?.price, extra?.neighborhood, dist].filter(Boolean);

          return (
            <div key={place.id} className="v2-saved-vcard" onClick={() => handleTap(place)}>
              <div className="v2-saved-vcard-img">
                <ImageCarousel images={images} placeholder={placeholder} />
                <button
                  className="v2-saved-vcard-heart"
                  onClick={(e) => { e.stopPropagation(); handleUnsave(place); }}
                  aria-label="Remove saved place"
                >
                  <svg viewBox="0 0 32 32" width="24" height="24" fill="#FF385C" stroke="white" strokeWidth="2">
                    <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
                  </svg>
                </button>
                <div className="v2-saved-vcard-badge">
                  {place.place_type === 'restaurant' ? 'Restaurant' : 'Attraction'}
                </div>
              </div>
              <div className="v2-saved-vcard-info">
                <h3 className="v2-saved-vcard-name">{place.place_name}</h3>
                {meta.length > 0 && (
                  <p className="v2-saved-vcard-meta">{meta.join(' · ')}</p>
                )}
                {hook && <p className="v2-saved-vcard-hook">{hook}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface JournalScreenProps {
  onNavigate: (screen: string) => void;
}

export default function JournalScreen({ onNavigate }: JournalScreenProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const prevUserRef = useRef<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      prevUserRef.current = u;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const prevUser = prevUserRef.current;
      setUser(session?.user ?? null);
      if (!prevUser && session?.user) {
        const provider = session.user.app_metadata?.provider || 'email';
        track('auth_complete', { method: provider });
        posthog.identify(session.user.id, { email: session.user.email });
      }
      prevUserRef.current = session?.user ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    track('auth_start', { method: 'google' });
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
    track('auth_start', { method: 'email' });
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
                track('auth_start', { method: 'apple' });
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

  // Logged in — show saved places + account
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'Traveler';
  const userEmail = user.email || '';

  return (
    <div className="v2-scroll-body">
      {/* ───── Account Header ───── */}
      <section className="v2-account-hdr v2-fade-up v2-d1">
        <div className="v2-account-row">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="v2-account-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="v2-account-avatar v2-account-avatar-fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="v2-account-info">
            <h2 className="v2-account-name">{displayName}</h2>
            <p className="v2-account-email">{userEmail}</p>
          </div>
        </div>
      </section>

      {/* ───── Saved Places ───── */}
      <SavedPlacesList user={user} onNavigate={onNavigate} />

      {/* ───── Sign Out ───── */}
      <section className="v2-account-footer v2-fade-up v2-d3">
        <button className="v2-signout-btn" onClick={handleLogout}>Sign out</button>
      </section>

      <div className="v2-spacer-lg" />
    </div>
  );
}
