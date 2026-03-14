'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const supabase = getSupabaseBrowserClient();

interface FeedbackScreenProps {
  onNavigate: (screen: string) => void;
}

export default function FeedbackScreen({ onNavigate }: FeedbackScreenProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() && rating === 0) return;
    setSubmitting(true);
    try {
      await supabase.from('feedback').insert({ rating: rating || null, message: text.trim() || null });
    } catch {
      // silently fail — feedback is best-effort
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="v2-feedback-screen">
        <div className="v2-feedback-top">
          <button type="button" className="v2-feedback-back" onClick={() => onNavigate('home')}>
            ← Back
          </button>
        </div>
        <div className="v2-feedback-success">
          <div className="v2-feedback-success-icon">🙏</div>
          <div className="v2-feedback-success-title">Thank you!</div>
          <div className="v2-feedback-success-sub">Your feedback helps us make HelloChina better for everyone.</div>
          <button type="button" className="v2-feedback-done-btn" onClick={() => onNavigate('home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-feedback-screen">
      <div className="v2-feedback-top">
        <button type="button" className="v2-feedback-back" onClick={() => onNavigate('home')}>
          ← Back
        </button>
      </div>

      <div className="v2-feedback-body">
        <h1 className="v2-feedback-title">Give us feedback</h1>
        <p className="v2-feedback-subtitle">We&apos;re building this for travellers like you. Every bit of feedback helps!</p>

        <div className="v2-feedback-rating">
          <div className="v2-feedback-label">How&apos;s your experience so far?</div>
          <div className="v2-feedback-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`v2-feedback-star ${n <= rating ? 'active' : ''}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="v2-feedback-field">
          <div className="v2-feedback-label">Tell us more</div>
          <textarea
            className="v2-feedback-textarea"
            placeholder="What do you love? What could be better? Any features you'd like to see?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
        </div>

        <button
          type="button"
          className="v2-feedback-submit"
          onClick={handleSubmit}
          disabled={submitting || (!text.trim() && rating === 0)}
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>
    </div>
  );
}
