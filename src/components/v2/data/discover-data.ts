// =====================================================================
// Shanghai Magazine — Discover Screen Data & Utilities
// Extracted from hellochina-v5/index.html
// =====================================================================

// --------------- Interfaces ---------------

export interface SearchPlace {
  id: number;
  name: string;
  cn: string;
  hook: string;
  tags: string[];
  price: string;
  dist: string;
  emoji: string;
  bg: string;
  open: boolean;
  categories: string[];
}

export interface QuickAction {
  label: string;
  query: string;
}

interface TimeMessage {
  text: string;
  minHour: number;
  maxHour: number;
}

// --------------- Search Database ---------------

export const SEARCH_DATABASE: SearchPlace[] = [
  {
    id: 1,
    name: 'Xun Yu Ji Wok Noodles',
    cn: '寻鱼记',
    hook: 'Flames shoot from the wok two feet from your face. The best noodles in Shanghai.',
    tags: ['noodles', 'food', 'open now', 'under ¥50'],
    price: '¥38',
    dist: '320m',
    emoji: '🍜',
    bg: 'linear-gradient(135deg,#2d1a00,#5a3000)',
    open: true,
    categories: ['food', 'noodles'],
  },
  {
    id: 2,
    name: "Yang's Fried Dumplings",
    cn: '杨小汤包',
    hook: 'Crispy bottoms, soup inside — locals queue 30 minutes for these.',
    tags: ['dumplings', 'food', 'open now', 'under ¥50'],
    price: '¥20',
    dist: '1.2km',
    emoji: '🥟',
    bg: 'linear-gradient(135deg,#1a0a00,#3d2000)',
    open: true,
    categories: ['food', 'dumplings'],
  },
  {
    id: 3,
    name: 'Jia Jia Tang Bao',
    cn: '佳家汤包',
    hook: 'The best soup dumplings in the city. Arrive before 8 AM or queue 45 minutes.',
    tags: ['dumplings', 'food', 'under ¥50'],
    price: '¥25',
    dist: '2.1km',
    emoji: '🥟',
    bg: 'linear-gradient(135deg,#0a1a0a,#1a3a1a)',
    open: false,
    categories: ['food', 'dumplings'],
  },
  {
    id: 4,
    name: 'Sleep No More',
    cn: '不眠之夜',
    hook: 'A 1930s Shanghai hotel where you are the detective — no two visits are the same.',
    tags: ['theatre', 'experiences', 'indoors', 'book ahead'],
    price: '¥480',
    dist: '1.8km',
    emoji: '🎭',
    bg: 'linear-gradient(135deg,#0a0010,#1a0030)',
    open: true,
    categories: ['experiences', 'after dark', 'indoors'],
  },
  {
    id: 5,
    name: 'The Paramount Ballroom',
    cn: '百乐门',
    hook: 'A jazz club hidden inside a 1930s cattle slaughterhouse — ask for the side tables.',
    tags: ['jazz', 'nightlife', 'after dark', 'indoors'],
    price: '¥200–500',
    dist: '2.4km',
    emoji: '🎷',
    bg: 'linear-gradient(135deg,#1a0a00,#3d2000)',
    open: true,
    categories: ['nightlife', 'after dark', 'indoors'],
  },
  {
    id: 6,
    name: 'Propaganda Poster Art Centre',
    cn: '宣传画艺术中心',
    hook: 'The owner answers the door himself. 10,000 Cultural Revolution posters in a basement.',
    tags: ['museum', 'hidden', 'indoors', 'under ¥50'],
    price: '¥35',
    dist: '3.2km',
    emoji: '🏛️',
    bg: 'linear-gradient(135deg,#1a0500,#3d0a00)',
    open: true,
    categories: ['experiences', 'hidden', 'indoors'],
  },
  {
    id: 7,
    name: 'The 1933 Slaughterhouse',
    cn: '1933老场坊',
    hook: "A 1930s abattoir with spiral walkways unlike anything you've seen. Most locals don't know it exists.",
    tags: ['architecture', 'hidden', 'free', 'indoors'],
    price: 'Free',
    dist: '4.1km',
    emoji: '🏭',
    bg: 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
    open: true,
    categories: ['experiences', 'hidden', 'indoors'],
  },
  {
    id: 8,
    name: 'Huangpu River Ferry',
    cn: '轮渡',
    hook: 'The best Bund view in the city. ¥2. Eight minutes. Zero tourists on board.',
    tags: ['ferry', 'hidden', 'under ¥50', 'outdoor'],
    price: '¥2',
    dist: '1.5km',
    emoji: '🚢',
    bg: 'linear-gradient(135deg,#001020,#002040)',
    open: true,
    categories: ['experiences', 'hidden', 'outdoor'],
  },
  {
    id: 9,
    name: 'COMMUNE Reserve',
    cn: '公社',
    hook: 'Skyline views, English menu, never crowded at lunch. The best solo lunch spot in the city.',
    tags: ['coffee', 'rooftop', 'outdoor', 'open now'],
    price: '¥130',
    dist: '440m',
    emoji: '🏙️',
    bg: 'linear-gradient(135deg,#001a20,#003040)',
    open: true,
    categories: ['coffee', 'food', 'outdoor'],
  },
  {
    id: 10,
    name: 'Yuyintang',
    cn: '育音堂',
    hook: "Shanghai's legendary indie venue. Local bands, no tourists, ¥100 at the door.",
    tags: ['music', 'nightlife', 'after dark', 'indoors'],
    price: '¥100',
    dist: '3.8km',
    emoji: '🎸',
    bg: 'linear-gradient(135deg,#0a0020,#1a0040)',
    open: true,
    categories: ['nightlife', 'after dark', 'indoors'],
  },
  {
    id: 11,
    name: 'Speak Low',
    cn: '小声说话',
    hook: 'Enter through a Coca-Cola vending machine. Three floors of cocktails, no tourists.',
    tags: ['bar', 'hidden', 'nightlife', 'after dark', 'indoors'],
    price: '¥100–200',
    dist: '2.9km',
    emoji: '🍸',
    bg: 'linear-gradient(135deg,#0a0010,#200030)',
    open: true,
    categories: ['nightlife', 'after dark', 'hidden', 'indoors'],
  },
  {
    id: 12,
    name: 'Wukang Road at 7 AM',
    cn: '武康路',
    hook: 'The most photographed street in Shanghai is empty on weekday mornings. Golden light through the plane trees.',
    tags: ['outdoor', 'free', 'photo spot', 'morning'],
    price: 'Free',
    dist: '3.5km',
    emoji: '🌳',
    bg: 'linear-gradient(135deg,#0a1500,#1a2a00)',
    open: true,
    categories: ['outdoor', 'hidden', 'experiences'],
  },
];

// --------------- Time-Aware Hero Messages ---------------

export const TIME_MESSAGES: TimeMessage[] = [
  // Morning (6-9)
  {
    text: 'Wukang Road is empty right now. Golden light through the plane trees, no tourists. Go before 9.',
    minHour: 6,
    maxHour: 9,
  },
  {
    text: "The monks at Jing'an Temple are chanting right now. Free entry before 8 AM. Worth setting the alarm.",
    minHour: 6,
    maxHour: 9,
  },
  // Midday (10-13)
  {
    text: "Yang's Fried Dumplings has a queue already. Get there now or wait until 2 PM when it clears.",
    minHour: 10,
    maxHour: 13,
  },
  {
    text: 'COMMUNE Reserve is quiet on weekday lunches. Skyline views, English menu, no booking needed.',
    minHour: 10,
    maxHour: 13,
  },
  // Afternoon (14-17)
  {
    text: 'The 1933 Slaughterhouse is best in the afternoon light. Escher-like spiral walkways, free entry, almost no one there.',
    minHour: 14,
    maxHour: 17,
  },
  {
    text: 'Arrive at 5:30 before the crowd. Corner table. Watch the Bund light up.',
    minHour: 14,
    maxHour: 17,
  },
  // Evening (18-21)
  {
    text: "Sleep No More starts at 7 PM. If you haven't booked, tonight's show still has tickets. Don't miss it.",
    minHour: 18,
    maxHour: 21,
  },
  {
    text: 'The Paramount Ballroom opens at 9. Ask for the side tables — no minimum spend, best view of the band.',
    minHour: 18,
    maxHour: 21,
  },
  // Late night (22-1, wraps around midnight)
  {
    text: 'Wujiang Road at 2 AM: scallion pancakes, stinky tofu, cold beer on plastic stools. The street that never closes.',
    minHour: 22,
    maxHour: 1,
  },
  {
    text: 'Speak Low is open. Enter through the Coca-Cola vending machine on Yongfu Road. Three floors of cocktails, zero tourists.',
    minHour: 22,
    maxHour: 1,
  },
];

// --------------- getTimeAwareMessage ---------------

/**
 * Returns a random hero message appropriate for the current hour.
 * Handles the midnight-wrap case (e.g. 22..1 spans midnight).
 */
export function getTimeAwareMessage(): string {
  const h = new Date().getHours();

  const pool = TIME_MESSAGES.filter((m) => {
    if (m.minHour <= m.maxHour) {
      // Normal range (e.g. 6..9)
      return h >= m.minHour && h <= m.maxHour;
    }
    // Wraps midnight (e.g. 22..1)
    return h >= m.minHour || h <= m.maxHour;
  });

  if (pool.length === 0) {
    // Fallback: return the first message
    return TIME_MESSAGES[0].text;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen.text;
}

// --------------- searchPlaces ---------------

interface ScoredPlace extends SearchPlace {
  score: number;
}

/**
 * Searches the database with keyword matching and intent boosting.
 * Boosts: open now, near me, indoor, free/cheap, hidden, after dark, morning.
 * Returns matched places sorted by relevance score (descending).
 */
export function searchPlaces(query: string): ScoredPlace[] {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/);

  const scored: ScoredPlace[] = SEARCH_DATABASE.map((place) => {
    let score = 0;
    const searchable = (
      place.name +
      ' ' +
      place.hook +
      ' ' +
      place.tags.join(' ') +
      ' ' +
      place.categories.join(' ')
    ).toLowerCase();

    // Base keyword matching
    keywords.forEach((kw) => {
      if (searchable.includes(kw)) score += 2;
    });

    // Boost open places for "open now" queries
    if ((q.includes('open') || q.includes('now')) && place.open) {
      score += 3;
    }

    // Boost nearby for "near" queries (closer places score higher)
    if (q.includes('near') || q.includes('nearby')) {
      score += place.dist.includes('m') && !place.dist.includes('km') ? 3 : 1;
    }

    // Boost indoor for indoor queries
    if (
      (q.includes('indoor') || q.includes('inside') || q.includes('indoors')) &&
      place.categories.includes('indoors')
    ) {
      score += 3;
    }

    // Boost free/cheap for budget queries
    if (
      (q.includes('free') || q.includes('cheap') || q.includes('under')) &&
      (place.price === 'Free' || parseInt(place.price.replace('¥', '')) < 60)
    ) {
      score += 2;
    }

    // Boost hidden for hidden queries
    if (
      (q.includes('hidden') || q.includes('local') || q.includes('secret')) &&
      place.categories.includes('hidden')
    ) {
      score += 3;
    }

    // Boost after dark
    if (
      (q.includes('night') || q.includes('late') || q.includes('dark')) &&
      place.categories.includes('after dark')
    ) {
      score += 3;
    }

    // Morning
    if (
      (q.includes('morning') || q.includes('quiet') || q.includes('early')) &&
      place.tags.includes('morning')
    ) {
      score += 3;
    }

    return { ...place, score };
  });

  return scored.filter((p) => p.score > 0).sort((a, b) => b.score - a.score);
}

// --------------- getQuickActions ---------------

/**
 * Returns context-aware quick action pills based on current time and day of week.
 */
export function getQuickActions(): QuickAction[] {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0 = Sunday
  const actions: QuickAction[] = [];

  // Always: near me
  actions.push({ label: '📍 Near me now', query: 'near me' });

  // Time-based second action
  if (h >= 22 || h < 2) {
    actions.push({ label: '🌙 Late night eats', query: 'late night eats' });
  } else if (h >= 6 && h < 10) {
    actions.push({ label: '🌅 Quiet morning', query: 'quiet morning spots' });
  } else if (h >= 11 && h < 14) {
    actions.push({ label: "🍜 I'm hungry", query: 'open now for lunch' });
  } else if (h >= 18) {
    actions.push({ label: "🍜 I'm hungry", query: 'open now for dinner' });
  } else {
    actions.push({ label: "🍜 I'm hungry", query: 'open now' });
  }

  // Third: context
  if (day === 0 && h < 12) {
    actions.push({ label: '☕ Sunday coffee', query: 'best coffee' });
  } else {
    actions.push({ label: '🏛 Indoors today', query: 'something fun indoors' });
  }

  return actions;
}
