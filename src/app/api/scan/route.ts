import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CAMERA_SCAN_SYSTEM_PROMPT,
  buildDynamicContext,
} from "@/lib/prompts/cameraScan";

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
    }: {
      image: string; // base64 data (no prefix)
      message?: string;
      mode?: "TRANSLATE" | "IDENTIFY" | "MENU";
      city?: string;
      lat?: number;
      lng?: number;
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

    // TODO: Inject curated restaurant data here when user is at a known restaurant

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
              text: message || "What am I looking at?",
            },
          ],
        },
      ],
    });

    // SSE stream matching the existing chat pattern
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(
                encoder.encode(`data: ${data}\n\n`)
              );
            }
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
