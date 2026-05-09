"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ConciergeThread } from "@/lib/concierge-server";

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConciergeInbox() {
  const [threads, setThreads] = useState<ConciergeThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/admin/concierge/threads")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: { threads: ConciergeThread[] }) => {
          if (cancelled) return;
          setThreads(data.threads ?? []);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(String(err));
          setLoading(false);
        });
    };
    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (loading) {
    return <div className="px-6 py-10 text-sm text-gray-500">Loading…</div>;
  }
  if (error) {
    return <div className="px-6 py-10 text-sm text-red-600">Error: {error}</div>;
  }
  if (threads.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-sm text-gray-500">
        No conversations yet. They&apos;ll show up here as users start texting.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 bg-white">
      {threads.map((t) => {
        const unread = t.admin_unread_count > 0;
        return (
          <li key={t.id}>
            <Link
              href={`/admin/chat/${t.id}`}
              className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-gray-50"
            >
              <div
                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${unread ? "bg-[#D0021B]" : "bg-transparent"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`truncate ${unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {t.display_name ?? "Anonymous"}
                  </span>
                  {t.city && <span className="text-xs text-gray-400">· {t.city}</span>}
                  {t.email && <span className="text-xs text-gray-400">· {t.email}</span>}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  Last message {formatRelative(t.last_user_message_at ?? t.last_admin_message_at)}
                </div>
              </div>
              {unread && (
                <div className="rounded-full bg-[#D0021B] px-2 py-0.5 text-xs font-semibold text-white">
                  {t.admin_unread_count}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
