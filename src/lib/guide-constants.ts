// China Payment Guide — content data
// Images stored in /public/images/guides/

export const IMAGES = {
  hero: "/images/guides/hero.webp",
  alipay: "/images/guides/alipay.webp",
  wechat: "/images/guides/wechat.webp",
  qrGuide: "/images/guides/qr-guide.webp",
  cityscape: "/images/guides/cityscape.webp",
};

export const ALIPAY_STEPS = [
  {
    number: 1,
    title: "Download & Register",
    description:
      'Download the Alipay app from the App Store or Google Play. The international version defaults to English. Register using your mobile phone number — international numbers are accepted. You\'ll receive a verification code via SMS or an automated phone call.',
    warning:
      '⚠️ Download the correct app! Look for the blue icon with a white "支" character, published by "Alipay (Hangzhou) Technology Co., Ltd." Do NOT download "Alipay HK" (Hong Kong version) or "Tour Pass" (discontinued). Also note: e-SIMs often cannot receive SMS verification codes from Chinese services — use a physical SIM or register via email if possible.',
  },
  {
    number: 2,
    title: "Set Up Your Password",
    description:
      "Follow the prompts to create a login password. You'll also need to set a 6-digit payment password — remember this, as you'll need it for every transaction.",
  },
  {
    number: 3,
    title: "Verify Your Identity",
    description:
      'Tap "Me" (bottom right) → Settings (gear icon) → Account and Security → Identity Information. Tap "Basic Identity Information" and enter your name (Surname then Given Name, matching your passport), passport number, and expiry date. Then tap "Verification Photo" and upload a clear photo of your passport information page. This step is required to enable payments over ¥200 per transaction.',
  },
  {
    number: 4,
    title: "Complete Face Verification",
    description:
      "Complete the facial recognition scan when prompted. This is a standard security measure. The process usually takes just a few seconds. Once approved, your annual transaction limit increases to $50,000 USD with single transactions up to $5,000 USD.",
  },
  {
    number: 5,
    title: "Add Your International Bank Card",
    description:
      'Go to "Me" tab → "Bank Cards" → "Add Card". Enter your card number, expiry date, CVV, and country. Alipay accepts Visa, Mastercard, JCB, Diners Club, Discover, and UnionPay cards. Some cards may not work — if that happens, try a different card.',
    warning:
      "⚠️ American Express (Amex) is NOT supported by Alipay. If you only have an Amex card, you'll need an alternative. A Wise debit card (Visa) is a great backup — it offers real mid-market exchange rates and can be linked to Alipay.",
  },
  {
    number: 6,
    title: "Start Paying!",
    description:
      'You\'re all set. Use the "Scan" button on the home screen to scan merchant QR codes, or tap "Pay" to show your own QR code for the cashier to scan. Each payment requires your 6-digit payment password or biometric verification.',
  },
];

export const WECHAT_STEPS = [
  {
    number: 1,
    title: "Download & Sign Up",
    description:
      'Search for "WeChat" in the App Store or Google Play and download the app. Open it and tap "Sign Up". Register using your overseas mobile number with country code (e.g., +1 for US, +44 for UK). Verify via SMS code.',
    warning:
      "⚠️ e-SIMs often cannot receive SMS verification codes from Chinese services. If you're using an e-SIM, try registering via email instead, or use a physical SIM card that can receive international SMS.",
  },
  {
    number: 2,
    title: "Friend Verification (Critical!)",
    description:
      'New WeChat accounts frequently get flagged for "suspicious activity" and require an existing WeChat user (active for 6+ months) to scan a QR code to verify your account. This is the #1 pain point for new users.',
    warning:
      "⚠️ This is the biggest hurdle! Set up your account WEEKS before travel, not at the airport. If you get flagged: ask hotel concierge staff, Chinese colleagues or friends, or post in expat Facebook groups or r/travelchina on Reddit. Some travelers have had luck asking WeChat users at Chinese restaurants abroad.",
  },
  {
    number: 3,
    title: "Real-Name Verification (Mandatory)",
    description:
      'Go to "Me" → "Services" → "Wallet". Select "Identity Info" (or "Authentication") → "Real-Name Authentication". Upload a photo of your passport information page AND a valid visa page. Follow the prompts for Face Recognition. Wait time is usually within minutes for approval.',
  },
  {
    number: 4,
    title: "Link Your International Card",
    description:
      'Navigate to "Me" → "Services" → "Wallet" → "Cards" → "Add a Card". Enter your card number, expiry date, CVV, and billing address. Verify with an SMS code from your bank. Visa and Mastercard are accepted. Note: WeChat Pay only accepts credit cards from international users, not debit cards.',
  },
  {
    number: 5,
    title: "Set Payment Password",
    description:
      'This is essential — you need it for every payment. Go to "Me" → "Settings" → "Account & Security". Find "Payment Password" (or via Wallet → Payment Settings). Set a 6-digit PIN. Do this early, as you\'ll be prompted for it with every transaction.',
  },
];

export const COMPARISON_DATA = [
  {
    feature: "Foreigner Friendliness",
    alipay: "More foreigner-friendly, easier verification",
    wechat: "Stricter verification, can be challenging",
    winner: "alipay",
  },
  {
    feature: "App Language",
    alipay: "English (International version)",
    wechat: "English available in settings",
    winner: "tie",
  },
  {
    feature: "Accepted Cards",
    alipay: "Visa, MC, JCB, Diners, Discover, UnionPay (no Amex)",
    wechat: "Visa, Mastercard (credit only)",
    winner: "alipay",
  },
  {
    feature: "Debit Card Support",
    alipay: "Yes — debit and credit cards",
    wechat: "No — credit cards only",
    winner: "alipay",
  },
  {
    feature: "Restaurant QR Ordering",
    alipay: "Sometimes works",
    wechat: "Essential — 80% of QR menus use WeChat mini-programs",
    winner: "wechat",
  },
  {
    feature: "Metro / Transit",
    alipay: "Built-in transport codes, easy setup",
    wechat: "Mini-programs, often needs +86 number",
    winner: "alipay",
  },
  {
    feature: "Per-Transaction Limit",
    alipay: "¥5,000 (~$700 USD)",
    wechat: "¥6,500 (~$900 USD)",
    winner: "wechat",
  },
  {
    feature: "Monthly Limit",
    alipay: "¥50,000 (~$7,000 USD)",
    wechat: "¥50,000 (~$7,000 USD)",
    winner: "tie",
  },
  {
    feature: "Annual Limit",
    alipay: "¥60,000 (~$8,400 USD)",
    wechat: "¥60,000 (~$8,400 USD)",
    winner: "tie",
  },
  {
    feature: "Fee Under ¥200",
    alipay: "Free (0%)",
    wechat: "Free (0%)",
    winner: "tie",
  },
  {
    feature: "Fee Over ¥200",
    alipay: "3% service fee",
    wechat: "3% service fee",
    winner: "tie",
  },
  {
    feature: "P2P Transfers",
    alipay: "Not available with foreign cards",
    wechat: "Not available with foreign cards",
    winner: "tie",
  },
  {
    feature: "Red Packets (红包)",
    alipay: "Not available with foreign cards",
    wechat: "Not available with foreign cards",
    winner: "tie",
  },
  {
    feature: "Transport Integration",
    alipay: "Metro, buses, Didi ride-hailing",
    wechat: "Metro, buses via mini-programs",
    winner: "tie",
  },
  {
    feature: "Food Delivery",
    alipay: "Built-in Ele.me / Takeout feature",
    wechat: "Via Meituan mini-program",
    winner: "alipay",
  },
  {
    feature: "TourCard (Prepaid)",
    alipay: "Yes — up to ¥10,000, 180 days, 5% top-up fee",
    wechat: "Not available",
    winner: "alipay",
  },
  {
    feature: "Customer Support",
    alipay: "+86 571 2688 6000",
    wechat: "95017 / +86 571 95017",
    winner: "tie",
  },
];

export const FAQ_DATA = [
  {
    question: "Do I need a Chinese phone number?",
    answer:
      "No. Both Alipay and WeChat Pay accept international phone numbers for registration. You just need a number that can receive SMS verification codes. However, be aware that e-SIMs often cannot receive SMS from Chinese services — a physical SIM is more reliable. An eSIM with a local Chinese number can be helpful but is not required.",
  },
  {
    question: "What if my WeChat account needs friend verification?",
    answer:
      'This is the #1 pain point for new users. New WeChat accounts are frequently flagged and require an existing WeChat user (active 6+ months) to scan a QR code to verify you. Solutions: (1) Set up your account weeks before travel, not at the airport. (2) Ask Chinese colleagues, friends, or students. (3) Ask hotel concierge staff once you arrive. (4) Post in expat Facebook groups or r/travelchina on Reddit. (5) Some travelers have had luck asking WeChat users at Chinese restaurants abroad.',
  },
  {
    question: "Can I use cash in China?",
    answer:
      "Yes, cash (RMB/CNY) is still legal tender and businesses are required to accept it. However, many vendors — especially in cities — prefer mobile payments. Carry some small notes (¥10, ¥20, ¥50) as change can be hard to get. Cash works everywhere except for online food delivery and ride-hailing apps.",
  },
  {
    question: "Can I use Alipay/WeChat for the metro/subway?",
    answer:
      'Yes! Alipay has built-in transport codes — search "Transport" or "乘车码" in the app, select your city, and generate a QR code to scan at the turnstile. WeChat also supports metro via mini-programs, but these often require a +86 Chinese phone number, making Alipay the better choice for foreigners.',
  },
  {
    question: "What's the best backup payment method?",
    answer:
      "A Wise debit card (Visa) is the best backup. It uses the real mid-market exchange rate with low transparent fees, can be linked to Alipay for QR payments, and works internationally as a regular Visa card. Order one before your trip and load it with funds. It's also great for ATM withdrawals in China if you need cash.",
  },
  {
    question: "My real-name verification failed. What should I do?",
    answer:
      'Ensure your name is entered as "Surname Given Name" (matching your passport exactly). Upload BOTH your passport information page AND your visa page. If it still fails, contact Alipay customer service at +86 571 2688 6000 or WeChat at 95017.',
  },
  {
    question: "Can I withdraw my Alipay/WeChat balance to a foreign card?",
    answer:
      "No. You cannot withdraw balances from either app to a foreign bank card. International cards are for consumption (purchases) only. Any remaining balance stays in the app for future use.",
  },
  {
    question: "What if my account gets frozen?",
    answer:
      "This can happen due to security triggers. You may need to submit your passport, entry stamps, and proof of trip (e.g., hotel bookings, flight tickets) for manual review. This typically takes 3-5 business days.",
  },
  {
    question: "Should I set up both Alipay and WeChat Pay?",
    answer:
      "Absolutely. Setting up both apps doubles your chances of successful payment. If one card fails or one app has issues, you have a backup. Some merchants may also prefer one over the other. WeChat is essential for restaurant QR ordering (80% of QR menus use WeChat mini-programs).",
  },
  {
    question: "Do foreign credit cards work directly at stores?",
    answer:
      "Some major hotels, department stores, and international chains accept Visa/Mastercard directly, but it's unreliable. Smaller shops, restaurants, and street vendors almost exclusively use QR code payments. Linking your card to Alipay or WeChat Pay is strongly recommended.",
  },
  {
    question: "What is Alipay TourCard?",
    answer:
      "TourCard is a prepaid feature within Alipay designed for short-term visitors. It creates a temporary virtual bank account valid for 180 days with a maximum top-up of ¥10,000. It supports Visa, Mastercard, JCB, and Diners Club. Note: there's a 5% service charge per top-up, but this can be cheaper than the 3% per-transaction fee on larger purchases.",
  },
  {
    question: "Can I use Apple Pay or Google Pay in China?",
    answer:
      "Apple Pay works at some merchants with NFC terminals, but acceptance is much lower than Alipay/WeChat Pay. Google Pay is NOT supported in mainland China because Google services are blocked. Neither is a reliable primary payment method.",
  },
  {
    question: "Do I need a VPN in China?",
    answer:
      "A VPN is recommended for accessing blocked services like Google, WhatsApp, Instagram, and Facebook. However, Alipay and WeChat work without a VPN. Many travelers use an eSIM with built-in VPN capabilities for convenience. Download and configure your VPN before arriving in China.",
  },
];

export const SCENARIOS_DATA = [
  {
    emoji: "🍜",
    title: "Restaurant QR Ordering",
    description:
      'You sit down and there\'s only a QR code on the table. Scan with WeChat (not Alipay — 80% of restaurant QR menus open WeChat mini-programs). The menu appears in Chinese, you order and pay within WeChat. Use the translate feature or take a screenshot and use Google Translate.',
    app: "wechat",
  },
  {
    emoji: "🥟",
    title: "Street Food Vendor",
    description:
      'The vendor has a printed QR code on their stall. Green border = WeChat, Blue border = Alipay. Open the corresponding app, tap "Scan", point at the code, enter the amount the vendor tells you, confirm. Done in 5 seconds.',
    app: "both",
  },
  {
    emoji: "🚇",
    title: "Metro / Subway",
    description:
      'Open Alipay → search "Transport" → select your city → generate QR code → scan at the turnstile. Much easier than buying single tickets at machines with cash. Works in Shanghai, Beijing, Guangzhou, Shenzhen, and 30+ other cities.',
    app: "alipay",
  },
  {
    emoji: "☕",
    title: "Luckin' Coffee / Chain Stores",
    description:
      "Mobile payment ONLY — no cash accepted. This is increasingly common at chain stores like Luckin' Coffee, Manner, and some convenience stores. You'll order through the app or a kiosk and pay via Alipay or WeChat.",
    app: "both",
  },
  {
    emoji: "🚗",
    title: "Didi Ride-Hailing",
    description:
      "Book through the Didi app (download separately) or use Alipay's built-in Didi mini-program. Enter your destination, confirm the ride, and pay with Alipay when the ride ends. Didi has an English interface for foreigners.",
    app: "alipay",
  },
];

export const TROUBLESHOOTING_DATA = [
  {
    problem: "Card won't link",
    solution:
      "Call your bank to whitelist Chinese transactions (Alipay/Tenpay). Try a different card. Consider getting a Wise debit card (Visa) as a reliable backup.",
    severity: "high",
  },
  {
    problem: "Payment declined at vendor",
    solution:
      "Try the other app (switch between Alipay/WeChat). Check your internet connection. Offer cash as a backup. Some vendors only accept one app.",
    severity: "medium",
  },
  {
    problem: "Phone battery died",
    solution:
      "This is why you carry ¥500+ cash and a portable charger at all times. Shared power bank stations (Jiedian) are everywhere — but you need a working phone to rent one.",
    severity: "high",
  },
  {
    problem: "WeChat suspicious activity flag",
    solution:
      "Common for new accounts. Wait 24 hours and try again. If friend verification is required, ask hotel staff or post in expat groups online.",
    severity: "medium",
  },
  {
    problem: "Downloaded wrong Alipay app",
    solution:
      'Delete it and re-download the correct one. Look for the blue icon with white "支" character by "Alipay (Hangzhou) Technology Co., Ltd." — not "Alipay HK" or "Tour Pass".',
    severity: "low",
  },
  {
    problem: "No SMS verification code",
    solution:
      "Wait 2-3 minutes for international SMS delivery. If using an e-SIM, try email registration instead. Switch to a physical SIM if available. Try requesting the code again.",
    severity: "medium",
  },
];

export const CHECKLIST_DATA = {
  oneWeek: [
    "Download Alipay (correct version with blue 支 icon)",
    "Register and verify identity on Alipay",
    "Link your bank card to Alipay",
    "Consider topping up TourCard for larger purchases",
    "Download WeChat and create account",
    "Complete WeChat Pay real-name verification",
    "Link credit card to WeChat Pay",
    "Call your bank to whitelist Chinese transactions",
    "Order a Wise card as backup (if you don't have one)",
  ],
  dayBefore: [
    "Withdraw ¥500–¥1,000 cash from your bank",
    "Verify both apps work (check card is still linked)",
    "Fully charge phone + portable charger",
    "Download Amap (高德地图) for navigation",
    "Download/configure VPN",
    "Save emergency contacts (Alipay: +86 571 2688 6000, WeChat: 95017)",
  ],
  onArrival: [
    "Test a small purchase at airport convenience store",
    "Set up Alipay transport card for your city's metro",
    "Rent a shared power bank if needed",
  ],
};
