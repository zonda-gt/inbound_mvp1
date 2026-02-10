import { NextRequest } from "next/server";
import { streamChatResponse } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let requestBody: any;

  try {
    requestBody = await request.json();

    const { messages, origin, navContext, image }: {
      messages: Array<{ role: string; content: string }>;
      origin?: string;
      navContext?: any;
      image?: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" };
    } = requestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("Chat API validation error: Invalid messages array", {
        messagesType: typeof messages,
        messagesLength: Array.isArray(messages) ? messages.length : 'not-array',
        requestBody: JSON.stringify(requestBody).slice(0, 200), // Log first 200 chars
      });
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = streamChatResponse(messages, origin, navContext, image);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Log full error details
    console.error("═══ Chat API Error ═══");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Request details:", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: requestBody ? {
        messageCount: requestBody.messages?.length,
        hasOrigin: !!requestBody.origin,
        hasNavContext: !!requestBody.navContext,
        hasImage: !!requestBody.image,
        // Don't log full image data (too large), just metadata
        imageType: requestBody.image?.mediaType,
      } : "Failed to parse body",
    });
    console.error("═══════════════════════");

    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
