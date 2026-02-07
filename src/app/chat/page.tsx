"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ChatMessage, { Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import PreviewBanner from "@/components/PreviewBanner";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hi! I'm your China travel assistant. I can help you navigate cities, find restaurants, translate Chinese, and set up apps like Alipay and WeChat. What do you need help with?",
};

let nextId = 1;
function makeId() {
  return String(nextId++);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
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
        // Amap uses "lng,lat" format
        const coords = `${position.coords.longitude},${position.coords.latitude}`;
        setUserLocation(coords);
        setLocationRequested(true);
      },
      () => {
        // Permission denied or error — fall back to Shanghai default
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
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: makeId(), role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsTyping(true);

      try {
        // Send only user/assistant messages (exclude welcome message metadata)
        const apiMessages = updatedMessages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            origin: userLocation || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Request failed");
        }

        const aiMsg: Message = {
          id: makeId(),
          role: "assistant",
          content: data.response,
          navigationData: data.navigationData || undefined,
          placesData: data.placesData || undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errorMsg: Message = {
          id: makeId(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
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

          {isTyping && <TypingIndicator />}

          {!hasUserMessages && !isTyping && (
            <div className="mt-2">
              <SuggestedPrompts onSelect={handleSend} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
