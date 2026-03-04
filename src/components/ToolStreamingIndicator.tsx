"use client";

import { AiAvatar } from "./ChatMessage";

function LoadingCard({ delayMs }: { delayMs: number }) {
  return (
    <div
      className="hc-loading-card rounded-2xl border border-gray-200/80 bg-white/90 p-3"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="hc-shimmer h-3 w-20 rounded-full" />
        <span className="hc-shimmer h-3 w-10 rounded-full" />
      </div>
      <div className="hc-shimmer h-4 w-4/5 rounded-md" />
      <div className="mt-2 flex gap-2">
        <span className="hc-shimmer h-3 w-1/3 rounded-full" />
        <span className="hc-shimmer h-3 w-1/4 rounded-full" />
      </div>
    </div>
  );
}

export default function ToolStreamingIndicator({
  label,
  tool,
}: {
  label: string;
  tool: string | null;
}) {
  const isFoodTool =
    tool === "search_curated_restaurants" || tool === "search_nearby_places";

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0"><AiAvatar /></div>
      <div className="max-w-[88%] min-w-0 py-1">
        <div className="flex items-center gap-2 text-sm" style={{ color: "#666" }}>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300" style={{ borderTopColor: "#D0021B" }} />
          <span className="font-medium">{label}</span>
        </div>

        {isFoodTool && (
          <div className="mt-3 space-y-2">
            <LoadingCard delayMs={0} />
            <LoadingCard delayMs={90} />
          </div>
        )}
      </div>
    </div>
  );
}
