/**
 * ai-lens.ts — Focused AI for Lens (photo scan) follow-up chat
 *
 * Used when a user taps "Continue in chat" after a photo scan.
 * Unlike the general chat (ai.ts), this file:
 *   - Has NO tools (no search, no navigation, no Amap)
 *   - Reattaches the original photo to the first user message so Claude keeps visual context
 *   - Uses the same camera scan system prompt — stays focused on photo Q&A
 *   - Logs all messages to Supabase with source='lens'
 */

import Anthropic from "@anthropic-ai/sdk";
import { CAMERA_SCAN_SYSTEM_PROMPT } from "@/lib/prompts/cameraScan";
import {
  createChatSession,
  updateChatSession,
  logChatMessage,
  uploadLensPhoto,
  detectLanguage,
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

function sseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function streamLensChatResponse(
  messages: Array<{ role: string; content: string }>,
  image: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" },
  mode?: string,
  sessionId?: string,
  anonymousUserId?: string,
  deviceType?: "mobile" | "desktop",
): Promise<ReadableStream> {
  const client = getClient();
  const encoder = new TextEncoder();
  const startTime = Date.now();
  const userMessage = messages[messages.length - 1]?.content || "";

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

  // Session tracking
  let activeSessionId = sessionId || null;

  if (anonymousUserId && !sessionId) {
    activeSessionId = await createChatSession({
      anonymous_user_id: anonymousUserId,
      device_type: deviceType || "mobile",
      entry_page: `/lens-chat?mode=${mode || "IDENTIFY"}`,
      first_message: messages[0]?.content || userMessage,
      message_count: messages.length,
      source: "lens",
    });

    // Upload image for the new session
    if (activeSessionId) {
      const imageUrl = await uploadLensPhoto(image.base64, activeSessionId);

      // Log first user message with image
      logChatMessage({
        session_id: activeSessionId,
        role: "user",
        content: messages[0]?.content || userMessage,
        source: "lens",
        image_url: imageUrl,
        user_language: detectLanguage(messages[0]?.content || userMessage),
      });

      // Log any prior assistant/user messages in the conversation
      for (let i = 1; i < messages.length; i++) {
        logChatMessage({
          session_id: activeSessionId,
          role: messages[i].role as "user" | "assistant",
          content: messages[i].content,
          source: "lens",
        });
      }
    }
  } else if (activeSessionId) {
    // Existing session — log only the latest user message
    updateChatSession(activeSessionId, {
      message_count: messages.length,
      last_active_at: new Date().toISOString(),
    });
    logChatMessage({
      session_id: activeSessionId,
      role: "user",
      content: userMessage,
      source: "lens",
      user_language: detectLanguage(userMessage),
    });
  }

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  let fullResponseText = "";

  return new ReadableStream({
    async start(controller) {
      try {
        // Send session ID to client
        if (activeSessionId && !sessionId) {
          controller.enqueue(
            encoder.encode(sseEvent("session_created", JSON.stringify({ sessionId: activeSessionId }))),
          );
        }

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullResponseText += event.delta.text;
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(event.delta.text))),
            );
          }
        }

        // Log assistant response
        if (activeSessionId) {
          logChatMessage({
            session_id: activeSessionId,
            role: "assistant",
            content: fullResponseText,
            response_time_ms: Date.now() - startTime,
            source: "lens",
          });
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
