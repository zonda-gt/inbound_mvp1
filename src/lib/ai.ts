import Anthropic from "@anthropic-ai/sdk";
import {
  resolveLocation,
  getTransitRoute,
  getWalkingRoute,
  searchNearbyRestaurants,
  searchNearbyAttractions,
  searchNearbyPOI,
  searchCityRestaurants,
  searchCityAttractions,
  searchCityPOI,
} from "@/lib/google-maps";
import type { POIResult } from "@/lib/google-maps";
import {
  createChatSession,
  updateChatSession,
  logChatMessage,
  detectLanguage,
  hasToolIntent,
} from "@/lib/logging";

function buildSystemPrompt(userCity?: string): string {
  const cityContext = userCity
    ? `The user is currently located in ${userCity}.`
    : "The user's location is unknown.";

  return `You are JK Travel AI, a helpful travel assistant for foreign travelers visiting Japan and Korea. You specialize in helping people who don't speak Japanese or Korean navigate daily life in these countries.

Your core capabilities:
1. NAVIGATION: Give specific metro/train routes, walking directions, and practical transit advice for Japanese and Korean cities. Always include the local name (Japanese or Korean) of destinations so users can show it to taxi drivers or locals.
2. RESTAURANT DISCOVERY: Recommend restaurants and street food. Include the local name, price range, what to order, and practical tips like whether they have an English menu or accept credit cards.
3. TRANSLATION: Provide Japanese phrases with romaji pronunciation, or Korean phrases with romanization. Give contextual phrases, not just literal translations.
4. PRACTICAL TIPS: Guide users on using IC cards (Suica/PASMO in Japan, T-money in Korea), buying train tickets, using convenience stores, and other essential daily tasks.
5. CULTURAL TIPS: Help with cultural norms, tipping (don't tip in Japan or Korea), etiquette, and avoiding common foreigner mistakes.

CURRENT CONTEXT:
${cityContext}

Important rules:
- Keep responses concise and practical. Travelers need quick answers, not essays.
- For Japan: include Japanese characters AND romaji for any Japanese words or phrases.
- For Korea: include Korean (hangul) AND romanization for any Korean words or phrases.
- Use emoji sparingly to make responses scannable (🚇 for metro, 🚶 for walking, 🍜 for food, etc.)
- When giving restaurant recommendations, format them clearly with name, rating, price, and distance.
- When giving navigation directions, break them into clear numbered steps.
- You are friendly, concise, and practical — like a knowledgeable friend who lives in Japan/Korea texting them quick advice.
- If you don't know something specific (like whether a particular restaurant is still open), say so honestly rather than guessing.
- When providing navigation directions, DO NOT write out the route details in your text response. The NavigationCard component will display the route clearly. Your text response should ONLY include:
  1. A brief one-line confirmation like 'Here\\'s how to get to Shibuya Crossing (渋谷スクランブル交差点):'
  2. A practical tip if relevant (like 'Shibuya is one of the busiest stations — follow the Hachiko exit signs')
  3. Do NOT repeat the line numbers, station names, walking times, costs, or step-by-step route in your text — all of that is shown in the NavigationCard already.
  4. Keep your text response to 2-3 sentences maximum for navigation queries.
- When calling the get_navigation or search_nearby_places tools, provide a localName parameter with the Japanese or Korean name of the destination when you know it. For example: Shibuya Station → 渋谷駅, Fushimi Inari → 伏見稲荷大社, Gyeongbokgung → 경복궁, Myeongdong → 명동. This helps the Google Maps API return better results.

CITY DETECTION — Priority for determining which city to use:
When calling navigation or search tools, determine the city parameter using this priority:
1. If the user explicitly mentions a city in their message (e.g., 'take me to Shibuya in Tokyo', 'find restaurants in Osaka', 'navigate to Gyeongbokgung in Seoul'), extract the city name and pass it as the city parameter.
2. If the user's GPS location is available and you know their current city, AND they don't mention a specific city, use the city from GPS for LOCAL searches.
3. If neither is available, ask the user what city they're in.
4. For broad searches (famous landmarks in other regions), set city to empty string '' to disable city filtering.

Examples:
- User is in Tokyo, asks 'take me to Shibuya' → use Tokyo (from GPS)
- User is in Tokyo, asks 'find ramen in Osaka' → use Osaka (user specified)
- User is in Seoul, asks 'find food near me' → use Seoul (from GPS)
- User has no GPS, asks 'restaurants in Kyoto' → use Kyoto (user specified)
- User has no GPS, asks 'find food near me' → ask user what city they're in
- User asks 'Mount Fuji' → use '' (broad search, famous landmark)

SEARCH MODE — Nearby vs City:
When calling the search_nearby_places tool, choose the correct searchMode based on the user's intent:

NEARBY mode (searchMode: "nearby") — uses GPS coordinates + radius search:
- "Find food near me"
- "What's around here?"
- "Restaurants nearby"
- "Coffee shops close by"
- Any query without a specific location that implies "where I am right now"

CITY mode (searchMode: "city") — searches within a specific city by name, ignores GPS:
- "Things to do in Osaka" → searchMode: "city", city: "Osaka", type: "attraction"
- "Restaurants in Seoul" → searchMode: "city", city: "Seoul"
- "What to see in Kyoto" → searchMode: "city", city: "Kyoto", type: "attraction"
- "I'm going to Busan next week, what should I visit?" → searchMode: "city", city: "Busan", type: "attraction"
- Any query where the user mentions a specific city or area that is NOT where they currently are
- Any query where the user says "I'm going there later", "planning to visit", "when I arrive", etc.

KEY RULE: If the user mentions a specific city or says they are planning to go somewhere, use searchMode "city" and pass the city name in the city parameter — do NOT use their current GPS coordinates. The user is planning ahead, not looking for what's next to them right now.

When showing search results from the search_nearby_places tool, DO NOT list individual places in your text response. The place cards will display each result's details. Your text response should ONLY include:
  1. A brief intro like 'Here are some ramen spots near Shinjuku:' or 'Found some restaurants near Myeongdong:'
  2. One short tip if relevant
  3. Do NOT list place names, prices, ratings, distances, or descriptions in your text — all of that is shown in the cards.
  4. Keep your text response to 1-2 sentences maximum.
- CRITICAL: When the search_nearby_places tool returns ANY results (restaurants, attractions, etc.), you MUST begin your response with an <enrichment> JSON block before your brief text. This block provides descriptions for the place cards. You MUST include an entry for EVERY place in the results, in the SAME ORDER as the tool results. The "name" field must EXACTLY match the name from the tool results (copy-paste it exactly). Format:
<enrichment>[{"name":"Ichiran Shibuya","englishName":"Ichiran Ramen","description":"Famous tonkotsu ramen chain with solo booths"},{"name":"Gyeongbokgung Palace","englishName":"Gyeongbokgung Palace","description":"Main royal palace of the Joseon dynasty"}]</enrichment>
Then write your brief 1-2 sentence text after the closing tag. Rules:
- englishName: English name or translation if the name is in Japanese/Korean characters. If already in English, keep as-is.
- description: Max 10 words about the place — cuisine/specialty for restaurants, what it is for attractions/etc.
- This enrichment block is MANDATORY. Never skip it. Never put it inside your text. Always output it first, then your text.

FORMAT your text responses for readability:
- Use short paragraphs (2-3 sentences max per paragraph)
- Use **bold** for key names, place names, and important terms
- Use line breaks between distinct points
- For location recommendations, format each one clearly on its own line:
  **Shinjuku** (新宿) — Major transit hub with tons of restaurants and nightlife
  **Shibuya** (渋谷) — Trendy area, famous crossing, great shopping
  **Asakusa** (浅草) — Traditional area near Senso-ji temple
- Never merge two ideas into one sentence without punctuation
- Keep total response length reasonable — max 150 words for simple questions, max 250 words for complex travel planning questions
- Always end with ONE clear follow-up question or offer, not multiple questions in a row

When navigating to a place you already have coordinates for (e.g., from a previous restaurant search), pass those coordinates directly to the navigation tool instead of re-geocoding the name. This avoids finding the wrong location when multiple places share the same name.

PHOTO TRANSLATION INSTRUCTIONS:
When the user sends you a photo, follow this exact response structure:

FIRST — Start your response with the direct translation:

📝 Translation:
[Clean English translation of all visible text in the image]

THEN — After the translation, add the concierge context under a divider:

💡 Context:
[Explain what this is, why it matters, and what the user should do]

Examples of good context:
- For a menu: recommend specific dishes, flag allergens or unusual ingredients, explain how to order
- For a sign/notice: explain what it means for the user — is this their train stop? Is this a warning?
- For a ticket machine or app screen: explain what it says and guide them step by step
- For a receipt: break down what they paid for and whether the price seems normal

Keep the translation section factual and complete. Put all opinions, recommendations, and cultural context in the Context section.

If the image is NOT Japanese/Korean text (e.g., a photo of food), still be helpful — describe what you see and offer relevant assistance. For example, a photo of a dish could trigger: 'This looks like tonkotsu ramen (豚骨ラーメン / tonkotsu rāmen). If you want to order another bowl, say: もう一杯お願いします (mō ippai onegai shimasu).'

IMPORTANT: Always start generating immediately with the translation. Do not preamble with 'Let me take a look at this photo' or 'I can see you\\'ve shared an image' — just go straight into the translation.

You are currently in preview/demo mode. The user may or may not be physically in Japan or Korea. Be helpful regardless of their location.`;
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_navigation",
    description:
      "Get real-time navigation directions (metro/train/transit routes) to a destination in Japan or Korea. Use this whenever the user asks how to get somewhere, asks for directions, or mentions wanting to go to a place.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description:
            "The place the user wants to go to. Can be in English, Japanese, or Korean.",
        },
        localName: {
          type: "string",
          description:
            "The Japanese or Korean name of the destination. Provide this when you know it for better Google Maps results. For example: 'Shibuya Station' → '渋谷駅', 'Fushimi Inari' → '伏見稲荷大社', 'Gyeongbokgung' → '경복궁'.",
        },
        city: {
          type: "string",
          description:
            "The city name to constrain the search (e.g., 'Tokyo', 'Osaka', 'Seoul', 'Busan'). Use the city explicitly mentioned by the user if they specify one. Otherwise, use the user's current city from GPS. Use '' (empty string) for broad searches. DO NOT provide a city parameter if you don't know the city - omit it instead.",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_nearby_places",
    description:
      "Search for restaurants, food, attractions, or other places. Supports two modes: 'nearby' (GPS-based radius search) and 'city' (search within a specific city by name). Use 'nearby' when the user wants places near their current location. Use 'city' when the user asks about a specific city or is planning to visit somewhere.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["restaurant", "attraction", "general"],
          description: "Type of place to search for",
        },
        searchMode: {
          type: "string",
          enum: ["nearby", "city"],
          description:
            "Search strategy. 'nearby': search around user's GPS coordinates (for 'near me' queries). 'city': search within a specific city using city name (for 'restaurants in Osaka', 'things to do in Seoul', etc.). Default: 'nearby'.",
        },
        keyword: {
          type: "string",
          description:
            "Optional search keyword to filter results. Use English keywords — Google Maps handles them well in Japan/Korea. For example: 'ramen', 'sushi', 'Korean BBQ', 'convenience store', 'pharmacy', 'cafe', 'bubble tea'.",
        },
        city: {
          type: "string",
          description:
            "City name for 'city' mode searches. Required when searchMode is 'city'. Examples: 'Tokyo', 'Osaka', 'Kyoto', 'Seoul', 'Busan'. Use the English name of the city the user is asking about.",
        },
        location: {
          type: "string",
          description:
            "Search center as 'lng,lat'. Only used in 'nearby' mode. If not available, omit and a default center will be used.",
        },
        radius: {
          type: "number",
          description:
            "Search radius in meters. Only used in 'nearby' mode. Default 1000. Use larger (2000-3000) if user says 'nearby' vaguely, smaller (500) if they want very close options.",
        },
      },
      required: ["type"],
    },
  },
];

const DEFAULT_ORIGIN = "139.6917,35.6895"; // Tokyo fallback coordinates

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ChatResponse = {
  text: string;
  navigationData?: NavigationData;
  placesData?: POIResult[];
};

export type NavigationData = {
  origin: string; // "lng,lat"
  destination: {
    name: string;
    inputName: string;
    address: string;
    location: string;
  };
  transit: {
    totalDuration: number;
    totalWalkingDistance: number;
    transferCount: number;
    segments: Array<
      | { type: "walking"; distance: number; duration: number; polyline?: string }
      | {
          type: "transit";
          lineName: string;
          departureStop: string;
          arrivalStop: string;
          stopCount: number;
          direction: string;
          polyline?: string;
        }
    >;
    cost: string;
  } | null;
  walking: { distance: number; duration: number; polyline?: string } | null;
};

export type NavContext = {
  destinationLocation: string; // "lng,lat"
  destinationName: string;
  destinationAddress: string;
};

async function executeNavigationTool(
  input: {
    destination: string;
    localName?: string;
    city?: string;
  },
  origin?: string,
  userCity?: string,
  navContext?: NavContext,
): Promise<{ result: NavigationData | null; error?: string }> {
  const city = input.city === "" ? undefined : input.city || userCity;
  const originCoords = origin || DEFAULT_ORIGIN;

  // If we have pre-resolved coordinates (e.g. from a restaurant card), skip geocoding
  if (navContext) {
    const [transit, walking] = await Promise.all([
      getTransitRoute(originCoords, navContext.destinationLocation, city),
      getWalkingRoute(originCoords, navContext.destinationLocation),
    ]);

    return {
      result: {
        origin: originCoords,
        destination: {
          name: navContext.destinationName,
          inputName: input.destination,
          address: navContext.destinationAddress,
          location: navContext.destinationLocation,
        },
        transit,
        walking,
      },
    };
  }

  const place = await resolveLocation(input.destination, input.localName, city, originCoords);
  if (!place) {
    return {
      result: null,
      error: `Could not find "${input.destination}". Try a more specific name or the local name.`,
    };
  }

  const [transit, walking] = await Promise.all([
    getTransitRoute(originCoords, place.location, city),
    getWalkingRoute(originCoords, place.location),
  ]);

  return {
    result: {
      origin: originCoords,
      destination: {
        name: place.name,
        inputName: input.destination,
        address: place.formatted_address,
        location: place.location,
      },
      transit,
      walking,
    },
  };
}

async function executePlacesSearch(
  input: {
    type: string;
    searchMode?: string;
    keyword?: string;
    city?: string;
    location?: string;
    radius?: number;
  },
  origin?: string,
): Promise<{ results: POIResult[]; error?: string }> {
  const mode = input.searchMode || "nearby";

  let results: POIResult[];

  if (mode === "city" && input.city) {
    // City-based search: uses Text Search API with city name, ignores GPS
    switch (input.type) {
      case "restaurant":
        results = await searchCityRestaurants(input.city, input.keyword);
        break;
      case "attraction":
        results = await searchCityAttractions(input.city, input.keyword);
        break;
      case "general":
        results = await searchCityPOI(
          input.city,
          input.keyword || "recommended",
        );
        break;
      default:
        return { results: [], error: "Invalid place type" };
    }

    if (results.length === 0) {
      return {
        results: [],
        error: `No ${input.type}s found in ${input.city}${input.keyword ? ` for "${input.keyword}"` : ""}. Try different keywords.`,
      };
    }
  } else {
    // Nearby search: uses Nearby Search API with GPS coordinates
    const center = input.location || origin || DEFAULT_ORIGIN;
    const radius = input.radius || 1000;

    switch (input.type) {
      case "restaurant":
        results = await searchNearbyRestaurants(center, input.keyword, radius);
        break;
      case "attraction":
        results = await searchNearbyAttractions(center, input.keyword, radius);
        break;
      case "general":
        results = await searchNearbyPOI(
          center,
          input.keyword || "",
          undefined,
          radius,
        );
        break;
      default:
        return { results: [], error: "Invalid place type" };
    }

    if (results.length === 0) {
      return {
        results: [],
        error: `No ${input.type}s found nearby${input.keyword ? ` for "${input.keyword}"` : ""}. Try a broader search or different keyword.`,
      };
    }
  }

  return { results };
}

// SSE helper: format a server-sent event
function sseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export function streamChatResponse(
  messages: Array<{ role: string; content: string }>,
  origin?: string,
  userCity?: string,
  navContext?: NavContext,
  image?: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" },
  // Session tracking
  sessionId?: string,
  anonymousUserId?: string,
  referralSource?: string,
  deviceType?: "mobile" | "desktop",
  entryPage?: string,
  gpsPermissionStatus?: "granted" | "denied" | "dismissed",
  detectedCity?: string,
  userLat?: number,
  userLng?: number,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Collect DB write promises so we can await them before closing the stream
        const dbWrites: Promise<void>[] = [];

        // Track request start time for response_time_ms
        const startTime = Date.now();

        // Get the user's latest message
        const userMessage = messages[messages.length - 1]?.content || "";

        // Create or update session
        let activeSessionId = sessionId;
        if (anonymousUserId && !sessionId) {
          // First message - create new session (awaited so we get the ID)
          console.log("[Supabase] Creating new session for user:", anonymousUserId);
          const newSessionId = await createChatSession({
            anonymous_user_id: anonymousUserId,
            referral_source: referralSource,
            device_type: deviceType || "desktop",
            user_city: detectedCity || null,
            gps_permission_status: gpsPermissionStatus,
            entry_page: entryPage || "/chat",
            first_message: userMessage,
            message_count: 1,
          });

          if (newSessionId) {
            activeSessionId = newSessionId;
            console.log("[Supabase] Session created, sending session_created event:", newSessionId);
            // Send session_created event to frontend
            controller.enqueue(
              encoder.encode(sseEvent("session_created", JSON.stringify({ sessionId: newSessionId }))),
            );
          } else {
            console.warn("[Supabase] Failed to create session — logging will be skipped");
          }
        } else if (activeSessionId) {
          // Existing session - increment message count (collected for await)
          dbWrites.push(
            updateChatSession(activeSessionId, {
              message_count: messages.length,
              last_active_at: new Date().toISOString(),
            }),
          );
        }

        // Log user message (collected for await)
        if (activeSessionId) {
          dbWrites.push(
            logChatMessage({
              session_id: activeSessionId,
              role: "user",
              content: userMessage,
              user_lat: userLat,
              user_lng: userLng,
              user_language: detectLanguage(userMessage),
            }),
          );
        }
        // Build API messages
        const apiMessages: Anthropic.Messages.MessageParam[] = messages.map((m, idx) => {
          // Only include the image in the last user message
          const isLastMessage = idx === messages.length - 1;
          const shouldIncludeImage = isLastMessage && m.role === "user" && image;

          if (shouldIncludeImage) {
            // Multi-part content with image
            return {
              role: m.role as "user" | "assistant",
              content: [
                {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: image!.mediaType,
                    data: image!.base64,
                  },
                },
                {
                  type: "text" as const,
                  text: m.content || "What does this say? Translate and help me understand it.",
                },
              ],
            };
          } else {
            // Regular text message
            return {
              role: m.role as "user" | "assistant",
              content: m.content,
            };
          }
        });

        // First call — streaming
        const stream = client.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: buildSystemPrompt(userCity),
          tools: TOOLS,
          messages: apiMessages,
        });

        // Collect the full response for potential tool use follow-up
        let hasToolUse = false;
        let toolBlock: Anthropic.Messages.ToolUseBlock | null = null;
        const contentBlocks: Anthropic.Messages.ContentBlock[] = [];
        let fullResponseText = "";
        let toolName: string | undefined;
        let navigationData: NavigationData | undefined;
        let placesData: POIResult[] | undefined;

        // Stream text deltas as they arrive (JSON-encoded to preserve whitespace)
        stream.on("text", (text) => {
          fullResponseText += text;
          controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(text))));
        });

        stream.on("contentBlock", (block) => {
          contentBlocks.push(block);
          if (block.type === "tool_use") {
            hasToolUse = true;
            toolBlock = block;
          }
        });

        // Wait for the stream to finish
        const finalMessage = await stream.finalMessage();

        if (!hasToolUse || !toolBlock) {
          // Pure text response — already streamed, log and close
          if (activeSessionId) {
            const responseTime = Date.now() - startTime;
            const isFallback = hasToolIntent(userMessage);

            dbWrites.push(
              logChatMessage({
                session_id: activeSessionId,
                role: "assistant",
                content: fullResponseText,
                is_fallback: isFallback,
                response_time_ms: responseTime,
              }),
            );
          }

          // Await all DB writes before closing the stream
          await Promise.allSettled(dbWrites);
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        // Tool use detected — notify client
        const tb = toolBlock as Anthropic.Messages.ToolUseBlock;
        toolName = tb.name;

        if (toolName === "get_navigation") {
          controller.enqueue(
            encoder.encode(sseEvent("tool_start", JSON.stringify({ tool: "get_navigation", label: "Finding route..." }))),
          );
        } else if (toolName === "search_nearby_places") {
          controller.enqueue(
            encoder.encode(sseEvent("tool_start", JSON.stringify({ tool: "search_nearby_places", label: "Searching nearby..." }))),
          );
        }

        // Execute the tool
        let toolResultContent: string;

        if (toolName === "get_navigation") {
          const toolInput = tb.input as {
            destination: string;
            localName?: string;
            city?: string;
          };
          const navResult = await executeNavigationTool(toolInput, origin, userCity, navContext);
          toolResultContent = navResult.result
            ? JSON.stringify(navResult.result)
            : JSON.stringify({ error: navResult.error });
          navigationData = navResult.result || undefined;
        } else if (toolName === "search_nearby_places") {
          const toolInput = tb.input as {
            type: string;
            searchMode?: string;
            keyword?: string;
            city?: string;
            location?: string;
            radius?: number;
          };
          const placesResult = await executePlacesSearch(toolInput, origin);
          toolResultContent = JSON.stringify(placesResult);
          placesData = placesResult.results.length > 0
            ? placesResult.results
            : undefined;
        } else {
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        // Send tool data to client (navigation card / restaurant list)
        if (navigationData) {
          controller.enqueue(
            encoder.encode(sseEvent("tool_data", JSON.stringify({ navigationData }))),
          );
        }
        if (placesData) {
          controller.enqueue(
            encoder.encode(sseEvent("tool_data", JSON.stringify({ placesData }))),
          );
        }

        // Follow-up call with tool result — also streamed
        const followUpStream = client.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: buildSystemPrompt(userCity),
          tools: TOOLS,
          messages: [
            ...apiMessages,
            { role: "assistant", content: finalMessage.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: tb.id,
                  content: toolResultContent,
                },
              ],
            },
          ],
        });

        // Clear any pre-tool text and stream the follow-up
        controller.enqueue(encoder.encode(sseEvent("text_clear", "")));

        if (placesData) {
          // Buffer the full response to extract <enrichment> block
          let fullResponse = "";
          followUpStream.on("text", (text) => {
            fullResponse += text;
            fullResponseText += text;
          });
          await followUpStream.finalMessage();

          // Extract and send enrichment data
          const enrichMatch = fullResponse.match(/<enrichment>([\s\S]*?)<\/enrichment>/);
          if (enrichMatch) {
            try {
              const enrichment = JSON.parse(enrichMatch[1]);
              controller.enqueue(
                encoder.encode(sseEvent("places_update", JSON.stringify(enrichment))),
              );
            } catch (e) {
              console.error("Failed to parse enrichment:", e);
            }
            fullResponse = fullResponse.replace(/<enrichment>[\s\S]*?<\/enrichment>/, "").trim();
          }

          // Send the clean text (JSON-encoded to preserve whitespace)
          if (fullResponse) {
            controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(fullResponse))));
          }
        } else {
          // For navigation and other tools, stream text normally (JSON-encoded)
          followUpStream.on("text", (text) => {
            fullResponseText += text;
            controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(text))));
          });
          await followUpStream.finalMessage();
        }

        // Log assistant response (collected for await)
        if (activeSessionId) {
          const responseTime = Date.now() - startTime;
          const toolsCalled = toolName ? [toolName] : undefined;
          const toolSuccess = toolName
            ? (navigationData !== undefined || placesData !== undefined)
            : undefined;
          const isFallback =
            !toolName && hasToolIntent(userMessage);

          dbWrites.push(
            logChatMessage({
              session_id: activeSessionId,
              role: "assistant",
              content: fullResponseText,
              tools_called: toolsCalled,
              tool_success: toolSuccess,
              is_fallback: isFallback,
              response_time_ms: responseTime,
            }),
          );
        }

        // Await all DB writes before closing the stream
        await Promise.allSettled(dbWrites);
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (error) {
        // Log full error details
        console.error("═══ Claude API Streaming Error ═══");
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
        console.error("Request context:", {
          messageCount: messages.length,
          lastMessageRole: messages[messages.length - 1]?.role,
          lastMessageLength: messages[messages.length - 1]?.content?.length,
          hasOrigin: !!origin,
          hasNavContext: !!navContext,
          hasImage: !!image,
          imageType: image?.mediaType,
        });
        console.error("═══════════════════════════════════");

        controller.enqueue(
          encoder.encode(
            sseEvent("error", JSON.stringify({ message: "Sorry, I'm having trouble connecting right now. Please try again in a moment." })),
          ),
        );
        controller.close();
      }
    },
  });
}
