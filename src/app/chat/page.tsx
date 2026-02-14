"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ChatMessage, { Message, NavContext } from "@/components/ChatMessage";
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
    icon: "📷",
    action: "camera", // Special action to trigger camera
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
  const [userCity, setUserCity] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationRequested(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = `${position.coords.longitude},${position.coords.latitude}`;
        setUserLocation(coords);

        // Reverse geocode to get city name
        try {
          const response = await fetch('/api/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: coords }),
          });
          if (response.ok) {
            const data = await response.json();
            setUserCity(data.city);
          }
        } catch (error) {
          console.error('Failed to get city from coordinates:', error);
        }

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
    async (text: string, navContext?: NavContext, imageData?: { base64: string; mediaType: string; previewUrl: string }) => {
      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: text,
        imageUrl: imageData?.previewUrl,
      };
      const aiMsgId = makeId();
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      // Set appropriate loading state
      if (imageData) {
        setIsReadingPhoto(true);
        setIsTyping(false);
      } else {
        setIsTyping(true);
        setIsReadingPhoto(false);
      }
      setToolStatus(null);

      try {
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const requestPayload = {
          messages: apiMessages,
          origin: userLocation || undefined,
          city: userCity || undefined,
          navContext: navContext || undefined,
          image: imageData ? { base64: imageData.base64, mediaType: imageData.mediaType } : undefined,
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("═══ Chat API Request Failed ═══");
          console.error("Status:", res.status, res.statusText);
          console.error("Response:", errorText);
          console.error("Request payload:", {
            messageCount: apiMessages.length,
            hasOrigin: !!userLocation,
            hasNavContext: !!navContext,
            hasImage: !!imageData,
          });
          console.error("═══════════════════════════════════");
          throw new Error(`Request failed: ${res.status} ${res.statusText}`);
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
                  setIsReadingPhoto(false);
                  setToolStatus(null);
                  streamedText = ev.data;
                  setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, role: "assistant", content: streamedText, userLocation: userLocation || undefined },
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
                        ? { ...m, content: "", userLocation: userLocation || undefined, navigationData: navData, placesData: placesResult }
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
                setIsReadingPhoto(false);
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
                      userLocation: userLocation || undefined,
                      navigationData: navData,
                      placesData: placesResult,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, userLocation: userLocation || undefined, navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }
                break;
              }

              case "places_update": {
                try {
                  const enrichment = JSON.parse(ev.data) as Array<{
                    name: string;
                    englishName: string;
                    description: string;
                  }>;
                  if (placesResult) {
                    placesResult = placesResult.map((p, idx) => {
                      // Try exact name match, then partial match, then index fallback
                      const match =
                        enrichment.find((r) => r.name === p.name) ||
                        enrichment.find(
                          (r) =>
                            p.name.includes(r.name) ||
                            r.name.includes(p.name),
                        ) ||
                        (idx < enrichment.length ? enrichment[idx] : null);
                      return match
                        ? {
                            ...p,
                            englishName: match.englishName,
                            description: match.description,
                          }
                        : p;
                    });
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMsgId
                          ? { ...m, placesData: placesResult }
                          : m,
                      ),
                    );
                  }
                } catch {
                  // Enrichment failed — cards still work with Chinese names
                }
                break;
              }

              case "error": {
                const errData = JSON.parse(ev.data);
                setIsTyping(false);
                setIsReadingPhoto(false);
                setToolStatus(null);
                if (!aiMsgCreated) {
                  setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, role: "assistant", content: errData.message, userLocation: userLocation || undefined },
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
                setIsReadingPhoto(false);
                setToolStatus(null);
                if (aiMsgCreated) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, userLocation: userLocation || undefined, navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("═══ Chat Message Send Error ═══");
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
        console.error("Context:", {
          messageText: text.slice(0, 100), // First 100 chars
          hasNavContext: !!navContext,
          hasImageData: !!imageData,
          userLocation,
          messageCount: messages.length,
        });
        console.error("═══════════════════════════════════");

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
        setIsReadingPhoto(false);
        setToolStatus(null);
      }
    },
    [messages, userLocation, userCity],
  );

  const handleCameraCapture = useCallback(
    (image: { base64: string; mediaType: string; previewUrl: string }) => {
      handleSend("What does this say? Translate and help me understand it.", undefined, {
        base64: image.base64,
        mediaType: image.mediaType,
        previewUrl: image.previewUrl,
      });
    },
    [handleSend],
  );

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

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
      {locationRequested && <PreviewBanner hasLocation={!!userLocation} city={userCity} />}

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
                    onClick={() => {
                      if ((btn as any).action === "camera") {
                        handleCameraClick();
                      } else {
                        handleSend((btn as any).message!);
                      }
                    }}
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

              {isReadingPhoto && (
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none">🤖</span>
                  <div className="rounded-2xl rounded-bl-md bg-[#F3F4F6] px-4 py-2.5 text-[15px] leading-relaxed text-gray-500 italic">
                    📷 Reading your photo...
                  </div>
                </div>
              )}

              {isTyping && <TypingIndicator />}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isTyping || isReadingPhoto || !!toolStatus}
        onCameraClick={handleCameraClick}
      />

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            try {
              // Quick inline processing
              const reader = new FileReader();
              reader.onload = async () => {
                const img = new Image();
                img.onload = () => {
                  const maxSize = 1200;
                  let { width, height } = img;

                  if (width > maxSize || height > maxSize) {
                    if (width > height) {
                      height = (height * maxSize) / width;
                      width = maxSize;
                    } else {
                      width = (width * maxSize) / height;
                      height = maxSize;
                    }
                  }

                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);

                  canvas.toBlob((blob) => {
                    if (blob) {
                      const blobReader = new FileReader();
                      blobReader.onloadend = () => {
                        const base64 = (blobReader.result as string).split(',')[1];
                        const previewUrl = URL.createObjectURL(blob);
                        handleCameraCapture({
                          base64,
                          mediaType: 'image/jpeg',
                          previewUrl,
                        });
                      };
                      blobReader.readAsDataURL(blob);
                    }
                  }, 'image/jpeg', 0.8);
                };
                img.src = reader.result as string;
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error('Error processing image:', error);
            }
          }
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
