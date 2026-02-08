"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ChatMessage, { Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import PreviewBanner from "@/components/PreviewBanner";

let nextId = 1;
function makeId() {
  return String(nextId++);
}

const ACTION_BUTTONS = [
  {
    label: "Navigate",
    icon: "🧭",
    message: "🧭 How do I get to The Bund?",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
  },
  {
    label: "Find Food",
    icon: "🍴",
    message: "🍜 Find food near me",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-amber-700",
  },
  {
    label: "Translate",
    icon: "🗣️",
    message: "🗣️ Translate something for me",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  {
    label: "Setup Guide",
    icon: "📱",
    href: "/guides",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
];

// Parse SSE events from a chunk of text.
// Returns parsed events and any leftover incomplete data.
function parseSSE(raw: string): { events: Array<{ event: string; data: string }>; leftover: string } {
  const events: Array<{ event: string; data: string }> = [];
  const parts = raw.split("\n\n");
  const leftover = parts.pop() || "";

  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) {
        event = line.slice(7);
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }
    if (event) {
      events.push({ event, data });
    }
  }

  return { events, leftover };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationRequested(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.longitude},${position.coords.latitude}`;
        setUserLocation(coords);
        setLocationRequested(true);
      },
      () => {
        setLocationRequested(true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, toolStatus, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: makeId(), role: "user", content: text };
      const aiMsgId = makeId();
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsTyping(true);
      setToolStatus(null);

      try {
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            origin: userLocation || undefined,
          }),
        });

        if (!res.ok) {
          throw new Error("Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let streamedText = "";
        let aiMsgCreated = false;
        let navData: Message["navigationData"] = undefined;
        let placesResult: Message["placesData"] = undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, leftover } = parseSSE(buffer);
          buffer = leftover;

          for (const ev of events) {
            switch (ev.event) {
              case "text": {
                if (!aiMsgCreated) {
                  aiMsgCreated = true;
                  setIsTyping(false);
                  setToolStatus(null);
                  streamedText = ev.data;
                  setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, role: "assistant", content: streamedText },
                  ]);
                } else {
                  streamedText += ev.data;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId ? { ...m, content: streamedText } : m,
                    ),
                  );
                }
                break;
              }

              case "text_clear": {
                streamedText = "";
                if (aiMsgCreated) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, content: "", navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }
                break;
              }

              case "tool_start": {
                const info = JSON.parse(ev.data);
                setToolStatus(info.label);
                setIsTyping(false);
                break;
              }

              case "tool_data": {
                const data = JSON.parse(ev.data);
                if (data.navigationData) navData = data.navigationData;
                if (data.placesData) placesResult = data.placesData;
                setToolStatus(null);
                if (!aiMsgCreated) {
                  aiMsgCreated = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: aiMsgId,
                      role: "assistant",
                      content: "",
                      navigationData: navData,
                      placesData: placesResult,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }
                break;
              }

              case "error": {
                const errData = JSON.parse(ev.data);
                setIsTyping(false);
                setToolStatus(null);
                if (!aiMsgCreated) {
                  setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, role: "assistant", content: errData.message },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId ? { ...m, content: errData.message } : m,
                    ),
                  );
                }
                break;
              }

              case "done": {
                setIsTyping(false);
                setToolStatus(null);
                if (aiMsgCreated) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }
                break;
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting. Please try again.",
          },
        ]);
      } finally {
        setIsTyping(false);
        setToolStatus(null);
      }
    },
    [messages, userLocation],
  );

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center border-b border-gray-100 px-4 py-3">
        <Link
          href="/"
          className="mr-3 text-lg text-gray-500 hover:text-gray-900"
          aria-label="Back to home"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold text-gray-900">
          ChinaTravel <span className="text-[#2563EB]">AI</span>
        </h1>
      </header>

      {/* Preview banner */}
      {locationRequested && <PreviewBanner hasLocation={!!userLocation} />}

      {/* Location prompt (shown briefly while waiting) */}
      {!locationRequested && (
        <div className="flex items-center justify-center bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Enable location to get navigation and restaurant recommendations near you.
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasUserMessages && !isTyping ? (
          /* Welcome state */
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to Inbound
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Your AI guide to navigating China
              </p>
            </div>

            <div className="mb-8 w-full max-w-sm">
              <SuggestedPrompts onSelect={handleSend} />
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              {ACTION_BUTTONS.map((btn) =>
                btn.href ? (
                  <Link
                    key={btn.label}
                    href={btn.href}
                    className={`flex flex-col items-center justify-center rounded-2xl border ${btn.border} ${btn.bg} px-3 py-8 transition-colors hover:opacity-80`}
                  >
                    <span className="text-3xl">{btn.icon}</span>
                    <span className={`mt-3 text-sm font-bold ${btn.text}`}>
                      {btn.label}
                    </span>
                  </Link>
                ) : (
                  <button
                    key={btn.label}
                    onClick={() => handleSend(btn.message!)}
                    className={`flex flex-col items-center justify-center rounded-2xl border ${btn.border} ${btn.bg} px-3 py-8 transition-colors hover:opacity-80`}
                  >
                    <span className="text-3xl">{btn.icon}</span>
                    <span className={`mt-3 text-sm font-bold ${btn.text}`}>
                      {btn.label}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="px-4 py-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              {messages.map((msg, i) => {
                const prevRole = i > 0 ? messages[i - 1].role : null;
                const isFirstInGroup = msg.role !== prevRole;
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isFirstInGroup={isFirstInGroup}
                    onSend={handleSend}
                  />
                );
              })}

              {toolStatus && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                  {toolStatus}
                </div>
              )}

              {isTyping && <TypingIndicator />}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping || !!toolStatus} />
    </div>
  );
}
