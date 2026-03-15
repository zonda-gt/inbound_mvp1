"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChatMessage, { Message, NavContext } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import ToolStreamingIndicator from "@/components/ToolStreamingIndicator";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import PreviewBanner from "@/components/PreviewBanner";
import {
  getAnonymousUserId,
  captureReferralSource,
  getDeviceType,
  getEntryPage,
  clearCurrentSession,
  setCurrentSessionId,
  getCurrentLocation,
} from "@/lib/tracking";

let nextId = 1;
function makeId() {
  return String(nextId++);
}

const DEMO_ORIGIN = "121.4737,31.2304";
const DEMO_CITY = "\u4e0a\u6d77"; // 上海

function isInChina(lat: number, lng: number): boolean {
  return lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135;
}

const ACTION_BUTTONS = [
  {
    label: "Navigate",
    icon: "🧭",
    message: "🧭 How do I get to The Bund?",
    bg: "#FFF5F5",
    border: "#FECACA",
    text: "#B91C1C",
  },
  {
    label: "Find Food",
    icon: "🍴",
    message: "🍜 Find food near me",
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#92400E",
  },
  {
    label: "Translate",
    icon: "📷",
    action: "camera", // Special action to trigger camera
    bg: "#F0FDF4",
    border: "#BBF7D0",
    text: "#166534",
  },
  {
    label: "Setup Guide",
    icon: "📱",
    href: "/guides",
    bg: "#FFF7ED",
    border: "#FED7AA",
    text: "#9A3412",
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
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attractionSlug = searchParams.get("attraction");
  const restaurantSlug = searchParams.get("restaurant");
  const attractionHandledRef = useRef(false);
  const restaurantHandledRef = useRef(false);

  // Image + mode carried from the Lens screen — used to route to /api/lens-chat instead of /api/chat
  const [lensImage, setLensImage] = useState<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" } | null>(null);
  const [lensMode, setLensMode] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReason, setDemoReason] = useState<"outside_china" | "no_permission" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabledRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const locationResolvedRef = useRef(false);
  const realCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Session tracking state
  const [anonymousUserId, setAnonymousUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<
    "granted" | "denied" | "dismissed" | null
  >(null);

  // Read Lens photo context from sessionStorage on mount (must be useEffect — SSR can't access sessionStorage)
  useEffect(() => {
    const stored = sessionStorage.getItem('photo-chat-context');
    if (!stored) return;
    sessionStorage.removeItem('photo-chat-context');
    try {
      const { imageUrl, aiResponse, mode } = JSON.parse(stored);
      setMessages([
        { id: '1', role: 'user', content: '', imageUrl },
        { id: '2', role: 'assistant', content: aiResponse },
      ]);
      if (imageUrl?.startsWith('data:')) {
        const [header, base64] = imageUrl.split(',');
        const mediaType = (header.match(/data:(image\/\w+);/) || [])[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp" || 'image/jpeg';
        setLensImage({ base64, mediaType });
        setLensMode(mode);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // Initialize tracking on mount
  useEffect(() => {
    const userId = getAnonymousUserId();
    setAnonymousUserId(userId);
    captureReferralSource();
    // Clear any stale session from previous page visit — force new session per visit
    clearCurrentSession();
  }, []);

  // Request geolocation on mount with demo mode fallback
  useEffect(() => {
    const activateDemoMode = (reason: "outside_china" | "no_permission") => {
      setIsDemoMode(true);
      setDemoReason(reason);
      setUserLocation(DEMO_ORIGIN);
      setUserCity(DEMO_CITY);
      setLocationRequested(true);
    };

    if (!navigator.geolocation) {
      setGpsPermissionStatus("denied");
      activateDemoMode("no_permission");
      return;
    }

    // Hard 5-second timeout: if geolocation hasn't resolved, activate demo mode
    const hardTimeout = setTimeout(() => {
      if (!locationResolvedRef.current) {
        locationResolvedRef.current = true;
        setGpsPermissionStatus("dismissed");
        activateDemoMode("no_permission");
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (locationResolvedRef.current) return;
        locationResolvedRef.current = true;
        clearTimeout(hardTimeout);

        const { latitude, longitude } = position.coords;
        setGpsPermissionStatus("granted");
        realCoordsRef.current = { lat: latitude, lng: longitude };

        if (isInChina(latitude, longitude)) {
          // Path A: GPS granted + in China → real location
          const coords = `${longitude},${latitude}`;
          setUserLocation(coords);
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
        } else {
          // Path B: GPS granted + NOT in China → demo mode
          activateDemoMode("outside_china");
        }
      },
      (error) => {
        if (locationResolvedRef.current) return;
        locationResolvedRef.current = true;
        clearTimeout(hardTimeout);

        // Path C: GPS denied/dismissed → demo mode
        setGpsPermissionStatus(error.code === 1 ? "denied" : "dismissed");
        activateDemoMode("no_permission");
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );

    return () => clearTimeout(hardTimeout);
  }, []);

  // Called when user taps "Enable Location" in the banner after initially denying
  const handleLocationGranted = async (lat: number, lng: number) => {
    setGpsPermissionStatus("granted");
    realCoordsRef.current = { lat, lng };
    if (isInChina(lat, lng)) {
      const coords = `${lng},${lat}`;
      setUserLocation(coords);
      setIsDemoMode(false);
      setDemoReason(null);
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
    } else {
      setIsDemoMode(true);
      setDemoReason("outside_china");
    }
  };

  // Context entity for pre-loaded cards from restaurant/attraction detail pages
  const [contextEntity, setContextEntity] = useState<{ type: "restaurant" | "attraction"; name: string } | null>(null);

  // Pre-load restaurant card when arriving from restaurant detail (?restaurant=slug)
  useEffect(() => {
    if (!restaurantSlug || restaurantHandledRef.current) return;
    restaurantHandledRef.current = true;

    fetch(`/api/curated-restaurants?slugs=${encodeURIComponent(restaurantSlug)}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.restaurants?.length > 0) {
          const rest = body.restaurants[0];
          const name = rest.name_en || restaurantSlug;
          // Strip hook — user already saw it on the detail page
          const stripped = body.restaurants.map((r: any) => ({
            ...r,
            foreigner_hook: undefined,
            profile: r.profile ? {
              ...r.profile,
              layer1_card: r.profile.layer1_card ? { ...r.profile.layer1_card, hook: undefined, verdict: undefined } : r.profile.layer1_card,
            } : r.profile,
          }));
          setContextEntity({ type: "restaurant", name });
          setMessages([{
            id: makeId(),
            role: "assistant",
            content: `Here's **${name}**. What would you like to know?`,
            curatedRestaurantsData: stripped,
            hideMap: true,
          }]);
        }
      })
      .catch(() => {});
  }, [restaurantSlug]);

  // Pre-load attraction card when arriving from attraction detail (?attraction=slug)
  useEffect(() => {
    if (!attractionSlug || attractionHandledRef.current) return;
    attractionHandledRef.current = true;

    fetch(`/api/attractions?slug=${encodeURIComponent(attractionSlug)}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.attraction) {
          const a = body.attraction;
          const name = a.attraction_name_en || attractionSlug;
          setContextEntity({ type: "attraction", name });
          setMessages([{
            id: makeId(),
            role: "assistant",
            content: `Here's **${name}**. What would you like to know?`,
            attractionsData: [{
              slug: a.slug,
              name_en: a.attraction_name_en,
              name_cn: a.attraction_name_cn,
              hook: "",
              experience_type: a.experience_type || "",
              image: a.images?.[0] || null,
            }],
          }]);
        }
      })
      .catch(() => {});
  }, [attractionSlug]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoScrollEnabledRef.current = distanceFromBottom <= 120;
  }, []);

  useEffect(() => {
    const shouldAutoScroll = autoScrollEnabledRef.current || forceScrollToBottomRef.current;
    if (!shouldAutoScroll) return;
    const behavior: ScrollBehavior = forceScrollToBottomRef.current ? "smooth" : "auto";
    scrollToBottom(behavior);
    forceScrollToBottomRef.current = false;
  }, [messages, isTyping, toolStatus, isReadingPhoto, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string, navContext?: NavContext, imageData?: { base64: string; mediaType: string; previewUrl: string }) => {
      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: text,
        imageUrl: imageData?.previewUrl,
      };
      forceScrollToBottomRef.current = true;
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

        // Get fresh GPS location for this message (skip in demo mode)
        let freshOrigin: string | undefined;
        let freshLat: number | undefined;
        let freshLng: number | undefined;

        if (isDemoMode) {
          freshOrigin = DEMO_ORIGIN;
          // For tracking: use real GPS coords if available (outside China users)
          // For denied/dismissed: leave undefined (stored as null in DB)
          if (realCoordsRef.current) {
            freshLat = realCoordsRef.current.lat;
            freshLng = realCoordsRef.current.lng;
          }
        } else {
          const currentLocation = await getCurrentLocation(3000);
          if (currentLocation) {
            freshOrigin = `${currentLocation.lng},${currentLocation.lat}`;
            freshLat = currentLocation.lat;
            freshLng = currentLocation.lng;
          } else if (userLocation) {
            // Fresh GPS failed but we have stored coordinates — parse and use them
            freshOrigin = userLocation;
            const [lng, lat] = userLocation.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              freshLat = lat;
              freshLng = lng;
            }
          }
        }

        // Route to appropriate API endpoint
        const isEntityAsk = !!(restaurantSlug || attractionSlug);
        const isLensChat = !!lensImage;
        const apiUrl = isEntityAsk ? "/api/ask" : isLensChat ? "/api/lens-chat" : "/api/chat";

        const requestPayload = isEntityAsk
          ? {
              messages: apiMessages,
              entityType: restaurantSlug ? "restaurant" : "attraction",
              entitySlug: restaurantSlug || attractionSlug,
              sessionId: sessionId || undefined,
              anonymousUserId: anonymousUserId || undefined,
              referralSource: captureReferralSource() || undefined,
              deviceType: getDeviceType(),
              entryPage: getEntryPage(),
              gpsPermissionStatus: gpsPermissionStatus || undefined,
              userLat: freshLat,
              userLng: freshLng,
              isDemoMode,
            }
          : isLensChat
          ? {
              messages: apiMessages,
              image: lensImage,
              mode: lensMode,
              sessionId: sessionId || undefined,
              anonymousUserId: anonymousUserId || undefined,
              deviceType: getDeviceType(),
            }
          : {
              messages: apiMessages,
              origin: freshOrigin,
              city: userCity || undefined,
              navContext: navContext || undefined,
              image: imageData ? { base64: imageData.base64, mediaType: imageData.mediaType } : undefined,
              sessionId: sessionId || undefined,
              anonymousUserId: anonymousUserId || undefined,
              referralSource: captureReferralSource() || undefined,
              deviceType: getDeviceType(),
              entryPage: getEntryPage(),
              gpsPermissionStatus: gpsPermissionStatus || undefined,
              userLat: freshLat,
              userLng: freshLng,
              isDemoMode,
            };

        const res = await fetch(apiUrl, {
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

        const emptyResponseFallback =
          /how do i get|how to get|directions|navigate|route|metro|subway|go to|take me to/i.test(
            text.toLowerCase(),
          )
            ? "I couldn't find directions to that location. Could you share the Chinese name or address? You can also try typing it in Chinese characters."
            : "I couldn't generate a response just now. Please try rephrasing your question.";

        const decoder = new TextDecoder();
        let buffer = "";
        let streamedText = "";
        let aiMsgCreated = false;
        let aiMsgHasVisibleOutput = false;
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
                // Text chunks are JSON-encoded to preserve whitespace
                let chunk: string;
                try {
                  chunk = JSON.parse(ev.data);
                } catch {
                  chunk = ev.data;
                }
                if (!aiMsgCreated) {
                  aiMsgCreated = true;
                  setIsTyping(false);
                  setIsReadingPhoto(false);
                  setToolStatus(null);
                  setActiveTool(null);
                  streamedText = chunk;
                  setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, role: "assistant", content: streamedText, userLocation: userLocation || undefined },
                  ]);
                } else {
                  streamedText += chunk;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId ? { ...m, content: streamedText } : m,
                    ),
                  );
                }
                if (chunk.trim().length > 0) aiMsgHasVisibleOutput = true;
                break;
              }

              case "text_clear": {
                streamedText = "";
                aiMsgHasVisibleOutput = false;
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
                setActiveTool(info.tool || null);
                setIsTyping(false);
                setIsReadingPhoto(false);
                break;
              }

              case "tool_data": {
                const data = JSON.parse(ev.data);
                if (data.navigationData) navData = data.navigationData;
                if (data.placesData) placesResult = data.placesData;
                if (
                  data.navigationData ||
                  (Array.isArray(data.placesData) && data.placesData.length > 0) ||
                  (Array.isArray(data.curatedRestaurantSlugs) && data.curatedRestaurantSlugs.length > 0) ||
                  (Array.isArray(data.attractionSlugs) && data.attractionSlugs.length > 0)
                ) {
                  aiMsgHasVisibleOutput = true;
                }

                // Curated restaurants: receive slugs, fetch full profiles asynchronously
                if (data.curatedRestaurantSlugs) {
                  setToolStatus("Building curated cards...");
                  fetch(`/api/curated-restaurants?slugs=${(data.curatedRestaurantSlugs as string[]).join(",")}`)
                    .then((r) => r.json())
                    .then((body) => {
                      if (body.restaurants?.length > 0) {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === aiMsgId
                              ? { ...m, curatedRestaurantsData: body.restaurants }
                              : m,
                          ),
                        );
                      }
                    })
                    .finally(() => {
                      setToolStatus(null);
                      setActiveTool(null);
                    })
                    .catch((err) => console.error("Failed to fetch curated restaurant profiles:", err));
                } else if (data.attractionSlugs) {
                  // Curated attractions: fetch summaries and render cards
                  setToolStatus("Loading attractions...");
                  Promise.all(
                    (data.attractionSlugs as string[]).map((slug: string) =>
                      fetch(`/api/attractions?slug=${slug}`)
                        .then((r) => r.json())
                        .then((body) => body.attraction ? {
                          slug,
                          name_en: body.attraction.attraction_name_en,
                          name_cn: body.attraction.attraction_name_cn,
                          hook: body.attraction.hook || "",
                          experience_type: body.attraction.experience_type || "",
                          image: body.attraction.images?.[0] || null,
                        } : null)
                        .catch(() => null),
                    ),
                  )
                    .then((results) => {
                      const attractions = results.filter((a): a is NonNullable<typeof a> => a !== null);
                      if (attractions.length > 0) {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === aiMsgId
                              ? { ...m, attractionsData: attractions }
                              : m,
                          ),
                        );
                      }
                    })
                    .finally(() => {
                      setToolStatus(null);
                      setActiveTool(null);
                    });
                } else {
                  setToolStatus(null);
                  setActiveTool(null);
                }

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

              case "message_id": {
                // Backend sent the DB message ID for the assistant message
                const msgIdData = JSON.parse(ev.data);
                if (msgIdData.messageId) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId ? { ...m, dbMessageId: msgIdData.messageId } : m,
                    ),
                  );
                }
                break;
              }

              case "session_created": {
                // Backend created a new session, store the ID
                const sessionData = JSON.parse(ev.data);
                if (sessionData.sessionId && !sessionId) {
                  console.log('✅ Session created:', sessionData.sessionId);
                  setSessionId(sessionData.sessionId);
                  setCurrentSessionId(sessionData.sessionId);
                }
                break;
              }

              case "error": {
                const errData = JSON.parse(ev.data);
                setIsTyping(false);
                setIsReadingPhoto(false);
                setToolStatus(null);
                setActiveTool(null);
                aiMsgHasVisibleOutput = true;
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
                setActiveTool(null);
                if (aiMsgCreated) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, userLocation: userLocation || undefined, navigationData: navData, placesData: placesResult }
                        : m,
                    ),
                  );
                }

                if (!aiMsgHasVisibleOutput) {
                  if (!aiMsgCreated) {
                    aiMsgCreated = true;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: aiMsgId,
                        role: "assistant",
                        content: emptyResponseFallback,
                        userLocation: userLocation || undefined,
                      },
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMsgId
                          ? {
                              ...m,
                              content: emptyResponseFallback,
                              userLocation: userLocation || undefined,
                              navigationData: navData,
                              placesData: placesResult,
                            }
                          : m,
                      ),
                    );
                  }
                  aiMsgHasVisibleOutput = true;
                }
                break;
              }
            }
          }
        }

        // Safety net: if stream ended unexpectedly without any visible assistant output.
        if (!aiMsgHasVisibleOutput) {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              role: "assistant",
              content: emptyResponseFallback,
              userLocation: userLocation || undefined,
            },
          ]);
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
        setActiveTool(null);
      }
    },
    [messages, userLocation, userCity, sessionId, anonymousUserId, gpsPermissionStatus, isDemoMode],
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
  const hasContextIntent = !!(restaurantSlug || attractionSlug);
  const showWelcome = !hasUserMessages && !hasContextIntent && !isTyping;

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Top bar — frosted glass */}
      <header style={{
        display: "flex", alignItems: "center", padding: "12px 16px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        position: "relative", zIndex: 10,
      }}>
        <button
          onClick={() => {
            if (restaurantSlug || attractionSlug || lensImage) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          style={{ marginRight: 12, fontSize: 18, color: "#999", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em" }}>
          Hello<span style={{ color: "#D0021B" }}>China</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: "#999", marginLeft: 6 }}>AI</span>
        </h1>
      </header>

      {/* Preview banner */}
      {locationRequested && <PreviewBanner hasLocation={!!userLocation} city={userCity} isDemoMode={isDemoMode} demoReason={demoReason} onLocationGranted={handleLocationGranted} />}

      {/* Location prompt (shown briefly while waiting) */}
      {!locationRequested && (
        <div className="flex items-center justify-center bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Enable location to get navigation and restaurant recommendations near you.
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {showWelcome ? (
          /* Welcome state */
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to HelloChina
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Your AI guide to navigating China
              </p>
            </div>

            <div className="mb-8 w-full max-w-sm">
              <SuggestedPrompts onSelect={handleSend} />
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              {ACTION_BUTTONS.map((btn) => {
                const cardStyle = {
                  display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
                  borderRadius: 16, border: `1px solid ${btn.border}`, background: btn.bg,
                  padding: "28px 12px", transition: "opacity 150ms ease",
                  textDecoration: "none",
                };
                return btn.href ? (
                  <Link key={btn.label} href={btn.href} style={cardStyle}>
                    <span style={{ fontSize: 28 }}>{btn.icon}</span>
                    <span style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: btn.text }}>{btn.label}</span>
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
                    style={cardStyle}
                  >
                    <span style={{ fontSize: 28 }}>{btn.icon}</span>
                    <span style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: btn.text }}>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="px-4 py-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((msg, i) => {
                const prevRole = i > 0 ? messages[i - 1].role : null;
                const isFirstInGroup = msg.role !== prevRole;
                const previousUserMessage =
                  msg.role === "assistant" && i > 0 && messages[i - 1].role === "user"
                    ? messages[i - 1].content
                    : undefined;
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isFirstInGroup={isFirstInGroup}
                    onSend={handleSend}
                    isDemoMode={isDemoMode}
                    sessionId={sessionId}
                    previousUserMessage={previousUserMessage}
                  />
                );
              })}

              {/* Contextual prompts for pre-loaded restaurant/attraction cards */}
              {hasContextIntent && !hasUserMessages && contextEntity && (
                <div className="flex flex-wrap justify-center gap-2 py-3">
                  {(contextEntity.type === "restaurant"
                    ? [
                        "What should I order?",
                        "How do I get there?",
                        "Is it good for groups?",
                        "Any tips for first-timers?",
                      ]
                    : [
                        "How do I get there?",
                        "What should I know before visiting?",
                        "How long should I spend?",
                        "What's nearby?",
                      ]
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#D0021B] hover:text-[#D0021B] active:bg-red-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {toolStatus && <ToolStreamingIndicator label={toolStatus} tool={activeTool} />}

              {isReadingPhoto && (
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    <div style={{ width: 26, height: 26, borderRadius: 13, background: "#D0021B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="max-w-[88%] min-w-0 py-1">
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#666" }}>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300" style={{ borderTopColor: "#D0021B" }} />
                      <span className="font-medium">Reading your photo...</span>
                    </div>
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
