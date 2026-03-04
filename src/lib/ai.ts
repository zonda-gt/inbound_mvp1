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
import {
  createChatSession,
  updateChatSession,
  logChatMessage,
  detectLanguage,
  hasToolIntent,
} from "@/lib/logging";
import {
  searchCuratedRestaurantsHybrid,
  toSummary,
  type CuratedRestaurant,
  type CuratedRestaurantSummary,
} from "@/lib/curated-restaurants";
import { embedQuery } from "@/lib/embedding";
import {
  searchCuratedAttractions,
  type AttractionSummary,
} from "@/lib/attractions";

function buildSystemPrompt(userCity?: string, isDemoMode?: boolean): string {
  let cityContext: string;
  if (isDemoMode) {
    cityContext = `The user is currently in DEMO MODE, exploring Shanghai (上海) as a preview. You DO have their GPS coordinates — they are set to central Shanghai (People's Square, 121.4737,31.2304). Treat these coordinates as real GPS for all tool calls. Use searchMode "nearby" for "near me" queries. NEVER say you don't have their location or ask what city they're in — you always know they are in 上海. On your FIRST reply only, briefly mention they're seeing Shanghai as a demo and the app will use their real location when they're in China (one short sentence). After that, respond normally as if they're in Shanghai.`;
  } else if (userCity) {
    cityContext = `The user is currently located in ${userCity}.`;
  } else {
    cityContext = "The user's location is unknown.";
  }

  return `You are HelloChina, a helpful travel assistant for foreign travelers visiting China. You specialize in helping people who don't speak Chinese navigate daily life in China.

Your core capabilities:
1. NAVIGATION: Give specific metro routes, walking directions, and practical transit advice for Chinese cities. Always include the Chinese name (汉字) of destinations so users can show it to taxi drivers.
2. RESTAURANT DISCOVERY: Recommend restaurants and street food. Include the Chinese name, price range in ¥, what to order, and practical tips like whether they accept WeChat Pay or have an English menu.
3. TRANSLATION: Provide Chinese phrases with pinyin pronunciation. Give contextual phrases, not just literal translations.
4. APP SETUP: Guide users through setting up Alipay, WeChat Pay, VPN, and other essential apps for foreigners in China.
5. CULTURAL TIPS: Help with cultural norms, tipping (don't tip in China), etiquette, and avoiding common foreigner mistakes.

CURRENT CONTEXT:
${cityContext}

PERSONALITY AND RESPONSE STYLE:
You are a bilingual friend who has lived in China for years, not a search engine. Every response should feel like advice from a knowledgeable local friend, not a list of results.

1. ALWAYS add context, not just names. When recommending a restaurant, explain what makes it special and what to order:
   - BAD: "Green Tea Restaurant - Modern Hangzhou chain, creative local dishes"
   - GOOD: "Green Tea Restaurant is one of Hangzhou's most popular chains — the locals queue for it. Order the 龙井虾仁 (lóngjǐng xiārén, stir-fried with real Dragon Well tea leaves) and the 东坡肉 (dōngpō ròu, braised pork belly that melts in your mouth). Go before 11:30am or after 1:30pm to avoid the lunch rush."

2. When listing restaurants, pick your TOP 3 and explain why, rather than listing 10 with no guidance. A friend doesn't give you 10 options — they say "go here, order this."

3. For every city, mention the SIGNATURE DISHES that any visitor should try, with pronunciation:
   - Shanghai: 小笼包 xiǎolóngbāo (soup dumplings), 红烧肉 hóngshāoròu (red braised pork), 生煎 shēngjiān (pan-fried buns)
   - Hangzhou: 西湖醋鱼 xīhú cùyú (West Lake vinegar fish), 龙井虾仁 lóngjǐng xiārén (Longjing shrimp), 东坡肉 dōngpō ròu (Dongpo pork)
   - Chengdu: 火锅 huǒguō (hotpot), 麻婆豆腐 mápó dòufu (mapo tofu), 担担面 dàndàn miàn (dan dan noodles)
   - Beijing: 北京烤鸭 běijīng kǎoyā (Peking duck), 炸酱面 zhájiàng miàn (fried sauce noodles), 涮羊肉 shuàn yángròu (mutton hotpot)
   Use this pattern for all major cities.

4. Include practical tips a friend would mention:
   - "This place doesn't take cards — make sure your Alipay is set up"
   - "Ask for 微辣 (wēilà, mild spice) if you can't handle Sichuan heat"
   - "The lunch set menu is half the price of dinner"
   - "Show the taxi driver this: [Chinese address]"

5. When translating, always explain the CONTEXT, not just the words:
   - BAD: "红烧肉 = Red braised meat"
   - GOOD: "红烧肉 (hóngshāoròu) — this is Shanghai's signature comfort food. Pork belly braised in soy sauce, sugar, and Shaoxing wine until it's melt-in-your-mouth tender. Rich, slightly sweet, and fatty in the best way. Definitely order this if you see it."

6. Tone: warm, confident, opinionated. Say "you should try this" not "you might consider this." A good friend has strong recommendations.

HONESTY ABOUT RESTAURANTS:
Only give specific dish recommendations and detailed context for restaurants you genuinely know about. For well-known chains and famous restaurants (e.g., Green Tea Restaurant, Haidilao, Din Tai Fung) and classic regional dishes (e.g., Dongpo pork in Hangzhou, Peking duck in Beijing), give confident, detailed recommendations.

For lesser-known restaurants returned by the search API that you don't recognize:
- Share what you can see from the data (rating, cuisine type, price range)
- Recommend the SIGNATURE DISHES OF THAT CITY that they likely serve based on cuisine type
- Say "I don't know this specific place, but it's rated well — ask the staff for their 招牌菜 (zhāopái cài, house specialty)"
Never invent specific details about what a particular restaurant is known for if you don't actually know.

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
3. If neither is available and the user hasn't specified a city, use 上海 (Shanghai) as the default city.
4. For NATIONAL searches (famous landmarks in other provinces, broad queries across China), set city to empty string '' to disable city filtering.

Examples:
- User is in 北京, asks 'take me to Gaoyou Road' → use 北京 (from GPS)
- User is in 北京, asks 'take me to Gaoyou Road Shanghai' → use 上海 (user specified)
- User is in 北京, asks 'find food near me' → use 北京 (from GPS)
- User has no GPS, asks 'restaurants in Chengdu' → use 成都 (user specified)
- User has no GPS, asks 'find food near me' → use 上海 (Shanghai) as default
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
- IMPORTANT: For Amap restaurant results, use the Chinese 'tag' field first (and 'type' as backup) to generate the one-line English context. Example: tag "火锅;川菜;聚会" → "Sichuan hot pot, good for groups."
- If 'tag' exists, do not ignore it. Convert it into natural English, concise and practical.
- This enrichment block is MANDATORY. Never skip it. Never put it inside your text. Always output it first, then your text.

FORMAT your text responses for readability:
- Use short paragraphs (2-3 sentences max per paragraph)
- Use **bold** for key names, place names, and important terms
- Use line breaks between distinct points
- For location recommendations, format each one clearly on its own line:
  **Jing'an Temple area** (静安寺) — Central location, good metro access, shopping nearby
  **The Bund area** (外滩) — Iconic waterfront, classic hotels, great night views
  **French Concession** (法租界) — Leafy streets, cafes, boutique shops
- Never merge two ideas into one sentence without punctuation
- Keep total response length reasonable — max 150 words for simple questions, max 250 words for complex travel planning questions
- Always end with ONE clear follow-up question or offer, not multiple questions in a row

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

CURATED RESTAURANT GUIDE:
For all food-related queries, always check the curated restaurant database first — these restaurants have detailed profiles with photos, signature dish recommendations, ordering guides, and insider tips specifically prepared for foreign travelers. Show curated results whenever available.

Determine the user's intent:
DISCOVERY (recommend, suggest, best, where should I, specific cuisine/vibe/budget) → Search curated by filters. Fall back to Amap city search only if no curated match.
PROXIMITY (near me, nearby, close, hungry) → Search curated within 2km of user. Fall back to Amap nearby search only if no curated restaurant is within that radius.
SPECIFIC (asking about a named restaurant, what to order somewhere) → Search curated by name. If not in database, offer Amap basic info.

When showing curated results, sound like a knowledgeable friend — lead with the foreigner hook, mention specific dishes, give practical advice. When falling back to Amap results, be transparent: these are basic listings without the detailed reviews and tips.
Never call both curated and Amap for the same query. Pick one path and commit.

CURATED ATTRACTION GUIDE:
For questions about things to do, activities, experiences, shows, or attractions, use the search_curated_attractions tool. These are hand-picked experiences with detailed profiles, insider tips, and practical guides for foreigners.
When showing curated attraction results, mention the hook, what makes it special, and practical tips. The attraction cards will display automatically — keep your text response to 2-3 sentences.
If the user asks about a specific attraction that exists in our database, the detailed page link will be shown automatically in the card.`;
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
      required: ["destination", "chineseName"],
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
  {
    name: "search_curated_restaurants",
    description:
      "Search HelloChina's curated restaurant guide — hand-picked Shanghai restaurants with English descriptions, signature dish recommendations with foreigner-friendliness ratings, ordering guides, and practical tips. Use this FIRST for all food queries, then only fall back to search_nearby_places if curated results are empty.",
    input_schema: {
      type: "object" as const,
      properties: {
        cuisine: {
          type: "string",
          description:
            "Filter by cuisine type (partial match, case insensitive). E.g., 'Sichuan', 'hot pot', 'Japanese', 'Cantonese', 'dumplings'.",
        },
        max_price: {
          type: "number",
          description:
            "Maximum price per person in CNY. Only return restaurants at or below this price.",
        },
        best_for: {
          type: "string",
          description:
            "Filter by occasion/tag. E.g., 'couples', 'groups', 'families with kids', 'solo', 'business', 'budget-friendly'.",
        },
        near_lat: {
          type: "number",
          description:
            "User's latitude for proximity sorting.",
        },
        near_lng: {
          type: "number",
          description:
            "User's longitude for proximity sorting.",
        },
        max_distance_km: {
          type: "number",
          description:
            "Maximum distance from near_lat/near_lng in kilometers. Use 2 for 'near me' queries, 5 for neighborhood, 50 for city-wide.",
        },
        city: {
          type: "string",
          description:
            "Optional city filter for curated restaurants. Use the city explicitly requested by the user when present.",
        },
        query: {
          type: "string",
          description:
            "Free text search across restaurant names, cuisine, descriptions, and foreigner hooks.",
        },
      },
      required: [],
    },
  },
  {
    name: "search_curated_attractions",
    description:
      "Search HelloChina's curated attraction guide — hand-picked Shanghai activities, shows, and experiences with insider tips for foreign travelers. Use this when the user asks about things to do, activities, experiences, shows, or attractions (NOT restaurants).",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Optional search keyword to filter attractions. E.g., 'theater', 'ocean park', 'sports', 'music'.",
        },
      },
      required: [],
    },
  },
];

const DEFAULT_ORIGIN = "121.4737,31.2304"; // Fallback coordinates when GPS unavailable
const PROXIMITY_MAX_DISTANCE_KM = 2;
const NEIGHBORHOOD_MAX_DISTANCE_KM = 5;
const CITY_WIDE_MAX_DISTANCE_KM = 50;
const PROXIMITY_RADIUS_METERS = PROXIMITY_MAX_DISTANCE_KM * 1000;
const MAX_PLACE_RESULTS = 8;
const CURATED_MATCH_LIMIT = 8;
const CURATED_SIMILARITY_THRESHOLD = 0.3;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    // APP_ANTHROPIC_API_KEY avoids conflict with Claude Code which sets ANTHROPIC_API_KEY=""
    _client = new Anthropic({
      apiKey: process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

export type ChatResponse = {
  text: string;
  navigationData?: NavigationData;
  placesData?: POIResult[];
  curatedRestaurantsData?: CuratedRestaurant[];
};

export type { CuratedRestaurant } from "@/lib/curated-restaurants";

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

type FoodIntent = "discovery" | "proximity" | "specific";

type CuratedSearchInput = {
  // Legacy fields from tool schema are accepted for backward compatibility.
  cuisine?: string;
  best_for?: string;
  near_lat?: number;
  near_lng?: number;
  max_distance_km?: number;
  max_price?: number;
  query?: string;
  semantic_query?: string;
  filter_category?: "restaurant" | "bar" | null;
  match_limit?: number;
  similarity_threshold?: number;
  intent?: FoodIntent;
  city?: string;
  user_message?: string;
};

type PlacesSearchInput = {
  type: "restaurant";
  searchMode: "nearby" | "city";
  keyword?: string;
  city?: string;
  location?: string;
  radius?: number;
};

type FoodRoutingPlan = {
  intent: FoodIntent;
  curatedInput: CuratedSearchInput;
  fallbackPlacesInput?: PlacesSearchInput;
  specificName?: string;
};

function parseOrigin(origin?: string): { lng: number; lat: number } | null {
  if (!origin) return null;
  const [lng, lat] = origin.split(",").map(Number);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return { lng, lat };
}

const CITY_ALIASES: Array<{ cn: string; aliases: string[] }> = [
  { cn: "上海", aliases: ["shanghai", "shang hai", "上海", "上海市"] },
  { cn: "北京", aliases: ["beijing", "bei jing", "北京", "北京市"] },
  { cn: "乌鲁木齐", aliases: ["urumqi", "wu lu mu qi", "wulumuqi", "乌鲁木齐", "乌鲁木齐市"] },
  { cn: "沈阳", aliases: ["shenyang", "shen yang", "沈阳", "沈阳市"] },
  { cn: "抚顺", aliases: ["fushun", "fu shun", "抚顺", "抚顺市"] },
  { cn: "广州", aliases: ["guangzhou", "guang zhou", "canton", "广州", "广州市"] },
  { cn: "深圳", aliases: ["shenzhen", "shen zhen", "深圳", "深圳市"] },
  { cn: "成都", aliases: ["chengdu", "cheng du", "成都", "成都市"] },
  { cn: "杭州", aliases: ["hangzhou", "hang zhou", "杭州", "杭州市"] },
  { cn: "重庆", aliases: ["chongqing", "chong qing", "重庆", "重庆市"] },
  { cn: "天津", aliases: ["tianjin", "tian jin", "天津", "天津市"] },
  { cn: "西安", aliases: ["xian", "xi'an", "xi an", "西安", "西安市"] },
  { cn: "苏州", aliases: ["suzhou", "su zhou", "苏州", "苏州市"] },
  { cn: "南京", aliases: ["nanjing", "nan jing", "南京", "南京市"] },
  { cn: "武汉", aliases: ["wuhan", "wu han", "武汉", "武汉市"] },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCityName(city?: string): string {
  if (!city) return "";
  return city
    .toLowerCase()
    .replace(/市$/u, "")
    .replace(/\bcity\b/g, "")
    .replace(/['’\s_-]/g, "")
    .trim();
}

function toAmapCity(city?: string): string | undefined {
  const normalized = normalizeCityName(city);
  if (!normalized) return undefined;
  for (const entry of CITY_ALIASES) {
    if (normalizeCityName(entry.cn) === normalized) return entry.cn;
    if (entry.aliases.some((alias) => normalizeCityName(alias) === normalized)) return entry.cn;
  }
  return city;
}

function findCityMentionInText(text: string): string | undefined {
  if (!text) return undefined;
  for (const entry of CITY_ALIASES) {
    for (const alias of entry.aliases) {
      if (/[\u4e00-\u9fff]/.test(alias)) {
        if (text.includes(alias)) return entry.cn;
      } else {
        const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
        if (pattern.test(text)) return entry.cn;
      }
    }
  }
  return undefined;
}

function inferDominantCityFromUserMessages(
  messageHistory: Array<{ role: string; content: string }>,
): string | undefined {
  const counts = new Map<string, number>();
  const recentUserMessages = messageHistory
    .filter((m) => m.role === "user")
    .slice(-8);

  for (const m of recentUserMessages) {
    const city = findCityMentionInText(m.content);
    if (!city) continue;
    counts.set(city, (counts.get(city) || 0) + 1);
  }

  let bestCity: string | undefined;
  let bestCount = 0;
  for (const [city, count] of counts) {
    if (count > bestCount) {
      bestCity = city;
      bestCount = count;
    }
  }
  return bestCity;
}

function stripInternalRetryText(text: string): string {
  if (!text) return "";
  const patterns = [
    /\blet me (?:try|search|check|get|look up|find)[^.!?\n:]*[:.!?]?\s*/gim,
    /\bi(?:'|’)ll (?:try|search|check|get|look up|find)[^.!?\n:]*[:.!?]?\s*/gim,
    /\btrying [^.!?\n:]*[:.!?]?\s*/gim,
    /\bone moment[^.!?\n:]*[:.!?]?\s*/gim,
  ];

  let cleaned = text;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

function isNavigationPlaceholderText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();

  const placeholderStarts = [
    /^i can help\b/i,
    /^sure\b/i,
    /^okay\b/i,
    /^alright\b/i,
  ];
  const internalPhrases = [
    /search for .* first/i,
    /find .* exact location/i,
    /navigation details for you/i,
    /let me/i,
    /i(?:'|’)ll try/i,
  ];

  if (placeholderStarts.some((p) => p.test(trimmed))) return true;
  if (internalPhrases.some((p) => p.test(lower))) return true;
  return false;
}

function isNavigationFailureGuidance(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("couldn't find") ||
    lower.includes("could not find") ||
    lower.includes("can't find") ||
    lower.includes("cannot find") ||
    lower.includes("chinese name") ||
    lower.includes("address")
  );
}

function buildNoOutputFallback(userMessage: string): string {
  if (isNavigationQuery(userMessage)) {
    return "I couldn't find directions to that location. Could you share the Chinese name or address? You can also try typing it in Chinese characters.";
  }
  return "I couldn't generate a response just now. Please try rephrasing your question.";
}

async function inferNavigationTargetCity(
  messageHistory: Array<{ role: string; content: string }>,
  userCity?: string,
  isDemoMode?: boolean,
): Promise<string | undefined> {
  const fallbackCity = toAmapCity(userCity) || (isDemoMode ? "上海" : undefined);
  const latestUserMessage =
    [...messageHistory].reverse().find((m) => m.role === "user")?.content || "";

  const explicitLatestCity = findCityMentionInText(latestUserMessage);
  if (explicitLatestCity) return explicitLatestCity;

  const dominantCity = inferDominantCityFromUserMessages(messageHistory);
  if (dominantCity) return dominantCity;

  const recentContext = messageHistory
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 140,
      system:
        `Extract the target city for navigation.\n` +
        `Return ONLY compact JSON: {"target_city_cn": string|null}.\n` +
        `Rules:\n` +
        `- Use Chinese city name (e.g. 北京, 上海, 乌鲁木齐).\n` +
        `- Prioritize explicit city in the latest user query.\n` +
        `- If latest query has no city, infer from recent conversation context.\n` +
        `- If user has been consistently asking about one city, use that city.\n` +
        `- If uncertain, return null.\n`,
      messages: [
        {
          role: "user",
          content:
            `Latest user query:\n${latestUserMessage}\n\n` +
            `Recent conversation:\n${recentContext}\n\n` +
            `Current location city fallback: ${fallbackCity || "null"}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();

    const parsed = tryParseJson<{ target_city_cn?: string | null }>(text);
    const inferred = toAmapCity(parsed?.target_city_cn || undefined);
    return inferred || fallbackCity;
  } catch (error) {
    console.warn("[NavigationRouting] AI city inference failed:", error);
    return fallbackCity;
  }
}

function stripCityTokensFromQuery(query: string | undefined, city?: string): string | undefined {
  if (!query) return undefined;
  const cityEntry = CITY_ALIASES.find((entry) => entry.cn === city);
  if (!cityEntry) return query;

  let cleaned = query;
  for (const alias of cityEntry.aliases) {
    if (/[\u4e00-\u9fff]/.test(alias)) {
      cleaned = cleaned.split(alias).join(" ");
    } else {
      cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi"), " ");
    }
  }

  const normalized = cleaned.replace(/\s+/g, " ").trim();
  return normalized.length >= 3 ? normalized : undefined;
}

function tryParseJson<T>(text: string): T | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try next parse candidate.
    }
  }

  return null;
}

async function inferFoodTargetCity(
  userMessage: string,
  userCity?: string,
  isDemoMode?: boolean,
): Promise<string | undefined> {
  const fallbackCity = toAmapCity(userCity) || (isDemoMode ? "上海" : undefined);

  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system:
        `Extract the target city for restaurant search.\n` +
        `Return ONLY compact JSON: {"target_city_cn": string|null}.\n` +
        `Rules:\n` +
        `- Use Chinese city name (e.g. 北京, 上海, 成都).\n` +
        `- If user asks near me/nearby/around here, use current city: ${fallbackCity || "null"}.\n` +
        `- If user mentions another city (planning/discovery there), use that city.\n` +
        `- If city is unclear, return null.\n` +
        `- Prefer destination city over dish-origin words.`,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();

    const parsed = tryParseJson<{ target_city_cn?: string | null }>(text);
    const inferred = toAmapCity(parsed?.target_city_cn || undefined);
    return inferred || fallbackCity;
  } catch (error) {
    console.warn("[FoodRouting] AI city inference failed:", error);
    return fallbackCity;
  }
}

function isNavigationQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const navKeywords = [
    "how do i get",
    "how to get",
    "directions",
    "navigate",
    "route",
    "travel",
    "travelling",
    "public transit",
    "public transport",
    "without a car",
    "metro",
    "subway",
    "train",
    "bus",
    "taxi",
    "go to",
    "take me to",
  ];
  return navKeywords.some((k) => lower.includes(k));
}

function containsFoodKeywords(message: string): boolean {
  const lower = message.toLowerCase();
  const foodKeywords = [
    "restaurant",
    "restaurants",
    "food",
    "eat",
    "dinner",
    "lunch",
    "breakfast",
    "brunch",
    "snack",
    "hotpot",
    "hot pot",
    "cuisine",
    "cafe",
    "coffee",
    "dessert",
    "bbq",
    "barbecue",
    "sushi",
    "dumpling",
    "noodle",
    "bar",
    "bars",
    "cocktail",
    "cocktails",
    "drink",
    "drinks",
    "beer",
    "wine",
    "pub",
    "speakeasy",
    "nightlife",
    "where should i eat",
    "where to eat",
  ];
  return foodKeywords.some((k) => lower.includes(k));
}

function extractSpecificRestaurantName(message: string): string | null {
  const patterns = [
    /what(?:\s+should\s+i)?\s+order\s+at\s+([^?.!\n]+)/i,
    /what\s+to\s+order\s+at\s+([^?.!\n]+)/i,
    /tell\s+me\s+about\s+([^?.!\n]+)/i,
    /do\s+you\s+know\s+([^?.!\n]+)/i,
    /is\s+([^?.!\n]+?)\s+(?:good|worth it|worth going)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/\b(restaurant|resto|cafe|hot pot|hotpot|place)\b/gi, "")
        .trim();
    }
  }

  return null;
}

function detectFoodIntent(message: string): FoodIntent | null {
  if (isNavigationQuery(message)) return null;

  const lower = message.toLowerCase();
  const hasFood = containsFoodKeywords(message);
  const specificName = extractSpecificRestaurantName(message);

  if (!hasFood && !specificName) return null;

  const proximityKeywords = [
    "near me",
    "nearby",
    "close by",
    "close to me",
    "around here",
    "what's close",
    "whats close",
    "hungry now",
    "walking distance",
  ];
  if (proximityKeywords.some((k) => lower.includes(k))) return "proximity";

  const specificKeywords = [
    "what should i order at",
    "what to order at",
    "tell me about",
    "do you know",
  ];
  if (specificName || specificKeywords.some((k) => lower.includes(k))) return "specific";

  return "discovery";
}

function inferCategoryFilter(message: string): "restaurant" | "bar" | null {
  const lower = message.toLowerCase();
  if (/\b(bar|bars|cocktail|cocktails|drink|drinks|beer|wine|pub|speakeasy|nightlife)\b/.test(lower)) {
    return "bar";
  }
  if (containsFoodKeywords(message)) return "restaurant";
  return null;
}

function isNeighborhoodFoodQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const proximityKeywords = [
    "near me",
    "nearby",
    "close by",
    "close to me",
    "around here",
    "what's close",
    "whats close",
    "hungry now",
    "walking distance",
  ];
  if (proximityKeywords.some((k) => lower.includes(k))) return false;

  return (
    /\b(near|around|close to|close by|by)\b/.test(lower) ||
    /附近|周边|周圍/.test(message)
  );
}

function extractBestFor(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (/(romantic|date|couple)/i.test(lower)) return "couples";
  if (/(family|kids|children)/i.test(lower)) return "families with kids";
  if (/(group|friends|party)/i.test(lower)) return "groups";
  if (/(business|client|meeting)/i.test(lower)) return "business";
  if (/(solo|alone)/i.test(lower)) return "solo";
  if (/(budget|cheap|affordable)/i.test(lower)) return "budget-friendly";
  return undefined;
}

function extractMaxPrice(message: string): number | undefined {
  const patterns = [
    /(?:under|below|less than|max|at most)\s*¥?\s*(\d{2,4})/i,
    /¥\s*(\d{2,4})\s*(?:or less|max|under)/i,
    /(\d{2,4})\s*(?:rmb|yuan)\b/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (!Number.isNaN(value)) return value;
    }
  }
  return undefined;
}

function extractDietaryAndVibeHints(message: string): string[] {
  const lower = message.toLowerCase();
  const hints: string[] = [];

  if (/(not spicy|non spicy|no spice|mild spice|less spicy|low spice)/.test(lower)) {
    hints.push("not spicy");
  } else if (/\bspicy\b/.test(lower)) {
    hints.push("spicy");
  }

  if (/(vegetarian|vegan|plant based|plant-based)/.test(lower)) hints.push("vegetarian");
  if (/\bhalal\b/.test(lower)) hints.push("halal");
  if (/(romantic|date night|date)/.test(lower)) hints.push("romantic date night");
  if (/(family|kids|children)/.test(lower)) hints.push("family friendly");
  if (/(business|client|meeting)/.test(lower)) hints.push("business dinner");
  if (/(solo|alone)/.test(lower)) hints.push("solo dining");
  if (/(budget|cheap|affordable)/.test(lower)) hints.push("budget friendly");
  if (/(fine dining|upscale|high end|high-end|luxury)/.test(lower)) hints.push("fine dining");

  return Array.from(new Set(hints));
}

function deriveFallbackKeyword(message: string, specificName?: string, semanticQuery?: string): string {
  if (specificName) return specificName;
  if (semanticQuery) return semanticQuery;
  const trimmed = message
    .replace(/\b(near me|nearby|close by|around here|what's close|whats close|hungry now)\b/gi, "")
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || "餐厅";
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

function isFuzzyStopword(token: string, stopwords: Set<string>): boolean {
  if (stopwords.has(token)) return true;

  // Common typo-prone generic words that should not become curated filters.
  const fuzzyStopwordTargets = [
    "recommend",
    "recommendation",
    "suggest",
    "best",
    "find",
    "nearby",
    "shanghai",
  ];

  for (const target of fuzzyStopwordTargets) {
    const maxDistance = target.length <= 6 ? 1 : 2;
    if (Math.abs(token.length - target.length) > maxDistance) continue;
    if (levenshteinDistance(token, target) <= maxDistance) return true;
  }

  return false;
}

function extractFreeTextFoodFilter(message: string): string | undefined {
  const stopwords = new Set([
    "recommend",
    "recommendation",
    "recommendations",
    "suggest",
    "suggestion",
    "suggestions",
    "best",
    "find",
    "spot",
    "spots",
    "place",
    "places",
    "where",
    "should",
    "i",
    "me",
    "my",
    "in",
    "at",
    "for",
    "to",
    "near",
    "nearby",
    "close",
    "around",
    "here",
    "hungry",
    "now",
    "looking",
    "want",
    "with",
    "tonight",
    "today",
    "under",
    "below",
    "less",
    "than",
    "max",
    "at",
    "most",
    "price",
    "cost",
    "yuan",
    "rmb",
    "cny",
    "budget",
    "within",
    "km",
    "kilometer",
    "kilometers",
    "meter",
    "meters",
    "shanghai",
    "city",
    "a",
    "an",
    "the",
    "please",
  ]);

  const tokens = message
    .toLowerCase()
    .replace(/¥\s*\d{1,4}/g, " ")
    .replace(/\b\d{1,4}\s*(rmb|yuan|cny|块|元)?\b/g, " ")
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !isFuzzyStopword(t, stopwords));

  if (tokens.length === 0) return undefined;
  const query = tokens.join(" ").trim();
  return query.length >= 3 ? query : undefined;
}

function buildSemanticFoodSearchString(
  message: string,
  specificName?: string,
  cityToken?: string,
): string {
  if (specificName) return specificName.trim();

  const baseQuery = stripCityTokensFromQuery(
    extractFreeTextFoodFilter(message),
    cityToken,
  );
  const hints = extractDietaryAndVibeHints(message);
  const combined = [baseQuery, ...hints]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!combined) return "restaurant food";

  const tokenCount = combined.split(/\s+/).filter(Boolean).length;
  if (tokenCount === 1) {
    const lower = combined.toLowerCase();
    if (lower === "restaurant" || lower === "food") return "restaurant food";
    return `${combined} restaurant food`;
  }

  return combined;
}

function buildFoodRoutingPlan(
  userMessage: string,
  origin?: string,
  userCity?: string,
  targetCity?: string,
): FoodRoutingPlan | null {
  const intent = detectFoodIntent(userMessage);
  if (!intent) return null;

  const effectiveTargetCity = toAmapCity(targetCity || userCity);
  const max_price = extractMaxPrice(userMessage);
  const best_for = extractBestFor(userMessage);
  const specificName = intent === "specific" ? extractSpecificRestaurantName(userMessage) || undefined : undefined;
  const parsedOrigin = parseOrigin(origin);
  const categoryFilter = inferCategoryFilter(userMessage);
  const isNeighborhood = intent !== "proximity" && isNeighborhoodFoodQuery(userMessage);
  const distanceKm =
    intent === "proximity"
      ? PROXIMITY_MAX_DISTANCE_KM
      : isNeighborhood
        ? NEIGHBORHOOD_MAX_DISTANCE_KM
        : CITY_WIDE_MAX_DISTANCE_KM;
  const semanticQueryBase = buildSemanticFoodSearchString(
    userMessage,
    specificName,
    effectiveTargetCity,
  );
  const semanticQuery = [semanticQueryBase, best_for]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();
  const fallbackKeyword = deriveFallbackKeyword(
    userMessage,
    specificName,
    semanticQuery,
  );

  const curatedInput: CuratedSearchInput = {
    query: specificName,
    semantic_query: semanticQuery,
    filter_category: categoryFilter,
    max_price,
    match_limit: CURATED_MATCH_LIMIT,
    similarity_threshold: CURATED_SIMILARITY_THRESHOLD,
    max_distance_km: distanceKm,
    city: effectiveTargetCity,
    intent,
    user_message: userMessage,
    // Backward-compatible tags for LLM tool inputs.
    best_for,
  };

  if (parsedOrigin && (intent === "proximity" || isNeighborhood)) {
    curatedInput.near_lat = parsedOrigin.lat;
    curatedInput.near_lng = parsedOrigin.lng;
  }

  if (intent === "proximity") {
    return {
      intent,
      curatedInput,
      fallbackPlacesInput: {
        type: "restaurant",
        searchMode: "nearby",
        location: origin,
        radius: PROXIMITY_RADIUS_METERS,
        keyword: fallbackKeyword,
      },
    };
  }

  if (intent === "specific") {
    curatedInput.query = specificName || userMessage;
    return {
      intent,
      specificName,
      curatedInput,
    };
  }

  return {
    intent: "discovery",
    curatedInput,
    fallbackPlacesInput: {
      type: "restaurant",
      searchMode: "city",
      city: effectiveTargetCity || "上海",
      keyword: fallbackKeyword,
    },
  };
}

async function generateTextOnlyResponse(
  messages: Anthropic.Messages.MessageParam[],
  userCity?: string,
  isDemoMode?: boolean,
  extraSystemInstruction?: string,
): Promise<string> {
  const stream = getClient().messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `${buildSystemPrompt(userCity, isDemoMode)}${
      extraSystemInstruction ? `\n\n${extraSystemInstruction}` : ""
    }`,
    messages,
  });

  let text = "";
  stream.on("text", (chunk) => {
    text += chunk;
  });
  await stream.finalMessage();
  return text;
}

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

function applyNavigationCityOverride(
  input: { destination: string; chineseName?: string; city?: string },
  userMessage: string,
  inferredNavigationCity?: string,
): { destination: string; chineseName?: string; city?: string } {
  const inferredCity = toAmapCity(inferredNavigationCity);
  if (!inferredCity) return input;

  const toolCity = toAmapCity(input.city);
  const explicitCity = findCityMentionInText(userMessage);

  // Keep explicit city from latest user message.
  if (explicitCity && toolCity && toolCity === explicitCity) return input;
  if (explicitCity && !toolCity) return { ...input, city: explicitCity };

  // If model omitted city, inject inferred conversation city.
  if (!toolCity) {
    return { ...input, city: inferredCity };
  }

  // Override Shanghai default when conversation context clearly points elsewhere.
  if (toolCity === "上海" && inferredCity !== "上海" && !explicitCity) {
    return { ...input, city: inferredCity };
  }

  return input;
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

  const cappedResults =
    input.type === "restaurant"
      ? results.slice(0, MAX_PLACE_RESULTS)
      : results;

  return { results: cappedResults };
}

async function executeCuratedSearch(
  input: CuratedSearchInput,
): Promise<{
  summaries: CuratedRestaurantSummary[];
  slugs: string[];
  error?: string;
}> {
  const semanticQuery = [
    input.semantic_query,
    input.query,
    input.cuisine,
    input.best_for,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim() || "restaurant food";

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(semanticQuery);
  } catch (error) {
    console.error("[CuratedHybrid] Failed to embed query:", error);
    return {
      summaries: [],
      slugs: [],
      error:
        "I couldn't run curated semantic matching right now. I can still search nearby Amap listings.",
    };
  }

  const curatedResult = await searchCuratedRestaurantsHybrid({
    query_embedding: queryEmbedding,
    filter_category:
      input.filter_category ??
      inferCategoryFilter(input.user_message || semanticQuery) ??
      null,
    max_price: input.max_price,
    user_lat: input.near_lat,
    user_lng: input.near_lng,
    max_distance_km: input.max_distance_km ?? CITY_WIDE_MAX_DISTANCE_KM,
    match_limit: input.match_limit ?? CURATED_MATCH_LIMIT,
    similarity_threshold:
      input.similarity_threshold ?? CURATED_SIMILARITY_THRESHOLD,
    city: input.city,
  });

  if (curatedResult.error) {
    return {
      summaries: [],
      slugs: [],
      error: curatedResult.error,
    };
  }

  if (curatedResult.results.length === 0) {
    return {
      summaries: [],
      slugs: [],
      error:
        "I don't have curated picks matching that yet.",
    };
  }

  return {
    summaries: curatedResult.results.map(toSummary),
    slugs: curatedResult.results.map((r) => r.slug),
  };
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
  isDemoMode?: boolean,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Collect DB write promises so we can await them before closing the stream
        const dbWrites: Promise<unknown>[] = [];

        // Track request start time for response_time_ms
        const startTime = Date.now();

        // Get the user's latest message
        const userMessage = messages[messages.length - 1]?.content || "";
        const isNavigationIntent =
          !image && !navContext && isNavigationQuery(userMessage);
        const inferredNavigationCity = isNavigationIntent
          ? await inferNavigationTargetCity(messages, userCity, isDemoMode)
          : undefined;
        const foodIntent = detectFoodIntent(userMessage);
        const inferredTargetCity =
          !image && !navContext && foodIntent
            ? await inferFoodTargetCity(userMessage, userCity, isDemoMode)
            : undefined;
        const effectiveCity =
          inferredTargetCity ||
          inferredNavigationCity ||
          toAmapCity(userCity) ||
          "上海";
        const promptCity = inferredNavigationCity || userCity;
        let emittedUserText = false;
        let emittedToolData = false;
        const foodRoutingPlan =
          !image && !navContext
            ? buildFoodRoutingPlan(userMessage, origin, userCity, inferredTargetCity)
            : null;

        // Create or update session
        let activeSessionId = sessionId;
        if (anonymousUserId && !sessionId) {
          // Determine tracking city based on user scenario
          let trackingCity: string | null;
          if (isDemoMode) {
            if (gpsPermissionStatus === "granted") {
              trackingCity = "overseas";
            } else if (gpsPermissionStatus === "denied") {
              trackingCity = "denied";
            } else if (gpsPermissionStatus === "dismissed") {
              trackingCity = "dismissed";
            } else {
              trackingCity = "timeout";
            }
          } else {
            trackingCity = detectedCity || null;
          }

          // First message - create new session (awaited so we get the ID)
          console.log("[Supabase] Creating new session for user:", anonymousUserId, "city:", trackingCity);
          const newSessionId = await createChatSession({
            anonymous_user_id: anonymousUserId,
            referral_source: referralSource,
            device_type: deviceType || "desktop",
            user_city: trackingCity,
            gps_permission_status: gpsPermissionStatus,
            entry_page: entryPage || "/chat",
            first_message: userMessage,
            message_count: 1,
            is_demo_mode: isDemoMode || false,
          });

          if (newSessionId) {
            activeSessionId = newSessionId;
            console.log("[Supabase] Session created, sending session_created event:", newSessionId);
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

        // Deterministic routing for food queries:
        // always curated first, then intent-aware fallback only if curated is empty.
        if (foodRoutingPlan) {
          let fullResponseText = "";
          let toolName: string | undefined = "search_curated_restaurants";
          let placesData: POIResult[] | undefined;

          controller.enqueue(
            encoder.encode(
              sseEvent(
                "tool_start",
                JSON.stringify({ tool: "search_curated_restaurants", label: "Checking curated restaurants..." }),
              ),
            ),
          );

          const curatedResult = await executeCuratedSearch(foodRoutingPlan.curatedInput);
          const curatedToolResult = JSON.stringify({
            results: curatedResult.summaries,
            error: curatedResult.error,
          });
          const curatedSlugs =
            curatedResult.slugs.length > 0 ? curatedResult.slugs : undefined;

          if (curatedSlugs) {
            controller.enqueue(
              encoder.encode(
                sseEvent(
                  "tool_data",
                  JSON.stringify({ curatedRestaurantSlugs: curatedSlugs }),
                ),
              ),
            );
            emittedToolData = true;
          }

          let responseText = "";

          if (curatedSlugs) {
            responseText = await generateTextOnlyResponse(
              [
                ...apiMessages,
                {
                  role: "user" as const,
                  content:
                    `Curated restaurant search has already been executed by backend routing.` +
                    ` Intent: ${foodRoutingPlan.intent}.` +
                    ` The curated cards are already displayed to the user.` +
                    ` Use only these curated summaries:\n${curatedToolResult}`,
                },
              ],
              promptCity,
              isDemoMode,
              "Food routing is already resolved. Do not call tools. Do not suggest or trigger Amap fallback when curated results exist. Keep the response concise and practical.",
            );
          } else if (foodRoutingPlan.intent === "specific") {
            responseText =
              "I don't have a detailed profile for this restaurant yet. I can search Amap for basic info (address, rating, and opening hours) if you want.";
          } else if (foodRoutingPlan.fallbackPlacesInput) {
            toolName = "search_nearby_places";
            const fallbackMode = foodRoutingPlan.fallbackPlacesInput.searchMode;

            controller.enqueue(
              encoder.encode(
                sseEvent(
                  "tool_start",
                  JSON.stringify({
                    tool: "search_nearby_places",
                    label:
                      fallbackMode === "nearby"
                        ? "Searching restaurants nearby..."
                        : "Searching restaurants in city...",
                  }),
                ),
              ),
            );

            const fallbackResult = await executePlacesSearch(
              foodRoutingPlan.fallbackPlacesInput,
              origin,
            );

            if (fallbackResult.results.length > 0) {
              placesData = fallbackResult.results;
              controller.enqueue(
                encoder.encode(
                  sseEvent("tool_data", JSON.stringify({ placesData })),
                ),
              );
              emittedToolData = true;

              let placesText = await generateTextOnlyResponse(
                [
                  ...apiMessages,
                  {
                    role: "user" as const,
                    content:
                      `Curated restaurant search returned zero results for this ${foodRoutingPlan.intent} food query.` +
                      ` We are now showing Amap fallback listings only.` +
                      ` Start the text response with: "I don't have curated picks matching that, but here are some nearby options."` +
                      ` In <enrichment>, derive each restaurant description from Amap tag/type fields when available.` +
                      ` Be transparent these are basic listings without curated deep tips.` +
                      ` Start with <enrichment> JSON block for every place in order, then 1-2 sentence text.\n\n` +
                      `Results: ${JSON.stringify(fallbackResult)}`,
                  },
                ],
                promptCity,
                isDemoMode,
                "Do not call tools. The response must begin with <enrichment> JSON for place cards.",
              );

              const enrichMatch = placesText.match(
                /<enrichment>([\s\S]*?)<\/enrichment>/,
              );
              if (enrichMatch) {
                try {
                  const enrichment = JSON.parse(enrichMatch[1]);
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("places_update", JSON.stringify(enrichment)),
                    ),
                  );
                } catch (error) {
                  console.error("Failed to parse enrichment:", error);
                }
                placesText = placesText
                  .replace(/<enrichment>[\s\S]*?<\/enrichment>/, "")
                  .trim();
              }

              responseText = placesText;
            } else {
              responseText =
                fallbackMode === "nearby"
                  ? `I couldn't find curated picks within ${PROXIMITY_MAX_DISTANCE_KM} km, and there are no strong nearby Amap listings right now. Try widening the area or adding a cuisine keyword.`
                  : "I couldn't find curated matches for that request, and Amap city listings were also limited. Try broadening cuisine, vibe, or budget constraints.";
            }
          }

          if (responseText) {
            fullResponseText += responseText;
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(responseText))),
            );
            if (responseText.trim().length > 0) emittedUserText = true;
          }

          if (!emittedUserText && !emittedToolData) {
            const fallbackText = buildNoOutputFallback(userMessage);
            fullResponseText += fallbackText;
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(fallbackText))),
            );
            emittedUserText = true;
          }

          if (activeSessionId) {
            const responseTime = Date.now() - startTime;
            const toolsCalled = toolName ? [toolName] : undefined;
            const toolSuccess =
              toolName === "search_curated_restaurants"
                ? curatedSlugs !== undefined
                : placesData !== undefined;

            const assistantMsgId = await logChatMessage({
              session_id: activeSessionId,
              role: "assistant",
              content: fullResponseText,
              tools_called: toolsCalled,
              tool_success: toolSuccess,
              is_fallback: false,
              response_time_ms: responseTime,
            });

            if (assistantMsgId) {
              controller.enqueue(
                encoder.encode(
                  sseEvent(
                    "message_id",
                    JSON.stringify({ messageId: assistantMsgId }),
                  ),
                ),
              );
            }
          }

          await Promise.allSettled(dbWrites);
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        // First call — streaming
        const stream = getClient().messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: buildSystemPrompt(promptCity, isDemoMode),
          tools: TOOLS,
          messages: apiMessages,
        });

        // Collect the full response for potential tool use follow-up
        let hasToolUse = false;
        let toolBlock: Anthropic.Messages.ToolUseBlock | null = null;
        const contentBlocks: Anthropic.Messages.ContentBlock[] = [];
        let fullResponseText = "";
        let initialResponseText = "";
        let toolName: string | undefined;
        let navigationData: NavigationData | undefined;
        let placesData: POIResult[] | undefined;
        let curatedSlugs: string[] | undefined;

        // Buffer first-pass text. If this turn uses tools, suppress this draft text
        // entirely so internal retry narration never flashes in UI.
        stream.on("text", (text) => {
          initialResponseText += text;
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
          if (initialResponseText.trim().length > 0) {
            fullResponseText += initialResponseText;
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(initialResponseText))),
            );
            emittedUserText = true;
          }

          if (!emittedUserText && !emittedToolData) {
            const fallbackText = buildNoOutputFallback(userMessage);
            fullResponseText += fallbackText;
            controller.enqueue(
              encoder.encode(sseEvent("text", JSON.stringify(fallbackText))),
            );
            emittedUserText = true;
          }

          // Pure text response — already streamed, log and close
          if (activeSessionId) {
            const responseTime = Date.now() - startTime;
            const isFallback = hasToolIntent(userMessage);

            const assistantMsgId = await logChatMessage({
              session_id: activeSessionId,
              role: "assistant",
              content: fullResponseText,
              is_fallback: isFallback,
              response_time_ms: responseTime,
            });

            if (assistantMsgId) {
              controller.enqueue(
                encoder.encode(sseEvent("message_id", JSON.stringify({ messageId: assistantMsgId }))),
              );
            }
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
        } else if (toolName === "search_curated_restaurants") {
          controller.enqueue(
            encoder.encode(sseEvent("tool_start", JSON.stringify({ tool: "search_curated_restaurants", label: "Checking curated restaurants..." }))),
          );
        } else if (toolName === "search_curated_attractions") {
          controller.enqueue(
            encoder.encode(sseEvent("tool_start", JSON.stringify({ tool: "search_curated_attractions", label: "Finding attractions..." }))),
          );
        }

        // Execute the tool
        let toolResultContent: string;

        if (toolName === "get_navigation") {
          const rawToolInput = tb.input as {
            destination: string;
            chineseName?: string;
            city?: string;
          };
          const toolInput = applyNavigationCityOverride(
            rawToolInput,
            userMessage,
            inferredNavigationCity,
          );
          const navResult = await executeNavigationTool(
            toolInput,
            origin,
            inferredNavigationCity || userCity,
            navContext,
          );
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
        } else if (toolName === "search_curated_restaurants") {
          const toolInput = tb.input as CuratedSearchInput;
          const curatedResult = await executeCuratedSearch(toolInput);
          // Send only lightweight summaries to Claude (~5KB vs ~60KB)
          toolResultContent = JSON.stringify({
            results: curatedResult.summaries,
            error: curatedResult.error,
          });
          curatedSlugs = curatedResult.slugs.length > 0
            ? curatedResult.slugs
            : undefined;
        } else if (toolName === "search_curated_attractions") {
          const toolInput = tb.input as { query?: string };
          const attractionResult = await searchCuratedAttractions(toolInput.query);
          toolResultContent = JSON.stringify({
            results: attractionResult.summaries,
          });
          if (attractionResult.slugs.length > 0) {
            controller.enqueue(
              encoder.encode(sseEvent("tool_data", JSON.stringify({ attractionSlugs: attractionResult.slugs }))),
            );
            emittedToolData = true;
          }
        } else {
          const fallbackText = buildNoOutputFallback(userMessage);
          controller.enqueue(
            encoder.encode(sseEvent("text", JSON.stringify(fallbackText))),
          );
          controller.enqueue(encoder.encode(sseEvent("done", "{}")));
          controller.close();
          return;
        }

        // Send tool data to client (navigation card / restaurant list)
        if (navigationData) {
          controller.enqueue(
            encoder.encode(sseEvent("tool_data", JSON.stringify({ navigationData }))),
          );
          emittedToolData = true;
        }
        if (placesData) {
          controller.enqueue(
            encoder.encode(sseEvent("tool_data", JSON.stringify({ placesData }))),
          );
          emittedToolData = true;
        }
        if (curatedSlugs) {
          controller.enqueue(
            encoder.encode(sseEvent("tool_data", JSON.stringify({ curatedRestaurantSlugs: curatedSlugs }))),
          );
          emittedToolData = true;
        }

        // If curated search returned empty and user was asking about food,
        // automatically fall back to Amap nearby search instead of letting
        // Claude chain another tool call (which causes blank responses).
        let didCuratedFallback = false;
        let curatedFallbackInput: PlacesSearchInput | undefined;
        if (
          toolName === "search_curated_restaurants" &&
          !curatedSlugs &&
          foodIntent &&
          foodIntent !== "specific"
        ) {
          const fallbackMode = foodIntent === "proximity" ? "nearby" : "city";
          controller.enqueue(
            encoder.encode(
              sseEvent(
                "tool_start",
                JSON.stringify({
                  tool: "search_nearby_places",
                  label:
                    fallbackMode === "nearby"
                      ? "Searching restaurants nearby..."
                      : "Searching restaurants in city...",
                }),
              ),
            ),
          );

          const curatedInput = tb.input as CuratedSearchInput;
          const fallbackKeyword =
            curatedInput.semantic_query ||
            curatedInput.query ||
            curatedInput.cuisine ||
            deriveFallbackKeyword(userMessage, undefined, curatedInput.query);

          curatedFallbackInput =
            fallbackMode === "nearby"
              ? {
                  type: "restaurant",
                  searchMode: "nearby",
                  keyword: fallbackKeyword,
                  location: origin,
                  radius: PROXIMITY_RADIUS_METERS,
                }
              : {
                  type: "restaurant",
                  searchMode: "city",
                  keyword: fallbackKeyword,
                  city: effectiveCity,
                };

          const fallbackResult = await executePlacesSearch(
            curatedFallbackInput,
            origin,
          );

          if (fallbackResult.results.length > 0) {
            placesData = fallbackResult.results;
            controller.enqueue(
              encoder.encode(sseEvent("tool_data", JSON.stringify({ placesData }))),
            );
            emittedToolData = true;
          }
          toolName = "search_nearby_places";
          didCuratedFallback = true;
          // Replace the tool result content with places data for the follow-up
          toolResultContent = JSON.stringify(fallbackResult);
        }

        // Build follow-up messages. When we did a curated→places fallback,
        // strip the curated tool_use from history and pretend the AI called
        // search_nearby_places directly, so Claude doesn't get confused.
        let followUpMessages: Anthropic.Messages.MessageParam[];
        if (didCuratedFallback) {
          // Replace the curated tool_use block with a search_nearby_places one
          const syntheticToolUse: Anthropic.Messages.ContentBlockParam = {
            type: "tool_use",
            id: tb.id,
            name: "search_nearby_places",
            input:
              curatedFallbackInput || {
                type: "restaurant",
                searchMode: "city",
                city: effectiveCity,
              },
          };
          // Keep any text blocks from the original response
          const textBlocks = finalMessage.content.filter(
            (b): b is Anthropic.Messages.TextBlock => b.type === "text",
          );
          followUpMessages = [
            ...apiMessages,
            { role: "assistant" as const, content: [...textBlocks, syntheticToolUse] },
            {
              role: "user" as const,
              content: [{ type: "tool_result" as const, tool_use_id: tb.id, content: toolResultContent }],
            },
          ];
        } else {
          followUpMessages = [
            ...apiMessages,
            { role: "assistant" as const, content: finalMessage.content },
            {
              role: "user" as const,
              content: [{ type: "tool_result" as const, tool_use_id: tb.id, content: toolResultContent }],
            },
          ];
        }

        // Follow-up call with tool result — also streamed
        const followUpStream = getClient().messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: buildSystemPrompt(promptCity, isDemoMode),
          tools: TOOLS,
          messages: followUpMessages,
        });

        // Clear any pre-tool text and stream the follow-up
        controller.enqueue(encoder.encode(sseEvent("text_clear", "")));
        emittedUserText = false;
        fullResponseText = "";

        if (placesData) {
          // Buffer the full response to extract <enrichment> block
          let followUpText = "";
          followUpStream.on("text", (text) => {
            followUpText += text;
            fullResponseText += text;
          });
          const followUpFinal = await followUpStream.finalMessage();

          // If follow-up produced another tool_use instead of text (e.g. trying to
          // call search_curated_restaurants again), make a final text-only call
          if (followUpFinal.stop_reason === "tool_use" || followUpText.length === 0) {
            const finalTextStream = getClient().messages.stream({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              system: buildSystemPrompt(promptCity, isDemoMode),
              messages: [
                ...apiMessages,
                {
                  role: "user" as const,
                  content: `Here are restaurant search results for the user's query. Respond with an <enrichment> JSON block first, then a brief 1-2 sentence text response.\n\nResults: ${toolResultContent}`,
                },
              ],
            });
            followUpText = "";
            finalTextStream.on("text", (text) => {
              followUpText += text;
              fullResponseText += text;
            });
            await finalTextStream.finalMessage();
          }

          // Extract and send enrichment data
          const enrichMatch = followUpText.match(/<enrichment>([\s\S]*?)<\/enrichment>/);
          if (enrichMatch) {
            try {
              const enrichment = JSON.parse(enrichMatch[1]);
              controller.enqueue(
                encoder.encode(sseEvent("places_update", JSON.stringify(enrichment))),
              );
            } catch (e) {
              console.error("Failed to parse enrichment:", e);
            }
            followUpText = followUpText.replace(/<enrichment>[\s\S]*?<\/enrichment>/, "").trim();
          }

          // Send the clean text (JSON-encoded to preserve whitespace)
          if (followUpText) {
            controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(followUpText))));
            if (followUpText.trim().length > 0) emittedUserText = true;
          }
        } else {
          // For navigation and curated restaurants, buffer follow-up so internal
          // retry narration can be filtered before reaching the user.
          let followUpText = "";
          followUpStream.on("text", (text) => {
            followUpText += text;
          });
          const followUpFinal = await followUpStream.finalMessage();

          if (followUpFinal.stop_reason === "tool_use") {
            const retryToolBlock = followUpFinal.content.find(
              (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
            );

            if (retryToolBlock) {
              let retryToolResultContent = "";

              if (retryToolBlock.name === "get_navigation") {
                const rawToolInput = retryToolBlock.input as {
                  destination: string;
                  chineseName?: string;
                  city?: string;
                };
                const toolInput = applyNavigationCityOverride(
                  rawToolInput,
                  userMessage,
                  inferredNavigationCity,
                );
                const navResult = await executeNavigationTool(
                  toolInput,
                  origin,
                  inferredNavigationCity || userCity,
                  navContext,
                );
                retryToolResultContent = navResult.result
                  ? JSON.stringify(navResult.result)
                  : JSON.stringify({ error: navResult.error });
                if (navResult.result) {
                  navigationData = navResult.result;
                  controller.enqueue(
                    encoder.encode(sseEvent("tool_data", JSON.stringify({ navigationData }))),
                  );
                  emittedToolData = true;
                }
                toolName = "get_navigation";
              } else if (retryToolBlock.name === "search_nearby_places") {
                const placesInput = retryToolBlock.input as {
                  type: string;
                  searchMode?: string;
                  keyword?: string;
                  city?: string;
                  location?: string;
                  radius?: number;
                };
                const placesResult = await executePlacesSearch(placesInput, origin);
                retryToolResultContent = JSON.stringify(placesResult);
                if (placesResult.results.length > 0) {
                  placesData = placesResult.results;
                  controller.enqueue(
                    encoder.encode(sseEvent("tool_data", JSON.stringify({ placesData }))),
                  );
                  emittedToolData = true;
                }
                toolName = "search_nearby_places";
              } else if (retryToolBlock.name === "search_curated_restaurants") {
                const curatedInput = retryToolBlock.input as CuratedSearchInput;
                const curatedResult = await executeCuratedSearch(curatedInput);
                retryToolResultContent = JSON.stringify({
                  results: curatedResult.summaries,
                  error: curatedResult.error,
                });
                if (curatedResult.slugs.length > 0) {
                  curatedSlugs = curatedResult.slugs;
                  controller.enqueue(
                    encoder.encode(
                      sseEvent(
                        "tool_data",
                        JSON.stringify({ curatedRestaurantSlugs: curatedSlugs }),
                      ),
                    ),
                  );
                  emittedToolData = true;
                }
                toolName = "search_curated_restaurants";
              }

              if (retryToolResultContent) {
                followUpText = await generateTextOnlyResponse(
                  [
                    ...followUpMessages,
                    { role: "assistant" as const, content: followUpFinal.content },
                    {
                      role: "user" as const,
                      content: [
                        {
                          type: "tool_result" as const,
                          tool_use_id: retryToolBlock.id,
                          content: retryToolResultContent,
                        },
                      ],
                    },
                  ],
                  promptCity,
                  isDemoMode,
                  "Do not narrate retries or internal tool behavior. Provide the final answer directly.",
                );
              }
            }
          }

          followUpText = stripInternalRetryText(followUpText);
          if (
            toolName === "get_navigation" &&
            !navigationData &&
            (isNavigationPlaceholderText(followUpText) ||
              followUpText.trim().length < 40 ||
              !isNavigationFailureGuidance(followUpText))
          ) {
            followUpText = buildNoOutputFallback(userMessage);
          }
          if (followUpText) {
            fullResponseText += followUpText;
            controller.enqueue(encoder.encode(sseEvent("text", JSON.stringify(followUpText))));
            if (followUpText.trim().length > 0) emittedUserText = true;
          }
        }

        if (!emittedUserText && !emittedToolData) {
          const fallbackText = buildNoOutputFallback(userMessage);
          fullResponseText += fallbackText;
          controller.enqueue(
            encoder.encode(sseEvent("text", JSON.stringify(fallbackText))),
          );
          emittedUserText = true;
        }

        // Log assistant response and send DB message ID
        if (activeSessionId) {
          const responseTime = Date.now() - startTime;
          const toolsCalled = toolName ? [toolName] : undefined;
          const toolSuccess = toolName
            ? (navigationData !== undefined || placesData !== undefined || curatedSlugs !== undefined)
            : undefined;
          const isFallback =
            !toolName && hasToolIntent(userMessage);

          const assistantMsgId = await logChatMessage({
            session_id: activeSessionId,
            role: "assistant",
            content: fullResponseText,
            tools_called: toolsCalled,
            tool_success: toolSuccess,
            is_fallback: isFallback,
            response_time_ms: responseTime,
          });

          if (assistantMsgId) {
            controller.enqueue(
              encoder.encode(sseEvent("message_id", JSON.stringify({ messageId: assistantMsgId }))),
            );
          }
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
