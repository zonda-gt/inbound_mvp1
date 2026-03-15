"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type BookingData = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  destination_name: string;
  destination_name_cn?: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  guest_email: string;
  confirmation_note?: string;
  confirmed_at?: string;
  created_at: string;
};

export default function BookingStatusPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBooking(data);
      } catch {
        setError("Could not load booking details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchBooking();
  }, [id]);

  const formatDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="bk-page">
      <style>{`
        .bk-page {
          min-height: 100dvh;
          background: #F8F8F8;
          font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
          display: flex; flex-direction: column; align-items: center;
          padding: 0 20px;
        }
        .bk-header {
          width: 100%; max-width: 480px;
          padding: 20px 0 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .bk-logo {
          display: flex; align-items: center; gap: 6px;
          text-decoration: none; color: inherit;
        }
        .bk-logo-mark {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #e8382e 0%, #c41e14 100%);
          color: #fff; font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .bk-logo-text { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; }
        .bk-logo-text em { font-style: normal; color: #e8382e; }

        .bk-card {
          width: 100%; max-width: 480px;
          background: #fff; border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,.06);
          border: 1px solid rgba(0,0,0,.06);
          overflow: hidden; margin-top: 8px;
        }

        /* Status badge */
        .bk-status-bar {
          padding: 20px 24px 16px;
          display: flex; align-items: center; gap: 14px;
        }
        .bk-status-icon {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bk-status-icon.pending { background: #FFF3E0; }
        .bk-status-icon.confirmed { background: #E8F5E9; }
        .bk-status-icon.cancelled { background: #FFEBEE; }

        .bk-status-title { font-size: 18px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.3px; }
        .bk-status-sub { font-size: 13px; color: #717171; margin-top: 2px; }

        /* Details grid */
        .bk-details {
          padding: 0 24px 20px;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .bk-detail { display: flex; flex-direction: column; gap: 4px; }
        .bk-detail-label {
          font-size: 11px; font-weight: 600; color: #717171;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .bk-detail-value { font-size: 15px; font-weight: 600; color: #1A1A1A; }
        .bk-detail.full { grid-column: 1 / -1; }

        /* Confirmation note */
        .bk-note {
          margin: 0 24px 20px;
          padding: 14px 16px;
          background: #F0FAF0;
          border-radius: 14px;
          border: 1px solid rgba(52,199,89,0.15);
        }
        .bk-note-label {
          font-size: 11px; font-weight: 700; color: #34C759;
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .bk-note-text { font-size: 14px; color: #1A1A1A; line-height: 1.5; }

        /* Pending info */
        .bk-pending-info {
          margin: 0 24px 20px;
          padding: 14px 16px;
          background: #FFF8F0;
          border-radius: 14px;
          border: 1px solid rgba(255,149,0,0.12);
          font-size: 13px; color: #717171; line-height: 1.5;
        }
        .bk-pending-info strong { color: #1A1A1A; }

        /* Actions */
        .bk-actions { padding: 0 24px 24px; display: flex; gap: 10px; }
        .bk-action {
          flex: 1; padding: 13px; border-radius: 14px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          text-align: center; text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: all .15s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          -webkit-tap-highlight-color: transparent;
        }
        .bk-action:active { transform: scale(.97); }
        .bk-action.primary {
          background: linear-gradient(135deg, #e8382e 0%, #c41e14 100%);
          color: #fff; border: none;
          box-shadow: 0 2px 10px rgba(196,30,20,.2);
        }
        .bk-action.secondary {
          background: #fff; color: #1A1A1A;
          border: 1.5px solid #E0E0E0;
        }

        /* Loading & Error */
        .bk-loading, .bk-error {
          width: 100%; max-width: 480px;
          text-align: center; padding: 60px 20px;
        }
        .bk-loading-dot {
          display: inline-block; width: 8px; height: 8px;
          background: #ccc; border-radius: 50%; margin: 0 4px;
          animation: bkPulse 1.2s ease-in-out infinite;
        }
        .bk-loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .bk-loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bkPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .bk-error-icon { font-size: 40px; margin-bottom: 12px; }
        .bk-error-text { font-size: 14px; color: #717171; }
      `}</style>

      {/* Header */}
      <div className="bk-header">
        <a className="bk-logo" href="/v2">
          <div className="bk-logo-mark">&#x4F60;</div>
          <span className="bk-logo-text">Hello<em>China</em></span>
        </a>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bk-loading">
          <div>
            <span className="bk-loading-dot" />
            <span className="bk-loading-dot" />
            <span className="bk-loading-dot" />
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "#717171" }}>Loading booking details...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bk-error">
          <div className="bk-error-icon">:(</div>
          <div className="bk-error-text">{error}</div>
          <a className="bk-action secondary" href="/v2" style={{ marginTop: 20, display: "inline-flex" }}>
            Back to HelloChina
          </a>
        </div>
      )}

      {/* Booking Card */}
      {booking && !loading && (
        <div className="bk-card">
          {/* Status */}
          <div className="bk-status-bar">
            <div className={`bk-status-icon ${booking.status}`}>
              {booking.status === "pending" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              )}
              {booking.status === "confirmed" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2.5 2.5L16 9" />
                </svg>
              )}
              {booking.status === "cancelled" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              )}
            </div>
            <div>
              <div className="bk-status-title">
                {booking.status === "pending" && "Booking Requested"}
                {booking.status === "confirmed" && "Booking Confirmed!"}
                {booking.status === "cancelled" && "Booking Cancelled"}
              </div>
              <div className="bk-status-sub">
                {booking.status === "pending" && "We're working on your reservation"}
                {booking.status === "confirmed" && "Your table is ready"}
                {booking.status === "cancelled" && "This booking was cancelled"}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bk-details">
            <div className="bk-detail full">
              <span className="bk-detail-label">Restaurant</span>
              <span className="bk-detail-value">
                {booking.destination_name}
                {booking.destination_name_cn && ` (${booking.destination_name_cn})`}
              </span>
            </div>
            <div className="bk-detail">
              <span className="bk-detail-label">Date</span>
              <span className="bk-detail-value">{formatDate(booking.booking_date)}</span>
            </div>
            <div className="bk-detail">
              <span className="bk-detail-label">Time</span>
              <span className="bk-detail-value">{formatTime(booking.booking_time)}</span>
            </div>
            <div className="bk-detail">
              <span className="bk-detail-label">Guests</span>
              <span className="bk-detail-value">{booking.party_size} guest{booking.party_size !== 1 ? "s" : ""}</span>
            </div>
            <div className="bk-detail">
              <span className="bk-detail-label">Email</span>
              <span className="bk-detail-value" style={{ fontSize: 13 }}>{booking.guest_email}</span>
            </div>
          </div>

          {/* Confirmation note */}
          {booking.status === "confirmed" && booking.confirmation_note && (
            <div className="bk-note">
              <div className="bk-note-label">Reservation Details</div>
              <div className="bk-note-text">{booking.confirmation_note}</div>
            </div>
          )}

          {/* Pending info */}
          {booking.status === "pending" && (
            <div className="bk-pending-info">
              <strong>What happens next?</strong><br />
              Our team is booking your table right now. You&apos;ll receive a confirmation email
              at <strong>{booking.guest_email}</strong> once it&apos;s done — usually within a few hours.
            </div>
          )}

          {/* Actions */}
          <div className="bk-actions">
            {booking.status === "confirmed" && (
              <a
                className="bk-action primary"
                href={`/v2?nav=${encodeURIComponent(booking.destination_name_cn || booking.destination_name)}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Get Directions
              </a>
            )}
            <a className="bk-action secondary" href="/v2">
              Back to HelloChina
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
