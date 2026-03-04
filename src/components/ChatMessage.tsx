"use client";

import ReactMarkdown from "react-markdown";
import type { NavigationData } from "@/lib/ai";
import type { POIResult } from "@/lib/amap";
import type { CuratedRestaurant } from "@/lib/curated-restaurants";
import type { AttractionSummary } from "@/lib/attractions";
import NavigationCard from "./NavigationCard";
import RestaurantList from "./RestaurantList";
import CuratedRestaurantList from "./CuratedRestaurantList";
import AttractionCard from "./AttractionCard";
import MessageFeedback from "./MessageFeedback";

export type NavContext = {
  destinationLocation: string; // "lng,lat"
  destinationName: string;
  destinationAddress: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  userLocation?: string;
  navigationData?: NavigationData;
  placesData?: POIResult[];
  curatedRestaurantsData?: CuratedRestaurant[];
  attractionsData?: AttractionSummary[];
  dbMessageId?: string;
};

/* Branded AI avatar — red compass circle */
export function AiAvatar() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 13, flexShrink: 0,
      background: "#D0021B",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>
      </svg>
    </div>
  );
}

export default function ChatMessage({
  message,
  isFirstInGroup,
  onSend,
  isDemoMode,
  sessionId,
  previousUserMessage,
}: {
  message: Message;
  isFirstInGroup: boolean;
  onSend?: (text: string, navContext?: NavContext) => void;
  isDemoMode?: boolean;
  sessionId?: string | null;
  previousUserMessage?: string;
}) {
  const isUser = message.role === "user";

  const handleNavigate = (name: string, location: string, address: string) => {
    onSend?.(`How do I get to ${name}?`, {
      destinationLocation: location,
      destinationName: name,
      destinationAddress: address,
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {/* AI avatar — branded compass icon */}
      {!isUser && isFirstInGroup && (
        <div className="mr-2.5 mt-1 flex-shrink-0"><AiAvatar /></div>
      )}
      {!isUser && !isFirstInGroup && <span className="mr-2.5 w-[26px] flex-shrink-0" />}

      <div className={isUser ? "max-w-[80%]" : "max-w-[88%] min-w-0"}>
        {/* User messages — soft gray bubble */}
        {isUser && (
          <div style={{
            background: "#F3F4F6", color: "#1A1A1A",
            borderRadius: "20px 20px 6px 20px",
            padding: "10px 16px", fontSize: 15, lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}>
            {message.imageUrl && (
              <img src={message.imageUrl} alt="User uploaded"
                style={{ maxWidth: 240, borderRadius: 12, marginBottom: 8, display: "block" }} />
            )}
            {message.content}
          </div>
        )}

        {/* Assistant messages — no bubble, clean text on white */}
        {!isUser && (
          <>
            {message.navigationData && (
              <NavigationCard data={message.navigationData} isDemoMode={isDemoMode} />
            )}
            {message.placesData && message.placesData.length > 0 && (
              <RestaurantList
                places={message.placesData}
                onNavigate={handleNavigate}
                userLocation={
                  message.userLocation
                    ? message.userLocation.split(",").map(Number) as [number, number]
                    : undefined
                }
              />
            )}
            {message.curatedRestaurantsData && message.curatedRestaurantsData.length > 0 && (
              <CuratedRestaurantList
                restaurants={message.curatedRestaurantsData}
                onNavigate={handleNavigate}
                userLocation={
                  message.userLocation
                    ? message.userLocation.split(",").map(Number) as [number, number]
                    : undefined
                }
              />
            )}
            {message.attractionsData && message.attractionsData.length > 0 && (
              <div className="mb-2">
                {message.attractionsData.map((a) => (
                  <AttractionCard key={a.slug} attraction={a} />
                ))}
              </div>
            )}

            {/* AI text — no bubble */}
            {message.content && (
              <div style={{
                fontSize: 15, lineHeight: 1.65, color: "#1A1A1A",
                marginTop: (message.navigationData || message.placesData || message.curatedRestaurantsData) ? 10 : 0,
              }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ marginBottom: 10 }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ fontWeight: 600, color: "#0D0D0D" }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ margin: "6px 0 10px 20px", listStyleType: "disc" }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ margin: "6px 0 10px 20px", listStyleType: "decimal" }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.6 }}>{children}</li>,
                    h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 6px", color: "#0D0D0D" }}>{children}</h3>,
                    h4: ({ children }) => <h4 style={{ fontSize: 15, fontWeight: 600, margin: "12px 0 4px", color: "#0D0D0D" }}>{children}</h4>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#D0021B", textDecoration: "none" }}>{children}</a>
                    ),
                    code: ({ children }) => (
                      <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.875em" }}>{children}</code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {message.dbMessageId && sessionId && (
              <MessageFeedback
                dbMessageId={message.dbMessageId}
                sessionId={sessionId}
                userQuery={previousUserMessage || ""}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
