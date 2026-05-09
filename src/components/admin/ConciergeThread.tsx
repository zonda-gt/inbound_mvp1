"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ConciergeMessage, ConciergeThread } from "@/lib/concierge-server";

interface Props {
  threadId: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type MessageStatus = "sending" | "failed" | "sent";

function getStatus(m: ConciergeMessage): MessageStatus {
  if (m.id.startsWith("failed-")) return "failed";
  if (m.id.startsWith("optimistic-")) return "sending";
  return "sent";
}

export default function ConciergeThreadView({ threadId }: Props) {
  const [thread, setThread] = useState<ConciergeThread | null>(null);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Initial load + safety-net polling + visibility-change refetch.
  // Realtime is the primary delivery; this catches anything dropped by
  // background-tab WebSocket throttling or reconnects.
  useEffect(() => {
    let cancelled = false;
    let firstLoad = true;

    const refetch = () => {
      fetch(`/api/admin/concierge/threads/${threadId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: { thread: ConciergeThread; messages: ConciergeMessage[] }) => {
          if (cancelled) return;
          setThread(data.thread);
          setMessages((prev) => {
            // Preserve local-only messages (still sending or failed) across refetches.
            const localOnly = prev.filter(
              (m) => m.id.startsWith("optimistic-") || m.id.startsWith("failed-"),
            );
            const serverIds = new Set(data.messages.map((m) => m.id));
            const surviving = localOnly.filter((m) => !serverIds.has(m.id));
            return [...data.messages, ...surviving];
          });
          if (firstLoad) {
            setLoading(false);
            firstLoad = false;
          }
        })
        .catch((err) => {
          if (cancelled) return;
          if (firstLoad) {
            setError(String(err));
            setLoading(false);
            firstLoad = false;
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
  }, [threadId]);

  // Realtime subscription for new user messages while this thread is open.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`admin_concierge_${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "concierge_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const msg = payload.new as ConciergeMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const optimistic: ConciergeMessage = {
      id: `optimistic-${Date.now()}`,
      thread_id: threadId,
      sender: "admin",
      content: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    const res = await fetch("/api/admin/concierge/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, content: trimmed }),
    });
    setSending(false);
    if (!res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...m, id: `failed-${optimistic.id}` } : m,
        ),
      );
      return;
    }
    const data: { message: ConciergeMessage } = await res.json();
    setMessages((prev) => {
      const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
      if (withoutOptimistic.some((m) => m.id === data.message.id)) {
        return withoutOptimistic;
      }
      return [...withoutOptimistic, data.message];
    });
  }, [draft, sending, threadId]);

  const handleRetry = useCallback(
    async (failed: ConciergeMessage) => {
      // Remove the failed marker and re-send the same content.
      setMessages((prev) => prev.filter((m) => m.id !== failed.id));
      const optimistic: ConciergeMessage = {
        id: `optimistic-${Date.now()}`,
        thread_id: threadId,
        sender: "admin",
        content: failed.content,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await fetch("/api/admin/concierge/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, content: failed.content }),
      });
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...m, id: `failed-${optimistic.id}` } : m,
          ),
        );
        return;
      }
      const data: { message: ConciergeMessage } = await res.json();
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
        if (withoutOptimistic.some((m) => m.id === data.message.id)) {
          return withoutOptimistic;
        }
        return [...withoutOptimistic, data.message];
      });
    },
    [threadId],
  );

  if (loading) return <div className="px-6 py-10 text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="px-6 py-10 text-sm text-red-600">Error: {error}</div>;
  if (!thread) return <div className="px-6 py-10 text-sm text-gray-500">Thread not found.</div>;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            {thread.display_name ?? "Anonymous"}
          </h2>
          {thread.city && <span className="text-xs text-gray-500">· {thread.city}</span>}
          {thread.email && <span className="text-xs text-gray-500">· {thread.email}</span>}
        </div>
        <div className="mt-0.5 text-[11px] text-gray-400">
          Anon ID: {thread.anonymous_user_id?.slice(0, 8) ?? "—"}
          {thread.user_id && <span> · Account: {thread.user_id.slice(0, 8)}</span>}
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <ul className="mx-auto max-w-2xl space-y-3">
          {messages.map((m) => {
            const status = getStatus(m);
            const isAdmin = m.sender === "admin";
            return (
              <li
                key={m.id}
                className={`flex items-end gap-1.5 ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                {isAdmin && status === "sending" && (
                  <Loader2 className="mb-1 h-3.5 w-3.5 animate-spin text-gray-400" />
                )}
                {isAdmin && status === "failed" && (
                  <button
                    type="button"
                    onClick={() => handleRetry(m)}
                    title="Tap to retry"
                    aria-label="Retry sending this reply"
                    className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                <div
                  className={
                    isAdmin
                      ? `max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#D0021B] px-4 py-2.5 text-[15px] text-white ${status === "failed" ? "opacity-60" : ""}`
                      : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] text-gray-900 shadow-sm"
                  }
                >
                  {m.content}
                  <div
                    className={`mt-1 text-[10px] ${isAdmin ? "text-red-100/80" : "text-gray-400"}`}
                  >
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t border-gray-100 bg-white px-4 py-3"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Reply to ${thread.display_name ?? "Anonymous"}…`}
            rows={2}
            className="max-h-48 flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-[15px] text-gray-900 focus:border-[#D0021B] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="rounded-full bg-[#D0021B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A30015] disabled:bg-gray-300"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mx-auto mt-1 max-w-2xl text-right text-[11px] text-gray-400">⌘+Enter to send</p>
      </form>
    </div>
  );
}
