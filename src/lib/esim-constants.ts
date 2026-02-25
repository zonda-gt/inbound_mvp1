export const ESIM_IMAGES = {
  hero: "/images/guides/esim/hero_banner.jpg",
  blockedApps: "/images/guides/esim/blocked_apps.png",
  esimSetup: "/images/guides/esim/esim_setup.png",
  esimVsVpn: "/images/guides/esim/esim_vs_vpn.png",
  greatFirewall: "/images/guides/esim/great_firewall.jpg",
  shanghai: "/images/guides/esim/shanghai.webp",
  esimTech: "/images/guides/esim/esim_tech.jpg",
};

export const BLOCKED_SERVICES = [
  { category: "Search", blocked: "Google, Bing (partially)", alternative: "Baidu" },
  { category: "Social Media", blocked: "Facebook, Instagram, X (Twitter)", alternative: "WeChat, Weibo" },
  { category: "Messaging", blocked: "WhatsApp, Messenger, Telegram", alternative: "WeChat" },
  { category: "Video", blocked: "YouTube, Netflix, Twitch", alternative: "Youku, iQiyi" },
  { category: "Music", blocked: "Spotify, Apple Music", alternative: "NetEase Music, QQ Music" },
  { category: "Productivity", blocked: "Google Drive, Docs, Gmail, Slack, Trello, ChatGPT", alternative: "Baidu Drive, DingTalk, Ernie Bot" },
  { category: "Maps", blocked: "Google Maps (limited)", alternative: "Baidu Maps, Amap" },
  { category: "News", blocked: "BBC, NYT, Reuters (intermittent)", alternative: "CGTN, Xinhua" },
];

export const CONNECTIVITY_OPTIONS = [
  {
    option: "Roaming (Home Carrier)",
    pros: "Zero setup required",
    cons: "Extremely expensive ($10+/day); still behind the firewall",
    verdict: "Avoid",
    verdictColor: "red",
  },
  {
    option: "Travel eSIM",
    pros: "Instant delivery; no physical swap; keeps home number active; many bypass firewall",
    cons: "Phone must be unlocked and eSIM-compatible",
    verdict: "Best Choice",
    verdictColor: "green",
  },
  {
    option: "Physical SIM (Local)",
    pros: "Get a local Chinese number; affordable plans",
    cons: "Queue at airport; passport scan; behind the firewall; VPN still needed",
    verdict: "Hassle",
    verdictColor: "orange",
  },
  {
    option: "Pocket Wi-Fi Router",
    pros: "Connects 5+ devices; large data volumes; great for groups",
    cons: "Another device to charge; limited pickup locations; bulky",
    verdict: "For Groups",
    verdictColor: "blue",
  },
  {
    option: "Public Wi-Fi",
    pros: "Free and widely available",
    cons: "Insecure; monitored; requires VPN; unreliable",
    verdict: "Risky",
    verdictColor: "red",
  },
];

export const ESIM_PROS = [
  "No VPN needed on mobile data — many plans bypass the firewall automatically",
  "Activate before you leave home",
  "Keep your regular phone number active simultaneously",
  "Instant top-up possible even while in China (provider-dependent)",
  "4G/5G speeds on major carrier networks",
  "No physical SIM swap or airport queuing",
  "More secure than public Wi-Fi",
];

export const ESIM_CONS = [
  "Phone must be unlocked and eSIM-compatible",
  "Some older or budget devices don't support eSIM",
  "Some providers route traffic through Chinese servers (privacy concern)",
  "Cannot receive SMS — affects Alipay/WeChat Pay setup",
  "VPN still needed when on hotel or café WiFi",
];

export const ESIM_PROVIDERS = [
  {
    name: "Airalo",
    tagline: "Trusted by 20M+ travelers",
    stars: 5,
    description: "The world's first and largest eSIM marketplace. Known for its user-friendly app and reliable China Unicom connectivity. Best for first-time eSIM users.",
    note: "Activation app may be inaccessible from within China — always install and activate before departure.",
    noteType: "warn" as const,
    ribbon: "Top Pick",
  },
  {
    name: "Trip.com eSIM",
    tagline: "The one-stop solution",
    stars: 5,
    description: "Seamlessly integrated with flight and hotel bookings. Widely praised for working flawlessly in China with no VPN needed.",
    note: "Can be managed and topped up from within China through the Trip.com app, which is not blocked by the firewall.",
    noteType: "ok" as const,
  },
  {
    name: "Nomad",
    tagline: "For the tech-savvy traveler",
    stars: 4,
    description: "Sleek modern app with premium network routing. $10 for 10GB is excellent value.",
    note: "Confirmed working in mountainous/rural areas (Yunnan, Guizhou) where some competitors drop signal.",
    noteType: "ok" as const,
  },
  {
    name: "Holafly",
    tagline: "Unlimited data + VPN included",
    stars: 4,
    description: "Offers unlimited data plans with built-in VPN. Works across Asia including Hong Kong. Around €45 for 15 days.",
    note: "Hotspot sharing limited to 500MB/day even on unlimited plans — if traveling as a couple, this matters.",
    noteType: "warn" as const,
  },
  {
    name: "MobiMatter",
    tagline: "Best value for data",
    stars: 4,
    description: "Best $/GB ratio on the market. 50GB for ~$30 makes it ideal for trips over 2 weeks.",
    note: "Best choice for longer stays or heavy data users who want maximum value.",
    noteType: "ok" as const,
  },
  {
    name: "Maya Mobile",
    tagline: "For heavy data users",
    stars: 4,
    description: "Flexible unlimited data plans for complete peace of mind. Ideal if you plan to stream videos or work remotely.",
    note: "Unlimited plans without the Holafly hotspot cap — better choice for remote workers or video-heavy users.",
    noteType: "ok" as const,
  },
];

export const VPN_PROVIDERS = [
  { name: "ExpressVPN", reliability: "Excellent", reliabilityColor: "green", obfuscation: "Lightway protocol", price: "~$8/mo" },
  { name: "Astrill VPN", reliability: "Excellent", reliabilityColor: "green", obfuscation: "StealthVPN mode", price: "~$10/mo" },
  { name: "NordVPN", reliability: "Good", reliabilityColor: "blue", obfuscation: "Obfuscated servers", price: "~$4/mo" },
  { name: "Surfshark", reliability: "Good", reliabilityColor: "blue", obfuscation: "Camouflage mode", price: "~$2.50/mo" },
  { name: "Free VPNs", reliability: "Avoid", reliabilityColor: "red", obfuscation: "None", price: "Free" },
];

export const VPN_PROS = [
  "Access to all blocked websites and apps",
  "Works on any device (laptop, tablet, phone)",
  "Encrypts your traffic on public Wi-Fi",
  "Can be used alongside any SIM or eSIM",
];

export const VPN_CONS = [
  "Must be installed AND tested before entering China",
  "Legal grey area — technically banned",
  "Hotel WiFi increasingly blocks standard VPN protocols",
  "Slower speeds due to encryption overhead",
  "Free VPNs are almost always blocked",
];

export const TROUBLESHOOTING_DATA = [
  { problem: "eSIM shows \"No Service\" after landing", fix: "Toggle airplane mode on/off. Go to Settings → Cellular → eSIM line → make sure Data Roaming is ON. Restart phone." },
  { problem: "eSIM works but speeds are extremely slow", fix: "Switch from auto network to manual and select China Unicom or China Mobile specifically. Disable 5G and force 4G LTE." },
  { problem: "VPN won't connect on hotel WiFi", fix: "Switch to OpenVPN TCP port 443. Enable obfuscated/stealth mode. If still failing, hotspot from your eSIM mobile data." },
  { problem: "Can't download/update apps from App Store", fix: "Toggle VPN off, download, toggle back on. Or: switch to eSIM mobile data temporarily." },
  { problem: "Alipay/WeChat asking for SMS I can't receive", fix: "Use home number (international SMS). If that fails, connect to WiFi — some verification flows send codes to email instead." },
  { problem: "eSIM data ran out, can't access provider website", fix: "Trip.com eSIM can be topped up in-app (not blocked). For others: use VPN on hotel WiFi to access the provider website." },
  { problem: "Phone won't make emergency calls", fix: "eSIMs are data-only — no voice. For emergencies, use local WiFi + WeChat voice call, or ask a local to call 110/120." },
];

export const REDDIT_QUOTES = [
  { user: "u/chang3rd", initial: "C", text: "+1 vote for the Trip.com eSIM. Works flawlessly and you can renew/extend the eSIM even when in China. No need for additional VPN if accessing apps with the eSIM." },
  { user: "u/nomad_traveler", initial: "N", text: "I used Nomad on my trip last week. Paid $10 USD for 10GB. I was able to use Facebook, Instagram, Netflix without a problem. Connection was good even in the mountains." },
  { user: "u/spystarfr", initial: "S", text: "Best is from Trip app. You don't even need a VPN + it's cheap." },
  { user: "u/airalo_user", initial: "A", text: "Using Airalo right now. Subscribed to 10-day unlimited pack. While going out, Airalo is more than enough. Once I'm back at the hotel I use LetsVPN on the hotel Wi-Fi." },
  { user: "u/holafly_fan", initial: "H", text: "I used Holafly — unlimited GB across all Asia as I went to Hong Kong as well. It had the VPN included and I didn't have any issues. Around €45 for 15 days." },
  { user: "u/kunming_traveler", initial: "K", text: "Using a Trip.com eSIM as I type. Got the China/HK/Macao 100GB/day pkg. Install was super easy on my Pixel 8. No additional VPN needed." },
];

export const VERDICT_ITEMS = [
  { label: "Best Overall", labelType: "best" as const, title: "Travel eSIM (Roaming)", description: "Get a China-specific eSIM from Trip.com, Airalo, or Nomad. No VPN needed on mobile data, instant setup, legal, and reliable." },
  { label: "Best Combo", labelType: "best" as const, title: "eSIM + VPN on Hotel Wi-Fi", description: "Use your eSIM for mobile data (no VPN needed) and keep ExpressVPN or Astrill for when you connect to hotel or café Wi-Fi." },
  { label: "For Groups", labelType: "ok" as const, title: "Pocket Wi-Fi Router", description: "If traveling with family or a team of 3+, a pocket Wi-Fi router can be more economical. Pair with a VPN." },
  { label: "Avoid", labelType: "avoid" as const, title: "Carrier Roaming / Local SIM", description: "International roaming is prohibitively expensive. Local Chinese SIMs are behind the firewall and require VPN." },
];

export const QUICK_ANSWER_DATA = [
  { label: "Short Trip (1–7 Days)", answer: "Trip.com eSIM or Airalo — cheapest, reliable, no VPN needed on mobile data. Activate before departure." },
  { label: "Long Trip (8–30 Days)", answer: "MobiMatter for best $/GB, or Holafly if you want unlimited and don't want to think about data limits." },
  { label: "Need a Chinese Phone Number", answer: "Get a physical SIM at the airport + keep your eSIM for unrestricted internet. You'll need both." },
  { label: "The Experienced Traveler Combo", answer: "eSIM for mobile data (no VPN needed) + ExpressVPN installed before departure for hotel & café WiFi." },
];

export const CHECKLIST_DATA = [
  { task: "Check your phone is eSIM-compatible and unlocked", why: "Required for any travel eSIM to work" },
  { task: "Purchase, install, activate, and test your travel eSIM", why: "Provider apps may be inaccessible from inside China" },
  { task: "Download, install, sign in, and test your VPN", why: "VPN websites are blocked in China" },
  { task: "Download VPN manual config files (OpenVPN/IKEv2) as backup", why: "Hotel networks increasingly block VPN apps" },
  { task: "Set up Alipay/WeChat Pay at home using your home phone number", why: "eSIMs can't receive SMS" },
  { task: "Download offline maps (Google Maps, Maps.me)", why: "Real-time data won't load without VPN/eSIM" },
  { task: "Save all booking confirmations offline or in screenshots", why: "You may not be able to access email or booking sites" },
  { task: "Download WeChat and set it up", why: "Essential for payments, communication, and QR codes" },
  { task: "Inform your bank you're traveling to China", why: "Prevents card blocks" },
];

export const QUICK_FACTS = [
  "3,000+ websites blocked in China",
  "eSIM works on iPhone XS+ and most Android flagships",
  "eSIM activation takes under 5 minutes",
  "eSIMs start from ~$10 for 10GB",
  "Unauthorized VPNs are technically illegal",
  "Install & TEST eSIM/VPN before you board",
  "WeChat works without a VPN",
  "eSIMs can't receive SMS for Alipay setup",
];

export const NAV_LINKS = [
  { label: "Quick Answer", href: "#quick-answer" },
  { label: "The Firewall", href: "#firewall" },
  { label: "eSIM Guide", href: "#esim" },
  { label: "VPN Guide", href: "#vpn" },
  { label: "Troubleshooting", href: "#troubleshooting" },
  { label: "Verdict", href: "#verdict" },
];
