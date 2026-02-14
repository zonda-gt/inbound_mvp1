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
} from "@/lib/amap";
import type { POIResult } from "@/lib/amap";

function buildSystemPrompt(userCity?: string): string {
  const cityContext = userCity
    ? `The user is currently located in ${userCity}.`
    : "The user's location is unknown.";

  return `You are ChinaTravel AI, a helpful travel assistant for foreign travelers visiting China. You specialize in helping people who don't speak Chinese navigate daily life in China.

Your core capabilities:
1. NAVIGATION: Give specific metro routes, walking directions, and practical transit advice for Chinese cities. Always include the Chinese name (汉字) of destinations so users can show it to taxi drivers.
2. RESTAURANT DISCOVERY: Recommend restaurants and street food. Include the Chinese name, price range in ¥, what to order, and practical tips like whether they accept WeChat Pay or have an English menu.
3. TRANSLATION: Provide Chinese phrases with pinyin pronunciation. Give contextual phrases, not just literal translations.
4. APP SETUP: Guide users through setting up Alipay, WeChat Pay, VPN, and other essential apps for foreigners in China.
5. CULTURAL TIPS: Help with cultural norms, tipping (don't tip in China), etiquette, and avoiding common foreigner mistakes.

CURRENT CONTEXT:
${cityContext}

Important rules:
- Keep responses concise and practical. Travelers need quick answers, not essays.
- Always include Chinese characters (汉字) AND pinyin for any Chinese words or phrases.
- Use emoji sparingly to make responses scannable (🚇 for metro, 🚶 for walking, 🍜 for food, etc.)
- When giving restaurant recommendations, format them clearly with name, rating, price, and distance.
- When giving navigation directions, break them into clear numbered steps.
- If asked about VPNs, Google, Instagram, or other blocked services, be helpful and practical — recommend solutions without being preachy.
- You are friendly, concise, and practical — like a knowledgeable friend who lives in China texting them quick advice.
- If you don't know something specific (like whether a particular restaurant is still open), say so honestly rather than guessing.
- When providing navigation directions, DO NOT write out the route details in your text response. The NavigationCard component will display the route clearly. Your text response should ONLY include:
  1. A brief one-line confirmation like 'Here's how to get to CEIBS (中欧国际工商学院):'
  2. A practical tip if relevant (like 'CEIBS is in Pudong's Jinqiao area, a bit far from city center — metro is much cheaper than taxi')
  3. Do NOT repeat the metro line numbers, station names, walking times, costs, or step-by-step route in your text — all of that is shown in the NavigationCard already.
  4. Keep your text response to 2-3 sentences maximum for navigation queries.
  Example good response: 'Here's how to get to CEIBS (中欧国际工商学院): 💡 It's in Pudong's Jinqiao area — the metro is ¥4 but takes about 52 min. A taxi would be 30-40 min and cost ¥60-80. See the route details below.'
  Example bad response: repeating all the station names, line numbers, and walking directions that the card already shows.
- When calling the get_navigation or search_nearby_places tools, ALWAYS provide a chineseName parameter with the Chinese translation of the destination. For example: The Bund → 外滩, CEIBS → 中欧国际工商学院, Yu Garden → 豫园, People's Square → 人民广场, Shanghai Tower → 上海中心大厦. This is critical because the Amap API returns much better results with Chinese input.

CRITICAL — English address translation:
When the user gives a street address in English, you MUST translate it to Chinese before calling any tool. English addresses do not work with the Chinese map API. Examples:
- 'No.685 Dingxi Road' → '定西路685号'
- 'Xinhua Business Building' → '新华商务大厦'
- '123 Nanjing West Road' → '南京西路123号'
- 'Huaihai Road' → '淮海路'
The Chinese address format is: [路名][门牌号]号[建筑名]. Always provide the full Chinese translation in the chineseName parameter.

CITY DETECTION — Priority for determining which city to use:
When calling navigation or search tools, determine the city parameter using this priority:
1. If the user explicitly mentions a city in their message (e.g., 'take me to Gaoyou Road in Shanghai', 'find restaurants in Beijing', 'navigate to the Great Wall in Beijing'), extract the city name and pass it as the city parameter, regardless of where the user's GPS says they are. The user might be planning ahead for a different city.
2. If the user's GPS location is available and you know their current city, AND they don't mention a specific city, use the city from GPS for LOCAL searches.
3. If neither is available, ask the user what city they're in.
4. For NATIONAL searches (famous landmarks in other provinces, broad queries across China), set city to empty string '' to disable city filtering.

Examples:
- User is in 北京, asks 'take me to Gaoyou Road' → use 北京 (from GPS)
- User is in 北京, asks 'take me to Gaoyou Road Shanghai' → use 上海 (user specified)
- User is in 北京, asks 'find food near me' → use 北京 (from GPS)
- User has no GPS, asks 'restaurants in Chengdu' → use 成都 (user specified)
- User has no GPS, asks 'find food near me' → ask user what city they're in
- User asks 'Great Wall' → use '' (NATIONAL search, famous landmark)

LOCAL vs NATIONAL search:
- LOCAL: specific street addresses, 'near me' queries, local businesses/restaurants/buildings, any place in the user's current city.
- NATIONAL: destinations in other cities/provinces, famous national landmarks, broad searches across China.

SEARCH MODE — Nearby vs City:
When calling the search_nearby_places tool, choose the correct searchMode based on the user's intent:

NEARBY mode (searchMode: "nearby") — uses GPS coordinates + /place/around:
- "Find food near me"
- "What's around here?"
- "Restaurants nearby"
- "Coffee shops close by"
- Any query without a specific location that implies "where I am right now"

CITY mode (searchMode: "city") — uses city name + /place/text, ignores GPS:
- "Things to do in Jilin city" → searchMode: "city", city: "吉林", keyword: "景点"
- "Restaurants in Beijing" → searchMode: "city", city: "北京"
- "What to see in Chengdu" → searchMode: "city", city: "成都", keyword: "景点"
- "I'm going to Shanghai next week, what should I visit?" → searchMode: "city", city: "上海", keyword: "景点"
- Any query where the user mentions a specific city or area that is NOT where they currently are
- Any query where the user says "I'm going there later", "planning to visit", "when I arrive", etc.

KEY RULE: If the user mentions a specific city or says they are planning to go somewhere, use searchMode "city" and pass the city name in the city parameter — do NOT use their current GPS coordinates. The user is planning ahead, not looking for what's next to them right now.

When showing search results from the search_nearby_places tool, DO NOT list individual places in your text response. The place cards will display each result's details. Your text response should ONLY include:
  1. A brief intro like 'Here are some restaurants near People's Square:' or 'Found some shopping malls near Hongqiao:'
  2. One short tip if relevant
  3. Do NOT list place names, prices, ratings, distances, or descriptions in your text — all of that is shown in the cards.
  4. Keep your text response to 1-2 sentences maximum.
- When translating keywords for Amap search, use Chinese keywords for much better results
- CRITICAL: When the search_nearby_places tool returns ANY results (restaurants, malls, attractions, etc.), you MUST begin your response with an <enrichment> JSON block before your brief text. This block provides English names and descriptions for the place cards. You MUST include an entry for EVERY place in the results, in the SAME ORDER as the tool results. The "name" field must EXACTLY match the Chinese name from the tool results (copy-paste it exactly). Format:
<enrichment>[{"name":"蟹之舞(人民公园店)","englishName":"Ministry of Crab","description":"Sri Lankan seafood famous for mud crab"},{"name":"虹桥天地","englishName":"Hongqiao Paradise","description":"Large shopping complex near Hongqiao station"},{"name":"豫园","englishName":"Yu Garden","description":"Historic garden dating back to Ming dynasty"}]</enrichment>
Then write your brief 1-2 sentence text after the closing tag. Rules:
- englishName: English translation, romanization, or established English name. Examples: 肯德基→KFC, 芭芭露莎→Barbarossa, 虹桥汇→Hongqiao Hub, 虹桥新天地购物中心→Hongqiao Xintiandi Shopping Center
- description: Max 10 words about the place — cuisine/specialty for restaurants, what it is for malls/attractions/etc.
- This enrichment block is MANDATORY. Never skip it. Never put it inside your text. Always output it first, then your text.

When navigating to a place you already have coordinates for (e.g., from a previous restaurant search), pass those coordinates directly to the navigation tool instead of re-geocoding the name. This avoids finding the wrong location when multiple places share the same name.

PHOTO TRANSLATION INSTRUCTIONS:
When the user sends you a photo, follow this exact response structure:

FIRST — Start your response with the direct translation. Format it clearly:

📝 Translation:
[Clean English translation of all visible text in the image]

If there are multiple text elements (like a menu with many items), organize them clearly — use the same layout/grouping as the original image where possible.

THEN — After the translation, add the concierge context under a divider:

💡 Context:
[Explain what this is, why it matters, and what the user should do]

Examples of good context:
- For a menu: recommend specific dishes, flag allergens or unusual ingredients, explain how to order, suggest what to say to the waiter
- For a sign/notice: explain what it means for the user — is this their metro stop? Is this a warning? Do they need to do anything?
- For an app screen or error message: explain what went wrong and how to fix it step by step
- For a receipt: break down what they paid for and whether the price seems normal
- For a medicine box or product: explain what it is, dosage if relevant, and whether it's what they might be looking for

Keep the translation section factual and complete. Put all opinions, recommendations, and cultural context in the Context section.

If the image is NOT Chinese text (e.g., a photo of a place, a person, food without text), still be helpful — describe what you see and offer relevant assistance. For example, a photo of a dish could trigger: 'This looks like 红烧肉 (hóngshāo ròu) — braised pork belly. It's one of the most popular dishes in Shanghai. If you want to order more, tell the waiter: 再来一份红烧肉 (zài lái yī fèn hóngshāo ròu).'

IMPORTANT: Always start generating immediately with the translation. Do not preamble with 'Let me take a look at this photo' or 'I can see you've shared an image' — just go straight into the translation.

You are currently in preview/demo mode. The user may or may not be physically in China. Be helpful regardless of their location.`;
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_navigation",
    description:
      "Get real-time navigation directions (metro/transit routes) to a destination in China. Use this whenever the user asks how to get somewhere, asks for directions, or mentions wanting to go to a place.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description:
            "The place the user wants to go to. Can be in English or Chinese.",
        },
        chineseName: {
          type: "string",
          description:
            "The Chinese name (汉字) of the destination. ALWAYS provide this for better Amap results. For example: 'The Bund' → '外滩', 'Yu Garden' → '豫园', 'Shanghai Tower' → '上海中心大厦', 'People's Square' → '人民广场'.",
        },
        city: {
          type: "string",
          description:
            "The Chinese city name to constrain the search. Use the city explicitly mentioned by the user if they specify one. Otherwise, use the user's current city from GPS. Use '' (empty string) for NATIONAL searches when the destination is in another city or province. DO NOT provide a city parameter if you don't know the city - omit it instead.",
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
            "Search strategy. 'nearby': search around user's GPS coordinates (for 'near me' queries). 'city': search within a specific city using city name (for 'restaurants in Beijing', 'things to do in Chengdu', etc.). Default: 'nearby'.",
        },
        keyword: {
          type: "string",
          description:
            "Optional search keyword to filter results. For example: 'hotpot', 'Italian', 'dumplings', 'coffee', 'pharmacy'. Translate the user's request to Chinese keywords for better Amap results — e.g., if user says 'hotpot' use '火锅', 'Italian' use '意大利餐', 'dumplings' use '饺子', 'coffee' use '咖啡', 'bubble tea' use '奶茶', 'pharmacy' use '药店', 'convenience store' use '便利店'.",
        },
        city: {
          type: "string",
          description:
            "Chinese city name for 'city' mode searches. Required when searchMode is 'city'. Examples: '北京', '上海', '成都', '吉林', '广州'. Use the Chinese name of the city the user is asking about.",
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

const DEFAULT_ORIGIN = "121.4737,31.2304"; // Fallback coordinates when GPS unavailable

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
    chineseName?: string;
    city?: string;
  },
  origin?: string,
  userCity?: string,
  navContext?: NavContext,
): Promise<{ result: NavigationData | null; error?: string }> {
  // Empty string means NATIONAL search (no city constraint)
  // If tool provides city, use it. Otherwise use userCity. If neither, use undefined.
  const city = input.city === "" ? undefined : input.city || userCity;
  const transitCity = city || userCity || "上海"; // Transit routes require a city
  const originCoords = origin || DEFAULT_ORIGIN;

  // If we have pre-resolved coordinates (e.g. from a restaurant card), skip geocoding
  if (navContext) {
    const [transit, walking] = await Promise.all([
      getTransitRoute(originCoords, navContext.destinationLocation, transitCity),
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

  const place = await resolveLocation(input.destination, input.chineseName, city, originCoords);
  if (!place) {
    return {
      result: null,
      error: `Could not find "${input.destination}". Try a more specific name or the Chinese name.`,
    };
  }

  const [transit, walking] = await Promise.all([
    getTransitRoute(originCoords, place.location, transitCity),
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
    // City-based search: uses /place/text with city name, ignores GPS
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
          input.keyword || "推荐",
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
    // Nearby search: uses /place/around with GPS coordinates
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
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
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

        // Stream text deltas as they arrive
        stream.on("text", (text) => {
          controller.enqueue(encoder.encode(sseEvent("text", text)));
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
          // Pure text response — already streamed, just close
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        // Tool use detected — notify client
        const tb = toolBlock as Anthropic.Messages.ToolUseBlock;
        const toolName = tb.name;

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
        let navigationData: NavigationData | undefined;
        let placesData: POIResult[] | undefined;

        if (toolName === "get_navigation") {
          const toolInput = tb.input as {
            destination: string;
            chineseName?: string;
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

          // Send the clean text
          if (fullResponse) {
            controller.enqueue(encoder.encode(sseEvent("text", fullResponse)));
          }
        } else {
          // For navigation and other tools, stream text normally
          followUpStream.on("text", (text) => {
            controller.enqueue(encoder.encode(sseEvent("text", text)));
          });
          await followUpStream.finalMessage();
        }

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
