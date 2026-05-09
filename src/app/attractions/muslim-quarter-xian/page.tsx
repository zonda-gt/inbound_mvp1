import type { Metadata } from "next";
import AttractionPageComponent from "@/components/guides/attractions/AttractionDetail";
import { SITE_URL } from "@/lib/site";
import type { AttractionData } from "@/types/attraction";

/* ── Hardcoded attraction data ── */

const data: AttractionData = {
  slug: "muslim-quarter-xian",
  attraction_name_cn: "回民街",
  attraction_name_en: "Muslim Quarter (Huimin Jie)",
  address_cn: "陕西省西安市莲湖区北院门5号",
  experience_type: "food-street",
  hook: "Xi'an's legendary Muslim Quarter — a thousand-year-old Silk Road neighborhood where 300 varieties of Hui Muslim street food sizzle, smoke, and steam across a maze of lantern-lit alleys behind the Drum Tower.",
  honest_description:
    "The Muslim Quarter is not a single street but a network of alleys — Beiyuanmen, Beiguangji Street, Xiyangshi, Dapiyuan, Huajue Lane, and Sajinqiao — that together form the culinary and cultural heart of Xi'an's 60,000-strong Hui Muslim community. Located immediately behind the Drum Tower in the city center, this area has been a Muslim residential and commercial district since the Northern Song Dynasty. By day, it is a dense food market with nearly 300 varieties of street snacks: lamb skewers, roujiamo (meat-stuffed flatbread), yangrou paomo (lamb soup with crumbled bread), liangpi (cold noodles), persimmon cakes, pomegranate juice, and much more. By night, it transforms into a spectacular street-food carnival with red lanterns, sizzling grills, and shoulder-to-shoulder crowds. Beyond food, the quarter contains 10 mosques including the Great Mosque (one of China's oldest, built in 742 AD), and traditional architecture blending Islamic and Chinese styles. Honest downsides: the main Beiyuanmen street is overwhelmingly touristy — prices are inflated, the same stalls repeat endlessly, and weekend crowds make walking a slow battle. Locals rarely eat on the main drag, preferring the side alleys (Dapiyuan, Xiyangshi, Sajinqiao) where food is cheaper and better. Persistent hawkers can be aggressive. Quality varies — some stalls rely on tourist volume rather than food quality. But venture beyond the main street and the Muslim Quarter delivers what might be the most exciting street food experience in all of China.",
  foreigner_top_question: "Is the food halal? Is it safe to eat?",
  foreigner_top_answer:
    "Yes — virtually everything in the Muslim Quarter is halal, prepared according to Islamic dietary law by the Hui Muslim community. Food safety is generally good, especially at established restaurants and busy stalls with high turnover. Use common sense: eat at stalls with long queues (high turnover means fresh food), avoid anything that has been sitting out in the heat, and stick to cooked items if you have a sensitive stomach. The water and fresh juices are safe in reputable shops.",
  experience_format_note:
    "Open-air street food district composed of multiple interconnected alleys. Free entry, open 24/7 (food stalls active approximately 8 AM-11 PM, peak activity 5 PM-10 PM). Located directly behind the Drum Tower, walkable from Bell Tower metro station (Lines 1/2). Majority of stalls are cash or Alipay/WeChat Pay. No reservations needed. The Great Mosque (25 RMB entry) is located within the quarter.",
  vibe: "A sensory avalanche — clouds of cumin-scented smoke from lamb grills, rhythmic pounding of nut candy, red lanterns glowing above a river of humanity, vendors shouting over sizzling woks, and the unexpected tranquility of mosque courtyards just steps away from the chaos.",
  time_needed: {
    quick_visit:
      "1-1.5 hours (walk the main street, eat 2-3 snacks, take photos)",
    recommended:
      "3-4 hours (explore main street and side alleys, eat at 5-6 stalls, visit the Great Mosque, browse night market)",
    deep_dive:
      "5-6 hours (systematic food crawl across all alleys, Great Mosque visit, shopping for souvenirs, evening lantern atmosphere)",
  },
  best_time: {
    best_time_of_day:
      "Early evening (5-7 PM) for the best combination of fully operational food stalls, golden hour light, and lanterns being lit. Morning (9-11 AM) for a quieter experience with fewer crowds and fresh food being prepared.",
    worst_time:
      "Weekend evenings and Chinese holidays — the main street becomes so packed that movement slows to a crawl. Summer midday (hot, humid, smoky, and crowded).",
    seasonal_notes:
      "Autumn and spring offer the most comfortable weather for outdoor eating. Winter evenings have a cozy atmosphere with steaming food stalls but can be cold. Summer is hot and the smoke from grills makes it intense.",
    pro_tip:
      "Come at 9 AM for the best local experience — the morning stalls serve breakfast items (dumplings, soup, flatbread) that tourists miss, the crowds are thin, and the food is freshly prepared.",
  },
  getting_in: {
    price_rmb:
      "Free to enter. Food: 5-30 RMB per item. Full meal: 30-80 RMB. Great Mosque: 25 RMB.",
    price_usd: "Free entry. Full food crawl: ~$5-15. Great Mosque: ~$3.50.",
    booking_required: "No — just walk in.",
    booking_method:
      "No booking needed. For the Great Mosque, buy tickets at the entrance.",
    passport_accepted:
      "N/A — free public streets. Great Mosque accepts foreign visitors.",
    what_to_bring:
      "Cash (some stalls do not accept mobile payment). Wet wipes (you will get messy). A sense of adventure. Empty stomach.",
    queue_situation:
      "No entry queue. Popular food stalls can have 10-20 minute waits (worth it). The main street itself is the queue on weekend evenings.",
    language_barrier_rating: "no-chinese-needed",
  },
  opening_hours:
    "Streets are open 24/7. Food stalls: approximately 8:00 AM-11:00 PM (some 24-hour restaurants). Great Mosque: 08:00-19:00 (summer), 08:00-18:00 (winter).",
  experience_highlights: [
    {
      name: "The Street Food Experience",
      description:
        "Nearly 300 varieties of Hui Muslim street food across multiple alleys: roujiamo (spiced meat in flatbread), yangrou paomo (lamb soup with hand-torn bread), liangpi (cold skin noodles), lamb skewers, biangbiang noodles, persimmon cakes, pomegranate juice, huafen candy, and much more. The sheer density and variety of food is staggering.",
      foreigner_appeal: "🟢 UNIVERSAL APPEAL",
      foreigner_note:
        "This is one of the world's great street food experiences. The Silk Road heritage means the flavors — cumin, chili, lamb, flatbread — are more accessible to Western palates than many Chinese cuisines. Muslim dietary law means no pork, which simplifies ordering for many visitors.",
      tip: "Eat small portions at many stalls rather than filling up at one. Start with roujiamo (the must-try), then lamb skewers, then liangpi. Save room for sweets like persimmon cakes and nut candy.",
    },
    {
      name: "The Great Mosque (化觉巷清真大寺)",
      description:
        "Founded in 742 AD, the Great Mosque of Xi'an is one of the oldest and largest mosques in China. Unlike Middle Eastern mosques, it is built in classical Chinese architectural style — garden courtyards, pavilions, carved wooden arches, and calligraphic screens blend Islamic and Chinese aesthetics seamlessly.",
      foreigner_appeal: "🟢 UNIVERSAL APPEAL",
      foreigner_note:
        "The fusion of Chinese garden architecture with Islamic religious function is unique in the world. The prayer hall (off-limits to non-Muslims) has a traditional Chinese roof but Arabic calligraphy inside. The peaceful courtyards are a welcome escape from the chaotic food streets.",
      tip: "Enter from Huajue Lane. Visit in the morning for the best light and fewest crowds. The courtyard gardens are most beautiful in spring and autumn.",
    },
    {
      name: "Sajinqiao — The Locals' Street",
      description:
        "While tourists crowd Beiyuanmen, local Xi'an residents head to Sajinqiao for their Muslim Quarter food fix. This street west of the main drag has cheaper prices, better quality, and a more authentic neighborhood atmosphere.",
      foreigner_appeal: "🟡 CULTURAL DEPTH",
      foreigner_note:
        "This is where the real food exploration happens. The stalls here serve local regulars, not tourists, so quality must stay high. Prices are 30-50% cheaper than the main street.",
      tip: "Try Liu Ming's persimmon pancakes, Ma Wenzhang's steamed sticky rice cake, and Liu Xin's stir-fried pita bread at Sajinqiao.",
    },
    {
      name: "Night Market Atmosphere",
      description:
        "After dark, the Muslim Quarter transforms into one of China's most electric night food scenes. Red lanterns line the streets, neon signs flash, grill smoke fills the air, vendors compete with shouted pitches, and the crush of humanity creates an atmosphere of pure urban energy.",
      foreigner_appeal: "🟢 UNIVERSAL APPEAL",
      foreigner_note:
        "The visual spectacle of the night market — lanterns, smoke, crowds, illuminated food stalls stretching into the distance — is quintessentially Chinese and endlessly photogenic.",
      tip: "Walk the main Beiyuanmen street for atmosphere and photos, then duck into the side alleys for actual eating.",
    },
  ],
  what_visitors_miss: [
    {
      what: "The side alleys (Dapiyuan, Xiyangshi, Sajinqiao)",
      why: "90% of tourists never leave the main Beiyuanmen street, missing the best food and most authentic atmosphere. Each side alley has its own specialties and local favorite shops.",
    },
    {
      what: "The Great Mosque",
      why: "Hidden down a narrow lane (Huajue Alley), many visitors walk right past it. It is one of China's most significant Islamic sites and offers a serene contrast to the food street chaos.",
    },
    {
      what: "Gao Family Courtyard (高家大院)",
      why: "A well-preserved Ming Dynasty courtyard house inside the quarter that hosts shadow puppet shows and traditional performances. Located on Beiyuanmen but overlooked amid the food frenzy.",
    },
  ],
  strategy: {
    smart_route:
      "Start at the Drum Tower (Metro Line 1/2, Bell Tower Station). Walk north into Beiyuanmen — enjoy the atmosphere and take photos but resist eating at the first stalls. Turn right into Xiyangshi for your first snacks. Continue to Dapiyuan for baozi and lamb soup. Visit the Great Mosque via Huajue Lane. Loop back through the main street for any remaining items you want to try. End with dessert (persimmon cake, pomegranate juice) as you head back toward the Drum Tower.",
    what_to_skip:
      "The identical lamb skewer stalls on the main Beiyuanmen strip that all sell the same thing at tourist prices. The gift shops selling mass-produced souvenirs. The 'restaurants' with aggressive touts outside.",
    pro_tips: [
      "Come hungry — really hungry. Budget 50-80 RMB for a thorough food crawl. Eat small portions (ban fen/半份) to maximize variety. The best yangrou paomo experience involves tearing the bread yourself (suipao/碎泡) rather than having the kitchen do it — it takes 20 minutes but is the authentic way.",
    ],
  },
  heads_up: [
    {
      warning: "Weekend evening crowds are extreme — shoulder-to-shoulder",
      advice:
        "Visit on weekday evenings for the atmosphere without the worst crowds. Or come in the morning for a completely different, much calmer experience.",
    },
    {
      warning: "Prices on the main Beiyuanmen street are inflated",
      advice:
        "The same items cost 30-50% less on the side streets. Locals know this and eat at Dapiyuan, Xiyangshi, and Sajinqiao instead.",
    },
    {
      warning: "Food quality varies widely",
      advice:
        "Follow the queues — stalls with long lines of local customers have earned their reputation. Avoid empty restaurants with aggressive touts. Named establishments that have been around for decades are generally reliable. If you want a curated food crawl hitting the best stalls and skipping the tourist traps, our concierge team can match you with a vetted local food guide who knows every alley.",
    },
  ],
  preparation: {
    what_to_wear:
      "Casual and comfortable. Avoid white clothing — the smoke and food splatter will stain. Comfortable shoes for standing and walking on stone streets.",
    what_to_bring:
      "Cash (small bills). Wet wipes or hand sanitizer. Phone for photos. Empty stomach. Modest clothing if visiting the Great Mosque.",
    what_not_to_bring:
      "Large bags — they are cumbersome in the crowds. Expectations of a quiet, orderly experience.",
  },
  physical_accessibility: {
    physical_intensity: "low",
    physical_details:
      "Flat streets, mostly paved. Wheelchair access is possible on the main streets but very difficult in crowds. Side alleys are narrow. Distances are short — the entire area can be covered on foot in under 2 km.",
    age_notes:
      "Suitable for all ages. Young children may find the crowds overwhelming on weekend evenings. The food variety caters to all preferences.",
    health_warnings:
      "Food allergies: cumin, sesame, nuts, and wheat are ubiquitous. Inform vendors of allergies (translation app helpful). Smoky air from grills may bother those with respiratory issues.",
  },
  concierge_opportunities: [
    {
      action: "No booking needed — free public streets",
      platform: "N/A",
      value_to_user: "Just show up hungry. Combine with a Drum Tower visit.",
    },
    {
      action: "Guided food tour",
      platform: "Trip.com, Klook, or local tour operators",
      value_to_user:
        "English-speaking food tours navigate the best stalls and explain the culture. Typically 200-400 RMB including food tastings. Worth it for first-time visitors who want to maximize their eating.",
    },
  ],
  useful_chinese: [
    {
      pinyin: "Huímín Jiē",
      chinese: "回民街",
      english: "Muslim Quarter / Muslim Street",
    },
    {
      pinyin: "Ròujiāmó",
      chinese: "肉夹馍",
      english: "Meat sandwich ('Chinese hamburger')",
    },
    {
      pinyin: "Yángròu Pàomó",
      chinese: "羊肉泡馍",
      english: "Lamb soup with crumbled bread",
    },
    {
      pinyin: "Liángpí",
      chinese: "凉皮",
      english: "Cold skin noodles",
    },
    {
      pinyin: "Yào yī fèn",
      chinese: "要一份",
      english: "I want one portion",
    },
    {
      pinyin: "Bú là",
      chinese: "不辣",
      english: "Not spicy",
    },
  ],
  pair_with: [
    {
      suggestion: "Drum Tower & Bell Tower (鼓楼 & 钟楼)",
      why: "The Drum Tower sits directly at the entrance to the Muslim Quarter. Climb it for views over the quarter's rooftops, then walk straight into the food streets.",
      travel_time:
        "0 minutes — the Drum Tower is at the south entrance of the Muslim Quarter",
    },
    {
      suggestion: "City Wall (古墙)",
      why: "Xi'an's complete ancient city wall is a 15-minute walk from the Muslim Quarter. Walk or cycle the 14-km circuit along the top.",
      travel_time: "15 minutes walking to the nearest wall gate",
    },
    {
      suggestion: "Terracotta Warriors (兵马俑)",
      why: "Xi'an's most famous attraction, about 40 minutes east. Visit the warriors during the day, then head to the Muslim Quarter for the evening food scene.",
      travel_time: "40-60 minutes by bus or taxi",
    },
  ],
  cultural_context:
    "Xi'an's Muslim Quarter traces its origins to the Tang Dynasty (7th-10th century), when Arab and Persian merchants traveled the Silk Road to Chang'an (Xi'an's ancient name), then the world's largest and most cosmopolitan city. Many settled permanently, married local women, and established the Hui Muslim community. The area became a formal residential district during the Northern Song Dynasty and flourished commercially during the Ming and Qing dynasties. Today, approximately 60,000 Hui Muslims live in the quarter, maintaining their faith, dietary traditions, and cultural practices while fully integrating into Chinese society. The 10 mosques in the area — especially the Great Mosque founded in 742 AD — represent a unique fusion of Chinese and Islamic architecture found nowhere else. The food culture is the living legacy of the Silk Road: cumin-spiced lamb (Central Asian), flatbreads (Persian/Central Asian), and noodle techniques (Chinese) combined over centuries into a distinctive Hui Muslim cuisine that has become synonymous with Xi'an itself. The quarter was renovated in 1992-1993 with traditional-style architecture and has since become Xi'an's most visited destination after the Terracotta Warriors.",
  photo_spots: [
    {
      location:
        "Beiyuanmen main street at night — looking south toward the Drum Tower",
      tip: "Stand on the slightly elevated area near the north end and shoot south. The red lanterns, food stall lights, and crowds create a tunnel of warm light with the illuminated Drum Tower framing the end.",
      why: "The classic Muslim Quarter photo — a canyon of lanterns and smoke with the ancient Drum Tower in the background.",
    },
    {
      location: "Food stalls with active cooking — close-up shots",
      tip: "The lamb skewer grills and roujiamo preparation counters are the most photogenic. Ask permission before taking close-up photos of vendors. Early evening has the best warm light.",
      why: "The action shots of food preparation capture the energy and craft of the street food tradition.",
    },
    {
      location: "Great Mosque courtyards",
      tip: "The inner courtyards with Chinese-style pavilions and Arabic calligraphy create a stunning visual contrast. Morning light through the garden is beautiful.",
      why: "The unique Chinese-Islamic architectural fusion is visually unlike any other mosque in the world.",
    },
  ],
  card_name: "Muslim Quarter",
  card_type: "FOOD STREET",
  card_hook:
    "Xi'an's thousand-year-old Silk Road food scene — 300 street snacks across a labyrinth of lantern-lit alleys.",
  best_for: [
    "food-culinary",
    "nightlife-evening",
    "culture-heritage",
    "free-to-visit",
    "iconic-must-see",
  ],
};

/* ── Metadata ── */

const canonical = `${SITE_URL}/attractions/muslim-quarter-xian`;

export const metadata: Metadata = {
  title: `${data.attraction_name_en} — HelloChina Guide`,
  description: data.hook,
  alternates: { canonical },
  openGraph: {
    type: "article",
    url: canonical,
    siteName: "HelloChina",
    title: data.attraction_name_en,
    description: data.hook,
  },
  twitter: {
    card: "summary_large_image",
    title: data.attraction_name_en,
    description: data.hook,
  },
};

/* ── Schema ── */

function AttractionSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: data.attraction_name_en,
    alternateName: data.attraction_name_cn,
    description: data.hook,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address_cn,
      addressCountry: "CN",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ── Page ── */

export default function MuslimQuarterPage() {
  return (
    <>
      <AttractionSchema />
      <AttractionPageComponent data={data} />
    </>
  );
}
