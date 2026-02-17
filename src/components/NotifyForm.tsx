"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "hellochina_notify_signed_up";

const VISIT_OPTIONS = [
  { value: "", label: "When are you visiting China?" },
  { value: "already_here", label: "I'm already here" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "1_3_months", label: "1-3 months" },
  { value: "exploring", label: "Just exploring" },
];

export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [visitTiming, setVisitTiming] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Check localStorage on mount for previous signup
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
      setStatus("success");
    }
  }, []);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;
    if (!sheetUrl) {
      setErrorMsg("Email collection is not configured yet");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      await fetch(sheetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          visitTiming: visitTiming || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      // With no-cors we can't read the response, so assume success
      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong — please try again");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-900">You&apos;re on the list!</p>
        <p className="text-sm text-gray-500">We&apos;ll let you know when new features drop.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMsg) setErrorMsg("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </span>
          ) : (
            "Notify me"
          )}
        </button>
      </div>
      <select
        value={visitTiming}
        onChange={(e) => setVisitTiming(e.target.value)}
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
      >
        {VISIT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
    </div>
  );
}
