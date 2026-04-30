'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { LOGIN_ENABLED } from '@/lib/feature-flags';

const supabase = getSupabaseBrowserClient();

interface SaveSheetProps {
  isOpen: boolean;
  placeName?: string;
  onClose: () => void;
  onLoggedIn?: () => void; // called when user successfully signs in
}

export default function SaveSheet({ isOpen, placeName, onClose, onLoggedIn }: SaveSheetProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmail(''); setEmailSent(false); setLoading(false);
        setError(''); setShowEmail(false);
      }, 300);
    }
  }, [isOpen]);

  async function handleApple() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.href },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setEmailSent(true); setLoading(false); }
  }

  if (!isOpen || typeof document === 'undefined') return null;

  if (!LOGIN_ENABLED) {
    return createPortal(
      <div className="v2-save-overlay" onClick={onClose}>
        <div className="v2-save-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="v2-save-sheet-handle" />
          <button className="v2-save-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="v2-save-header">
            <div className="v2-save-icon">
              <svg viewBox="0 0 32 32" width="44" height="44" fill="#FF385C" stroke="none">
                <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
              </svg>
            </div>
            <h2 className="v2-save-title">Coming Soon</h2>
            <p className="v2-save-sub">
              {placeName ? `Saving ${placeName} to your wishlist will be available in a future update.` : 'Saving places will be available in a future update.'}
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="v2-save-overlay" onClick={onClose}>
      <div className="v2-save-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="v2-save-sheet-handle" />

        {/* Close button */}
        <button className="v2-save-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {emailSent ? (
          <div className="v2-save-sent">
            <div className="v2-save-sent-icon">✉️</div>
            <p className="v2-save-sent-title">Check your inbox</p>
            <p className="v2-save-sent-sub">Magic link sent to <strong>{email}</strong></p>
            <button className="v2-save-back-btn" onClick={() => { setEmailSent(false); setEmail(''); }}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="v2-save-header">
              <div className="v2-save-icon">
                <svg viewBox="0 0 32 32" width="44" height="44" fill="#FF385C" stroke="none">
                  <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
                </svg>
              </div>
              <h2 className="v2-save-title">Save to your wishlist</h2>
              <p className="v2-save-sub">
                {placeName ? `Sign in to save ${placeName} and build your trip.` : 'Sign in to save places and build your perfect Shanghai trip.'}
              </p>
            </div>

            <div className="v2-save-actions">
              {/* Apple first — required by Apple HIG */}
              <button className="v2-save-btn v2-save-apple" onClick={handleApple} disabled={loading}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </button>

              <button className="v2-save-btn v2-save-google" onClick={handleGoogle} disabled={loading}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="v2-save-divider"><span>or</span></div>

              {showEmail ? (
                <form className="v2-save-email-form" onSubmit={handleEmail}>
                  <input
                    className="v2-save-email-input"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                  />
                  <button className="v2-save-btn v2-save-email-btn" type="submit" disabled={loading || !email.trim()}>
                    {loading ? 'Sending…' : 'Send magic link'}
                  </button>
                </form>
              ) : (
                <button className="v2-save-email-link" onClick={() => setShowEmail(true)}>
                  Continue with email
                </button>
              )}

              {error && <p className="v2-save-error">{error}</p>}
            </div>

            <p className="v2-save-terms">By continuing you agree to our Terms &amp; Privacy Policy</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
