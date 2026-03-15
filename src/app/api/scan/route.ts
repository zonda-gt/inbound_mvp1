import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CAMERA_SCAN_SYSTEM_PROMPT,
  buildDynamicContext,
} from "@/lib/prompts/cameraScan";
import {
  createChatSession,
  logChatMessage,
  uploadLensPhoto,
} from "@/lib/logging";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      image,
      message,
      mode,
      city,
      lat,
      lng,
      anonymousUserId,
      deviceType,
    }: {
      image: string; // base64 data (no prefix)
      message?: string;
      mode?: "TRANSLATE" | "IDENTIFY" | "MENU";
      city?: string;
      lat?: number;
      lng?: number;
      anonymousUserId?: string;
      deviceType?: "mobile" | "desktop";
    } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      CAMERA_SCAN_SYSTEM_PROMPT +
      "\n\n" +
      buildDynamicContext({ city, lat, lng, mode });

    const userText = message || "What am I looking at?";
    const startTime = Date.now();

    // Create lens chat session + upload image (non-blocking)
    let sessionId: string | null = null;
    let imageUrl: string | null = null;

    if (anonymousUserId) {
      sessionId = await createChatSession({
        anonymous_user_id: anonymousUserId,
        device_type: deviceType || "mobile",
        entry_page: `/lens?mode=${mode || "IDENTIFY"}`,
        first_message: userText,
        message_count: 1,
        source: "lens",
      });

      if (sessionId) {
        // Upload image and log user message in parallel
        const [uploadResult] = await Promise.allSettled([
          uploadLensPhoto(image, sessionId),
        ]);

        imageUrl = uploadResult.status === "fulfilled" ? uploadResult.value : null;

        // Log the user message with image URL
        logChatMessage({
          session_id: sessionId,
          role: "user",
          content: `[${mode || "IDENTIFY"}] ${userText}`,
          user_lat: lat,
          user_lng: lng,
          source: "lens",
          image_url: imageUrl,
        });
      }
    }

    const client = getClient();

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ],
    });

    // SSE stream matching the existing chat pattern
    const encoder = new TextEncoder();
    let fullResponseText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send session ID to client so follow-up messages can reference it
          if (sessionId) {
            const sessionData = JSON.stringify({ sessionId });
            controller.enqueue(encoder.encode(`data: ${sessionData}\n\n`));
          }

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponseText += event.delta.text;
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(
                encoder.encode(`data: ${data}\n\n`)
              );
            }
          }

          // Log assistant response
          if (sessionId) {
            logChatMessage({
              session_id: sessionId,
              role: "assistant",
              content: fullResponseText,
              response_time_ms: Date.now() - startTime,
              source: "lens",
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Scan stream error:", err);
          const errMsg = JSON.stringify({
            error: "Something went wrong analyzing your photo. Please try again.",
          });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
