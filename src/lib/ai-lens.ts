/**
 * ai-lens.ts — Focused AI for Lens (photo scan) follow-up chat
 *
 * Used when a user taps "Continue in chat" after a photo scan.
 * Unlike the general chat (ai.ts), this file:
 *   - Has NO tools (no search, no navigation, no Amap)
 *   - Reattaches the original photo to the first user message so Claude keeps visual context
 *   - Uses the same camera scan system prompt — stays focused on photo Q&A
 *   - Is simple, fast, and bug-free
 */

import Anthropic from "@anthropic-ai/sdk";
import { CAMERA_SCAN_SYSTEM_PROMPT } from "@/lib/prompts/cameraScan";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

function sseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function streamLensChatResponse(
  messages: Array<{ role: string; content: string }>,
  image: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" },
  mode?: string,
): Promise<ReadableStream> {
  const client = getClient();

  // Build Claude message array, injecting the image into the first user message
  const claudeMessages: Anthropic.Messages.MessageParam[] = messages.map((m, i) => {
    if (i === 0 && m.role === "user") {
      return {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: image.mediaType, data: image.base64 },
          },
          { type: "text", text: m.content || "What am I looking at?" },
        ],
      };
    }
    return { role: m.role as "user" | "assistant", content: m.content };
  });

  const systemPrompt =
    CAMERA_SCAN_SYSTEM_PROMPT +
    (mode ? `\n\nThe user originally used the "${mode}" scan mode. They are now asking follow-up questions. Keep the same focus and tone.` : "");

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(event.delta.text))),
            );
          }
        }
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (err) {
        console.error("Lens chat stream error:", err);
        controller.enqueue(
          encoder.encode(sseEvent("text", JSON.stringify("Something went wrong. Please try again."))),
        );
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      }
    },
  });
}
