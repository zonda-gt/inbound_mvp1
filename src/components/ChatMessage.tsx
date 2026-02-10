"use client";

import type { NavigationData } from "@/lib/ai";
import type { POIResult } from "@/lib/amap";
import NavigationCard from "./NavigationCard";
import RestaurantList from "./RestaurantList";

export type NavContext = {
  destinationLocation: string; // "lng,lat"
  destinationName: string;
  destinationAddress: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string; // preview URL for displaying the image
  userLocation?: string; // "lng,lat" format
  navigationData?: NavigationData;
  placesData?: POIResult[];
};

export default function ChatMessage({
  message,
  isFirstInGroup,
  onSend,
}: {
  message: Message;
  isFirstInGroup: boolean;
  onSend?: (text: string, navContext?: NavContext) => void;
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
      {!isUser && isFirstInGroup && (
        <span className="mr-2 mt-auto text-lg leading-none">🤖</span>
      )}
      {!isUser && !isFirstInGroup && <span className="mr-2 w-[1.125rem]" />}
      <div className="max-w-[80%]">
        {/* For user messages: show image + text together */}
        {isUser && (
          <div
            className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-2.5 text-[15px] leading-relaxed text-white"
          >
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="User uploaded"
                className="mb-2 max-w-[240px] rounded-xl shadow-sm"
              />
            )}
            {message.content}
          </div>
        )}

        {/* For assistant messages: show tool results first, then text */}
        {!isUser && (
          <>
            {/* Tool results appear first - instant structured data */}
            {message.navigationData && (
              <NavigationCard data={message.navigationData} />
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

            {/* AI text appears last - streams in below structured data */}
            {message.content && (
              <div
                className={`whitespace-pre-wrap rounded-2xl rounded-bl-md bg-[#F3F4F6] px-4 py-2.5 text-[15px] leading-relaxed text-gray-900 ${
                  message.navigationData || message.placesData ? "mt-2" : ""
                }`}
              >
                {message.content}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
