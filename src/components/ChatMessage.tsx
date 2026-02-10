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
        <div
          className={`whitespace-pre-wrap px-4 py-2.5 text-[15px] leading-relaxed ${
            isUser
              ? "rounded-2xl rounded-br-md bg-[#2563EB] text-white"
              : "rounded-2xl rounded-bl-md bg-[#F3F4F6] text-gray-900"
          }`}
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
        {message.navigationData && (
          <NavigationCard data={message.navigationData} />
        )}
        {message.placesData && message.placesData.length > 0 && (
          <RestaurantList
            places={message.placesData}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  );
}
