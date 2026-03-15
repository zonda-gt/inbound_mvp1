/**
 * ai-ask.ts — Focused AI for entity-specific Q&A
 *
 * Used when a user taps "Ask" on a restaurant or attraction detail page.
 * Unlike the general chat (ai.ts), this file:
 *   - Has NO tools (no search, no navigation, no Amap)
 *   - Fetches the full entity profile from Supabase and injects it into the system prompt
 *   - Only answers questions about the specific restaurant/attraction
 *   - Is simple and fast
 */

import Anthropic from "@anthropic-ai/sdk";
import { getRestaurantBySlug } from "@/lib/curated-restaurants";
import { getAttractionBySlug } from "@/lib/attractions";
import {
  createChatSession,
  updateChatSession,
  logChatMessage,
  detectLanguage,
} from "@/lib/logging";

/* ─── Anthropic client (same env var logic as ai.ts) ─── */

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

/* ─── SSE helper ─── */

function sseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

/* ─── System prompt ─── */

const BASE_PROMPT = `You are HelloChina, a helpful travel assistant for foreign travelers visiting China.

The user is asking about a specific place they are viewing in the app. Answer ONLY about this place using the profile data provided below. Be warm, specific, and practical — like a knowledgeable local friend.

Rules:
- Reference actual dishes, prices, tips, and details from the profile
- Include Chinese characters (汉字) AND pinyin for any Chinese words
- Keep responses concise and practical
- NEVER suggest other restaurants, attractions, or places
- NEVER say you don't have information — use the profile data provided
- If the user asks something not covered in the profile, give your best advice based on what you know about the type of place`;

/* ─── Profile builders ─── */

function buildRestaurantContext(rData: any): string {
  const p = rData.profile;
  if (!p) {
    // Fallback: basic data without profile JSON
    return `\nRESTAURANT: ${rData.name_en} (${rData.name_cn})\nCuisine: ${rData.cuisine || "Unknown"}\nHook: ${rData.foreigner_hook || ""}`;
  }

  const card = p.layer1_card || {};
  const detail = p.layer2_detail || {};

  let ctx = `\nRESTAURANT PROFILE:\n`;
  ctx += `Name: ${rData.name_en} (${rData.name_cn})\n`;
  ctx += `Cuisine: ${card.identity?.cuisine_type || rData.cuisine || "Unknown"}\n`;
  ctx += `Price: ¥${card.price?.price_per_person_cny || "?"}/person\n`;
  ctx += `Rating: ${card.tags?.rating || "N/A"}\n`;
  ctx += `Neighborhood: ${card.identity?.neighborhood_en || ""}\n`;
  ctx += `Hook: ${card.hook || card.verdict || rData.foreigner_hook || ""}\n`;
  ctx += `Vibe: ${card.vibe?.description || ""}\n`;

  if (card.tags?.best_for) ctx += `Best for: ${card.tags.best_for.join(", ")}\n`;
  if (card.dietary) {
    ctx += `Dietary: vegetarian=${card.dietary.vegetarian || "?"}, halal=${card.dietary.halal || "?"}, spice=${card.dietary.spice_level || "?"}\n`;
  }

  if (detail.what_to_order?.top_dishes) {
    ctx += `\nTop dishes:\n`;
    for (const d of detail.what_to_order.top_dishes) {
      const name = d.dish_name_en || d.name_en || d.name;
      ctx += `- ${name}: ${d.description || ""} (¥${d.price_cny || "?"}, comfort: ${d.comfort_level || "?"}/5${d.badge ? `, ${d.badge}` : ""})\n`;
    }
  }
  if (detail.what_to_order?.skip) ctx += `\nSkip: ${detail.what_to_order.skip}\n`;

  if (detail.how_to_order?.steps) {
    ctx += `\nHow to order:\n`;
    detail.how_to_order.steps.forEach((s: string, i: number) => {
      ctx += `${i + 1}. ${s}\n`;
    });
  }
  const mistakes = detail.how_to_order?.what_visitors_get_wrong || detail.how_to_order?.common_mistakes;
  if (mistakes?.length) ctx += `\nCommon mistakes: ${mistakes.join("; ")}\n`;

  if (detail.practical) {
    const pr = detail.practical;
    ctx += `\nPractical: Hours=${pr.opening_time || pr.hours || "?"}, Reservation=${pr.reservation || "?"}, Payment=${pr.payment || "?"}, Best time=${pr.best_time || "?"}\n`;
  }

  if (detail.getting_there) {
    const gt = detail.getting_there;
    const metro = typeof gt.nearest_metro === "string" ? gt.nearest_metro : gt.nearest_metro?.station || "";
    ctx += `\nGetting there: ${gt.taxi_tip || ""} Nearest metro: ${metro}\n`;
  }

  if (detail.warnings?.length) {
    ctx += `\nHeads up:\n`;
    for (const w of detail.warnings) {
      ctx += `- ${w.warning || w.text}: ${w.advice || ""}\n`;
    }
  }

  return ctx;
}

function buildAttractionContext(aData: any): string {
  let ctx = `\nATTRACTION PROFILE:\n`;
  ctx += `Name: ${aData.attraction_name_en} (${aData.attraction_name_cn})\n`;
  ctx += `Type: ${aData.experience_type}${aData.experience_type_secondary ? `, ${aData.experience_type_secondary}` : ""}\n`;
  ctx += `Hook: ${aData.hook || ""}\n`;
  ctx += `Description: ${aData.honest_description || ""}\n`;
  ctx += `Vibe: ${aData.vibe || ""}\n`;

  if (aData.time_needed) {
    ctx += `Time needed: Quick=${aData.time_needed.quick_visit}, Recommended=${aData.time_needed.recommended}, Deep dive=${aData.time_needed.deep_dive}\n`;
  }
  if (aData.best_time) {
    ctx += `Best time: ${aData.best_time.best_time_of_day}. Worst: ${aData.best_time.worst_time}. Pro tip: ${aData.best_time.pro_tip}\n`;
  }
  if (aData.getting_in) {
    const gi = aData.getting_in;
    ctx += `Getting in: ¥${gi.price_rmb} (~$${gi.price_usd}). Booking: ${gi.booking_required}. Passport: ${gi.passport_accepted}. Queue: ${gi.queue_situation}. Language: ${gi.language_barrier_rating}\n`;
  }

  if (aData.experience_highlights?.length) {
    ctx += `\nHighlights:\n`;
    for (const h of aData.experience_highlights) {
      ctx += `- ${h.name}: ${h.description} (${h.foreigner_appeal}${h.tip ? `. Tip: ${h.tip}` : ""})\n`;
    }
  }
  if (aData.strategy) {
    ctx += `\nStrategy: ${aData.strategy.smart_route}\nSkip: ${aData.strategy.what_to_skip}\nPro tips: ${(aData.strategy.pro_tips || []).join("; ")}\n`;
  }
  if (aData.heads_up?.length) {
    ctx += `\nHeads up:\n`;
    for (const h of aData.heads_up) {
      ctx += `- ${h.warning}: ${h.advice}\n`;
    }
  }
  if (aData.useful_chinese?.length) {
    ctx += `\nUseful Chinese:\n`;
    for (const c of aData.useful_chinese) {
      ctx += `- ${c.chinese} (${c.pinyin}): ${c.english}\n`;
    }
  }
  if (aData.pair_with?.length) {
    ctx += `\nPair with:\n`;
    for (const p of aData.pair_with) {
      ctx += `- ${p.suggestion}: ${p.why} (${p.travel_time})\n`;
    }
  }
  if (aData.photo_spots?.length) {
    ctx += `\nPhoto spots:\n`;
    for (const s of aData.photo_spots) {
      ctx += `- ${s.location}: ${s.tip}\n`;
    }
  }

  return ctx;
}

/* ─── Main streaming function ─── */

export function streamAskResponse(
  messages: Array<{ role: string; content: string }>,
  entityType: "restaurant" | "attraction",
  entitySlug: string,
  // Session tracking
  sessionId?: string,
  anonymousUserId?: string,
  referralSource?: string,
  deviceType?: "mobile" | "desktop",
  entryPage?: string,
  gpsPermissionStatus?: "granted" | "denied" | "dismissed",
  userLat?: number,
  userLng?: number,
  isDemoMode?: boolean,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const dbWrites: Promise<unknown>[] = [];
        const startTime = Date.now();
        const userMessage = messages[messages.length - 1]?.content || "";

        // 1. Fetch entity profile
        let entityContext = "";
        let entityName = entitySlug;

        if (entityType === "restaurant") {
          const rData = await getRestaurantBySlug(entitySlug);
          if (rData) {
            entityName = rData.name_en || entitySlug;
            entityContext = buildRestaurantContext(rData);
          } else {
            console.warn("[ai-ask] Restaurant not found:", entitySlug);
          }
        } else {
          const aData = await getAttractionBySlug(entitySlug);
          if (aData) {
            entityName = aData.attraction_name_en || entitySlug;
            entityContext = buildAttractionContext(aData);
          } else {
            console.warn("[ai-ask] Attraction not found:", entitySlug);
          }
        }

        if (!entityContext) {
          // Entity not found — send a helpful fallback
          const fallback = `I don't have detailed data for this ${entityType} yet, but feel free to ask and I'll do my best!`;
          controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(fallback))));
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        const systemPrompt = BASE_PROMPT + entityContext;

        // 2. Session tracking
        let activeSessionId = sessionId;
        if (anonymousUserId && !sessionId) {
          let trackingCity: string | null;
          if (isDemoMode) {
            if (gpsPermissionStatus === "granted") trackingCity = "overseas";
            else if (gpsPermissionStatus === "denied") trackingCity = "denied";
            else if (gpsPermissionStatus === "dismissed") trackingCity = "dismissed";
            else trackingCity = "timeout";
          } else {
            trackingCity = null;
          }

          const newSessionId = await createChatSession({
            anonymous_user_id: anonymousUserId,
            referral_source: referralSource,
            device_type: deviceType || "desktop",
            user_city: trackingCity,
            gps_permission_status: gpsPermissionStatus,
            entry_page: entryPage || `/chat?${entityType}=${entitySlug}`,
            first_message: userMessage,
            message_count: 1,
            is_demo_mode: isDemoMode || false,
            source: "ask",
            entity_type: entityType,
            entity_slug: entitySlug,
          });

          if (newSessionId) {
            activeSessionId = newSessionId;
            controller.enqueue(
              encoder.encode(sseEvent("session_created", JSON.stringify({ sessionId: newSessionId }))),
            );
          }
        } else if (activeSessionId) {
          dbWrites.push(
            updateChatSession(activeSessionId, {
              message_count: messages.length,
              last_active_at: new Date().toISOString(),
            }),
          );
        }

        // Log user message
        if (activeSessionId) {
          dbWrites.push(
            logChatMessage({
              session_id: activeSessionId,
              role: "user",
              content: userMessage,
              user_lat: userLat,
              user_lng: userLng,
              user_language: detectLanguage(userMessage),
              source: "ask",
            }),
          );
        }

        // 3. Build API messages
        const apiMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // 4. Stream response — NO tools
        const stream = getClient().messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        });

        let fullResponseText = "";

        stream.on("text", (text) => {
          fullResponseText += text;
          controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(text))));
        });

        await stream.finalMessage();

        // 5. Log assistant response
        if (activeSessionId) {
          const responseTime = Date.now() - startTime;
          const assistantMsgId = await logChatMessage({
            session_id: activeSessionId,
            role: "assistant",
            content: fullResponseText,
            tools_called: undefined,
            tool_success: undefined,
            is_fallback: false,
            response_time_ms: responseTime,
            source: "ask",
          });

          if (assistantMsgId) {
            controller.enqueue(
              encoder.encode(sseEvent("message_id", JSON.stringify({ messageId: assistantMsgId }))),
            );
          }
        }

        await Promise.allSettled(dbWrites);
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (error) {
        console.error("[ai-ask] Error:", error instanceof Error ? error.message : String(error));
        controller.enqueue(
          encoder.encode(sseEvent("error", JSON.stringify({ message: "Something went wrong. Please try again." }))),
        );
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      }
    },
  });
}
