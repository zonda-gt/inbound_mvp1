import { NextRequest } from "next/server";
import { streamAskResponse } from "@/lib/ai-ask";

export async function POST(request: NextRequest) {
  let requestBody: any;

  try {
    requestBody = await request.json();

    const {
      messages,
      entityType,
      entitySlug,
      sessionId,
      anonymousUserId,
      referralSource,
      deviceType,
      entryPage,
      gpsPermissionStatus,
      userLat,
      userLng,
      isDemoMode,
    }: {
      messages: Array<{ role: string; content: string }>;
      entityType: "restaurant" | "attraction";
      entitySlug: string;
      sessionId?: string;
      anonymousUserId?: string;
      referralSource?: string;
      deviceType?: "mobile" | "desktop";
      entryPage?: string;
      gpsPermissionStatus?: "granted" | "denied" | "dismissed";
      userLat?: number;
      userLng?: number;
      isDemoMode?: boolean;
    } = requestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!entityType || !entitySlug) {
      return new Response(JSON.stringify({ error: "entityType and entitySlug are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = streamAskResponse(
      messages,
      entityType,
      entitySlug,
      sessionId,
      anonymousUserId,
      referralSource,
      deviceType,
      entryPage,
      gpsPermissionStatus,
      userLat,
      userLng,
      isDemoMode,
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[ask API] Error:", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
