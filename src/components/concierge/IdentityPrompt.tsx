"use client";

import { useEffect, useState } from "react";
import { detectCity, type ConciergeIdentity } from "@/lib/concierge";

interface Props {
  onSubmit: (identity: ConciergeIdentity) => void;
  onCancel: () => void;
}

export default function IdentityPrompt({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [detectingCity, setDetectingCity] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    detectCity().then((detected) => {
      if (cancelled) return;
      if (detected) setCity(detected);
      setDetectingCity(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    onSubmit({
      displayName: name.trim(),
      city: city.trim() || null,
      email: email.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h2 className="text-xl font-semibold text-gray-900">Say hi 👋</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us a bit about yourself so we can help faster. Replies usually arrive within an hour.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">What should we call you?</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#D0021B] focus:outline-none focus:ring-1 focus:ring-[#D0021B]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Which city are you in?</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={detectingCity ? "Detecting…" : "e.g. Shanghai"}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#D0021B] focus:outline-none focus:ring-1 focus:ring-[#D0021B]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="font-normal text-gray-400">(optional, for reply alerts)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#D0021B] focus:outline-none focus:ring-1 focus:ring-[#D0021B]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-[2] rounded-lg bg-[#D0021B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A30015] disabled:bg-gray-300"
            >
              {submitting ? "Starting…" : "Start chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
