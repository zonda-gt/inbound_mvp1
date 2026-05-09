"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  fetchThread,
  getStoredIdentity,
  markRead,
  sendMessage,
  storeIdentity,
  subscribeToThread,
  type ConciergeIdentity,
  type ConciergeMessage,
  type ConciergeThread,
} from "@/lib/concierge";
import IdentityPrompt from "./IdentityPrompt";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type MessageStatus = "sending" | "failed" | "sent";

function getStatus(m: ConciergeMessage): MessageStatus {
  if (m.id.startsWith("failed-")) return "failed";
  if (m.id.startsWith("optimistic-")) return "sending";
  return "sent";
}

export default function ConciergeChat() {
  const [thread, setThread] = useState<ConciergeThread | null>(null);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [identity, setIdentity] = useState<ConciergeIdentity | null>(null);
  const [draft, setDraft] = useState("");
  const [showIdentity, setShowIdentity] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Initial load + safety-net polling + visibility-change refetch.
  // Realtime is primary; this reconciles dropped events (background-tab
  // throttling, WS reconnects, etc.).
  useEffect(() => {
    let cancelled = false;
    let firstLoad = true;
    setIdentity(getStoredIdentity());

    const refetch = () => {
      fetchThread().then((res) => {
        if (cancelled) return;
        setThread(res.thread);
        setMessages((prev) => {
          // Preserve local-only messages (still sending or failed) across refetches.
          const localOnly = prev.filter(
            (m) => m.id.startsWith("optimistic-") || m.id.startsWith("failed-"),
          );
          const serverIds = new Set(res.messages.map((m) => m.id));
          const surviving = localOnly.filter((m) => !serverIds.has(m.id));
          return [...res.messages, ...surviving];
        });
        if (firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
        if (res.thread && res.thread.user_unread_count > 0) {
          markRead().catch(() => {});
        }
      });
    };

    refetch();
    const poll = setInterval(refetch, 8_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Realtime subscription when thread known.
  useEffect(() => {
    if (!thread) return;
    const unsubscribe = subscribeToThread(thread.id, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.sender === "admin") {
        markRead().catch(() => {});
      }
    });
    return unsubscribe;
  }, [thread]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const handleSend = useCallback(
    async (text: string, withIdentity: ConciergeIdentity | null) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setSending(true);

      // Optimistic insert.
      const optimistic: ConciergeMessage = {
        id: `optimistic-${Date.now()}`,
        thread_id: thread?.id ?? "pending",
        sender: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      setDraft("");

      const result = await sendMessage(trimmed, withIdentity);
      setSending(false);
      if (!result) {
        // Mark as failed (keep visible, allow tap-to-retry) instead of dropping.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...m, id: `failed-${optimistic.id}` } : m,
          ),
        );
        return;
      }
      // Replace optimistic with confirmed, but skip if realtime already
      // delivered the same row (otherwise we'd duplicate by m.id).
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
        if (withoutOptimistic.some((m) => m.id === result.message.id)) {
          return withoutOptimistic;
        }
        return [...withoutOptimistic, result.message];
      });
      setThread(result.thread);
    },
    [thread],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    if (!identity) {
      setShowIdentity(true);
      return;
    }
    handleSend(draft, identity);
  };

  const onIdentitySubmit = (next: ConciergeIdentity) => {
    storeIdentity(next);
    setIdentity(next);
    setShowIdentity(false);
    if (draft.trim()) handleSend(draft, next);
  };

  const handleRetry = useCallback(
    (failed: ConciergeMessage) => {
      if (!identity) {
        setShowIdentity(true);
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== failed.id));
      handleSend(failed.content, identity);
    },
    [handleSend, identity],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b border-gray-100 px-5 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
        <p className="text-xs text-gray-500">
          Text us anything about your trip. A real person replies.
        </p>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const status = getStatus(m);
              const isUser = m.sender === "user";
              return (
                <li
                  key={m.id}
                  className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {isUser && status === "sending" && (
                    <Loader2 className="mb-1 h-3.5 w-3.5 animate-spin text-gray-400" />
                  )}
                  {isUser && status === "failed" && (
                    <button
                      type="button"
                      onClick={() => handleRetry(m)}
                      title="Tap to retry"
                      aria-label="Retry sending this message"
                      className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div
                    className={
                      isUser
                        ? `max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#D0021B] px-4 py-2.5 text-[15px] text-white ${status === "failed" ? "opacity-60" : ""}`
                        : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5 text-[15px] text-gray-900"
                    }
                  >
                    {m.content}
                    <div
                      className={`mt-1 text-[10px] ${isUser ? "text-red-100/80" : "text-gray-400"}`}
                    >
                      {formatTime(m.created_at)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-gray-100 bg-white px-3 py-3"
        style={{
          paddingBottom:
            "calc(var(--v2-bottom-nav-total-height, env(safe-area-inset-bottom, 0px)) + 12px)",
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask anything…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] text-gray-900 focus:border-[#D0021B] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="rounded-full bg-[#D0021B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A30015] disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>

      {showIdentity && (
        <IdentityPrompt
          onSubmit={onIdentitySubmit}
          onCancel={() => setShowIdentity(false)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-gray-50 p-5 text-center">
      <div className="text-2xl">👋</div>
      <p className="mt-2 text-sm font-medium text-gray-900">
        Hi! Ask us anything about your China trip.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Restaurant recs, metro routes, translations, last-minute help — a real person replies.
      </p>
    </div>
  );
}
