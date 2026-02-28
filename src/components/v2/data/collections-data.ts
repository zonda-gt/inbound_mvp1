/* ─── Collection Definitions ───
   Each collection defines theme/styling + ordered list of Supabase slugs.
   All venue data (names, hooks, prices, images) comes from Supabase at render time.
   The first slug in the array is the hero card.
*/

export interface CollectionDef {
  id: string;
  title: string;
  eyebrow: string;
  desc: string;
  emoji: string;
  coverHook: string; // Short hook for DiscoverScreen cover card
  heroBg: string;
  heroNeon?: string;
  heroNeonStyle?: React.CSSProperties;
  heroEmojiStyle?: React.CSSProperties;
  isDark: boolean;
  bgColor: string;
  accentColor: string; // hex, e.g. '#FF4500'
  sectionLabel: string;
  mapText: string;
  slugs: string[]; // ordered — first = hero card
  alsoLike: { label: string; screen: string }[];
}

/* ─── Theme style generator ─── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const dk = (alpha: number) => `rgba(255,255,255,${alpha})`;

export function getThemeStyles(def: CollectionDef) {
  const { accentColor: ac, isDark } = def;

  if (isDark) {
    return {
      eyebrowColor: hexToRgba(ac, 0.8),
      titleColor: 'white',
      descColor: dk(0.7),
      heroOverlayClass: 'v2-fg-hero-overlay-dark',
      backBtnStyle: {} as React.CSSProperties,
      heroCardStyle: { background: '#141418', border: `1px solid ${hexToRgba(ac, 0.15)}` } as React.CSSProperties,
      heroHookStyle: { color: dk(0.9) } as React.CSSProperties,
      heroVenueStyle: { color: 'white' } as React.CSSProperties,
      heroCnStyle: { color: hexToRgba(ac, 0.6) } as React.CSSProperties,
      sectionLabelStyle: { color: hexToRgba(ac, 0.6) } as React.CSSProperties,
      exploreStyle: { background: hexToRgba(ac, 0.15), color: hexToRgba(ac, 0.9) } as React.CSSProperties,
      mapBtnStyle: { background: hexToRgba(ac, 0.15), border: `1px solid ${hexToRgba(ac, 0.3)}`, color: hexToRgba(ac, 0.9) } as React.CSSProperties,
      alsoLabelStyle: { color: dk(0.4) } as React.CSSProperties,
      alsoChipStyle: { background: dk(0.07), color: dk(0.6) } as React.CSSProperties,
      accentTagStyle: { background: hexToRgba(ac, 0.2), color: ac } as React.CSSProperties,
      mutedTagStyle: { background: 'rgba(255,255,255,0.08)', color: dk(0.6) } as React.CSSProperties,
      cardStyle: { background: '#141418', border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
      cardHookStyle: { color: dk(0.85) } as React.CSSProperties,
      cardNameStyle: { color: 'white' } as React.CSSProperties,
    };
  }

  // Light theme
  return {
    eyebrowColor: hexToRgba(ac, 0.7),
    titleColor: '#2a2520',
    descColor: 'rgba(40,30,20,0.65)',
    heroOverlayClass: 'v2-fg-hero-overlay-muted',
    backBtnStyle: { color: '#3a3530', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' } as React.CSSProperties,
    heroCardStyle: { background: 'white', border: '1px solid rgba(0,0,0,0.06)' } as React.CSSProperties,
    heroHookStyle: { color: '#2a2520' } as React.CSSProperties,
    heroVenueStyle: { color: '#2a2520' } as React.CSSProperties,
    heroCnStyle: { color: hexToRgba(ac, 0.6) } as React.CSSProperties,
    sectionLabelStyle: { color: hexToRgba(ac, 0.5) } as React.CSSProperties,
    exploreStyle: { background: ac, color: 'white' } as React.CSSProperties,
    mapBtnStyle: { background: hexToRgba(ac, 0.08), border: `1px solid ${hexToRgba(ac, 0.2)}`, color: ac } as React.CSSProperties,
    alsoLabelStyle: { color: 'rgba(60,40,20,0.4)' } as React.CSSProperties,
    alsoChipStyle: { background: 'rgba(60,40,20,0.06)', color: 'rgba(60,40,20,0.5)' } as React.CSSProperties,
    accentTagStyle: { background: hexToRgba(ac, 0.15), color: ac } as React.CSSProperties,
    mutedTagStyle: { background: 'rgba(60,40,20,0.08)', color: '#7a6050' } as React.CSSProperties,
    cardStyle: { background: 'white', border: '1px solid rgba(0,0,0,0.07)' } as React.CSSProperties,
    cardHookStyle: { color: '#2a2520' } as React.CSSProperties,
    cardNameStyle: { color: '#2a2520' } as React.CSSProperties,
  };
}

/* ─── 7 Collection Definitions ─── */

export const COLLECTIONS: Record<string, CollectionDef> = {
  'blow-off-steam': {
    id: 'blow-off-steam',
    title: 'Blow Off Steam',
    eyebrow: 'BLOW OFF STEAM \u00B7 SHANGHAI',
    desc: "Physical, high-energy, \"let's DO something\" \u2014 the best way to burn off jet lag or a bad day.",
    emoji: '\uD83D\uDD25',
    coverHook: 'Smash, climb, race \u2014 burn off jet lag the fun way',
    heroBg: 'linear-gradient(160deg,#1a0500 0%,#3d0800 40%,#5a1000 70%,#3d0800 100%)',
    heroEmojiStyle: { fontSize: 72 },
    isDark: true,
    bgColor: '#0A0A0F',
    accentColor: '#FF4500',
    sectionLabel: 'MORE HIGH-ENERGY',
    mapText: 'See all 7 places on map',
    slugs: [
      'cages-sports-bar-restaurant',
      'xtreme-play-sports-entertainment-world',
      'bounce-kong-super-sports-center',
      'sumaha-go-kart',
      'banana-climbing',
      'global-adventure-5d-flying-theater',
      'shanghai-happy-valley',
    ],
    alsoLike: [
      { label: 'After Dark \u2192', screen: 'after-dark' },
      { label: 'Blow Your Mind \u2192', screen: 'blow-your-mind' },
    ],
  },

  'down-the-rabbit-hole': {
    id: 'down-the-rabbit-hole',
    title: 'Down the Rabbit Hole',
    eyebrow: 'DOWN THE RABBIT HOLE \u00B7 SHANGHAI',
    desc: "Weird, immersive, \"what even IS this place\" \u2014 Shanghai's strangest corners.",
    emoji: '\uD83D\uDC07',
    coverHook: "Weird, immersive, \"what even IS this?\"",
    heroBg: 'linear-gradient(160deg,#0a0020 0%,#1a0040 40%,#300060 70%,#1a0040 100%)',
    heroEmojiStyle: { fontSize: 72 },
    heroNeon: 'ESCAPE ART',
    heroNeonStyle: { color: '#AF52DE', textShadow: '0 0 20px rgba(175,82,222,0.8)' },
    isDark: true,
    bgColor: '#0A0A0F',
    accentColor: '#AF52DE',
    sectionLabel: 'MORE WEIRD & WONDERFUL',
    mapText: 'See all 12 places on map',
    slugs: [
      'umeplay-escape-art',
      'wonderland-time-tunnel',
      'space-time-cube-metaverse-experience-hall',
      'x-meta-full-sensory-vr-theme-park',
      'rose-miracle-magic-theater',
      'daydream-pig-petting-cafe',
      'black-gold-museum',
      'shanghai-heartbreak-museum',
      'madame-tussauds-shanghai',
      'zotter-chocolate-theatre',
      'cityflight-shanghai-flight-simulator-experience',
      'time-park-indoor-adventure-center',
    ],
    alsoLike: [
      { label: 'Melt Into It \u2192', screen: 'melt-into-it' },
      { label: 'Make Something \u2192', screen: 'make-something' },
    ],
  },

  'the-long-afternoon': {
    id: 'the-long-afternoon',
    title: 'The Long Afternoon',
    eyebrow: 'THE LONG AFTERNOON \u00B7 SHANGHAI',
    desc: 'Slow, beautiful, wandering energy \u2014 galleries, gardens, and bookshops for when you want to lose track of time.',
    emoji: '\u2600\uFE0F',
    coverHook: 'Galleries, gardens, bookshops \u2014 lose track of time',
    heroBg: 'linear-gradient(160deg,#e8d8c0 0%,#d8c8b0 50%,#c8b8a0 100%)',
    heroEmojiStyle: { fontSize: 72 },
    isDark: false,
    bgColor: '#F9F7F4',
    accentColor: '#8A6A3A',
    sectionLabel: 'MORE SLOW AFTERNOONS',
    mapText: 'See all 10 places on map',
    slugs: [
      'fotografiska-shanghai',
      'museum-of-art-pudong',
      'shanghai-museum-of-glass-art',
      'west-bund-art-center',
      'van-gogh-starry-sky-art-museum',
      'shanghai-natural-history-museum',
      'tsutaya-books',
      'city-that-never-sleeps-24-hour-bookstore',
      'shanghai-greenhouse-garden',
      'queen-wait-natural-garden',
    ],
    alsoLike: [
      { label: 'Make Something \u2192', screen: 'make-something' },
      { label: 'Melt Into It \u2192', screen: 'melt-into-it' },
    ],
  },

  'blow-your-mind': {
    id: 'blow-your-mind',
    title: 'Blow Your Mind',
    eyebrow: 'BLOW YOUR MIND \u00B7 SHANGHAI',
    desc: 'Spectacle, scale, "holy shit" moments \u2014 the places that make your jaw drop.',
    emoji: '\uD83E\uDD2F',
    coverHook: 'Spectacle, scale \u2014 jaw-dropping moments',
    heroBg: 'linear-gradient(160deg,#000a1a 0%,#001530 40%,#002050 70%,#001530 100%)',
    heroEmojiStyle: { fontSize: 72 },
    heroNeon: '561 METRES UP',
    heroNeonStyle: { color: '#007AFF', textShadow: '0 0 20px rgba(0,122,255,0.8)', fontSize: 13, letterSpacing: 3 },
    isDark: true,
    bgColor: '#0A0A0F',
    accentColor: '#007AFF',
    sectionLabel: 'MORE JAW-DROPPERS',
    mapText: 'See all 9 places on map',
    slugs: [
      'shanghai-tower-top-of-shanghai-observation-deck',
      'shanghai-disneyland-resort',
      'shanghai-haichang-ocean-park',
      'shanghai-ocean-aquarium',
      'shanghai-wild-animal-park',
      'shanghai-zoo',
      'joypolis-shanghai-sega-indoor-theme-park',
      'panlong-xintiandi',
      'yaoxue-ice-snow-world',
    ],
    alsoLike: [
      { label: 'Blow Off Steam \u2192', screen: 'blow-off-steam' },
      { label: 'Down the Rabbit Hole \u2192', screen: 'down-the-rabbit-hole' },
    ],
  },

  'make-something': {
    id: 'make-something',
    title: 'Make Something',
    eyebrow: 'MAKE SOMETHING \u00B7 SHANGHAI',
    desc: "Hands-on, creative \u2014 you leave with a story (or a snack). Roll up your sleeves.",
    emoji: '\uD83C\uDFA8',
    coverHook: 'Bake, cook, craft \u2014 leave with something you made',
    heroBg: 'linear-gradient(160deg,#f0e0d0 0%,#e0d0c0 50%,#d0c0b0 100%)',
    heroEmojiStyle: { fontSize: 72 },
    isDark: false,
    bgColor: '#FDF8F3',
    accentColor: '#E67E22',
    sectionLabel: 'MORE HANDS-ON',
    mapText: 'See all 3 places on map',
    slugs: [
      'cook-book-baking-diy-experience',
      'kitchen-l-party-cooking-space',
      'party-king-entertainment-center',
    ],
    alsoLike: [
      { label: 'The Long Afternoon \u2192', screen: 'the-long-afternoon' },
      { label: 'Melt Into It \u2192', screen: 'melt-into-it' },
    ],
  },

  'melt-into-it': {
    id: 'melt-into-it',
    title: 'Melt Into It',
    eyebrow: 'MELT INTO IT \u00B7 SHANGHAI',
    desc: 'Decompress, sensory, let go \u2014 for when you need to stop moving and just breathe.',
    emoji: '\uD83E\uDEE0',
    coverHook: 'Float tanks, onsen, cat caf\u00E9s \u2014 just breathe',
    heroBg: 'linear-gradient(160deg,#001520 0%,#002030 40%,#003545 70%,#002030 100%)',
    heroEmojiStyle: { fontSize: 72 },
    isDark: true,
    bgColor: '#0A0A0F',
    accentColor: '#32ADE6',
    sectionLabel: 'MORE DECOMPRESSION',
    mapText: 'See all 4 places on map',
    slugs: [
      'joy-float-sensory-deprivation-center',
      'gokurakuyu-jinshajiang-onsen-hotel',
      'smellycat-caf',
      'the-mckinnon-hotel',
    ],
    alsoLike: [
      { label: 'The Long Afternoon \u2192', screen: 'the-long-afternoon' },
      { label: 'Down the Rabbit Hole \u2192', screen: 'down-the-rabbit-hole' },
    ],
  },

  'after-dark': {
    id: 'after-dark',
    title: 'After Dark',
    eyebrow: 'AFTER DARK \u00B7 SHANGHAI',
    desc: "Shanghai comes alive when the sun goes down. These are the places that only exist after midnight.",
    emoji: '\uD83C\uDF19',
    coverHook: 'Live music, clubs, ice bars \u2014 after midnight',
    heroBg: 'linear-gradient(160deg,#0d0208 0%,#1a0510 40%,#2d0820 70%,#1a0510 100%)',
    heroNeon: 'LIVE TONIGHT',
    heroNeonStyle: { color: '#FFB432', textShadow: '0 0 20px rgba(255,180,50,0.8)' },
    isDark: true,
    bgColor: '#0A0A0F',
    accentColor: '#FFB432',
    sectionLabel: 'ALSO AFTER DARK',
    mapText: 'See all 4 places on map',
    slugs: [
      'mengtian-music-livehouse',
      'kezee-shanghai',
      'ins-wonderland-shanghai',
      'e-ice-factory-escape-room',
    ],
    alsoLike: [
      { label: 'Blow Off Steam \u2192', screen: 'blow-off-steam' },
      { label: 'Down the Rabbit Hole \u2192', screen: 'down-the-rabbit-hole' },
    ],
  },
};

export const COLLECTION_IDS = Object.keys(COLLECTIONS);

export const COLLECTION_LIST = COLLECTION_IDS.map((id) => COLLECTIONS[id]);
