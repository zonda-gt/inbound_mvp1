"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  dbMessageId: string;
  sessionId: string;
  userQuery: string;
};

export default function MessageFeedback({ dbMessageId, sessionId, userQuery }: Props) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showThanks, setShowThanks] = useState(false);
  const [thanksMessage, setThanksMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showFeedbackInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showFeedbackInput]);

  useEffect(() => {
    if (showThanks) {
      const timer = setTimeout(() => setShowThanks(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showThanks]);

  const sendFeedback = async (
    newRating: "up" | "down",
    text?: string,
  ) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: dbMessageId,
          sessionId,
          rating: newRating,
          feedbackText: text || null,
          userQuery,
        }),
      });
    } catch (e) {
      console.error("[Feedback] Failed to send:", e);
    }
  };

  const handleThumbsUp = async () => {
    if (rating === "up") return; // Already selected
    const wasDown = rating === "down";
    setRating("up");
    setShowFeedbackInput(false);
    setFeedbackText("");
    setThanksMessage("Thanks!");
    setShowThanks(true);
    await sendFeedback("up");
    if (wasDown) {
      // Changed mind — upsert handles the update
    }
  };

  const handleThumbsDown = async () => {
    if (rating === "down") return; // Already selected
    setRating("down");
    setShowFeedbackInput(true);
    await sendFeedback("down");
    setThanksMessage("Thanks for the feedback");
    setShowThanks(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      setShowFeedbackInput(false);
      return;
    }
    setSubmittingFeedback(true);
    await sendFeedback("down", feedbackText.trim());
    setSubmittingFeedback(false);
    setShowFeedbackInput(false);
    setThanksMessage("Thanks for the feedback");
    setShowThanks(true);
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-end gap-1">
        {/* Thumbs up */}
        <button
          onClick={handleThumbsUp}
          className={`rounded-full p-1 text-xs transition-all ${
            rating === "up"
              ? "text-green-600"
              : rating === "down"
                ? "hidden"
                : "text-gray-300 hover:text-gray-500"
          }`}
          aria-label="Thumbs up"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={rating === "up" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
        </button>

        {/* Thumbs down */}
        <button
          onClick={handleThumbsDown}
          className={`rounded-full p-1 text-xs transition-all ${
            rating === "down"
              ? "text-red-500"
              : rating === "up"
                ? "hidden"
                : "text-gray-300 hover:text-gray-500"
          }`}
          aria-label="Thumbs down"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={rating === "down" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 14V2" />
            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
        </button>

        {/* Thanks message */}
        {showThanks && (
          <span className="ml-1 text-[11px] text-gray-400 animate-pulse">
            {thanksMessage}
          </span>
        )}
      </div>

      {/* Feedback text input for thumbs down */}
      {showFeedbackInput && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitFeedback();
              if (e.key === "Escape") setShowFeedbackInput(false);
            }}
            placeholder="What went wrong?"
            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300"
          />
          <button
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback}
            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Submit
          </button>
          <button
            onClick={() => setShowFeedbackInput(false)}
            className="px-1 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
