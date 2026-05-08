import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Manual slug mapping: v2 slug → old table slug
const SLUG_MAP = {
  "coa": "coa-shanghai",
  "rose-hall-shanghainese": "rose-hall-shanghai-cuisine",
  "shu-tan-ji-zigong-salt-cuisine": "shu-tanji-yanbang-sichuan-cuisine",
  "asa-middle-eastern-cuisine": "asa-middle-eastern-cuisine-halal",
  "maria-muslim-restaurant": "maria-muslim-halal-restaurant",
  "commune": "commune-reserve",
  "qingting-chengdu-fresh-hotpot": "qingting-chengdu-fresh-goods-hot-pot",
  "sultan-turkish-restaurant": "sultan",
  "yuan-gu-yun-jing": "yuangu-yunjing",
  "halal-ningxia-yanchi-tan-yang": "halal-ningxia-yanchi-tan-lamb",
  "jesse": "jesse-restaurant",
  "carter": "carter-bar",
  "chan-san-chi-crab-xiaolongbao": "chan-san-chi-crab-roe-xiaolongbao",
  "peekazoo-cocktail-bar": "peekazoo",
  "the-boiling-crab": "the-boiling-crab-seafood-bar",
};

// Fetch coords from old table for mapped slugs
const oldSlugs = Object.values(SLUG_MAP);
const { data: oldRows } = await supabase
  .from("restaurants")
  .select("slug, latitude, longitude")
  .in("slug", oldSlugs);

const oldBySlug = new Map(oldRows.map(r => [r.slug, r]));

let updated = 0;
for (const [v2Slug, oldSlug] of Object.entries(SLUG_MAP)) {
  const old = oldBySlug.get(oldSlug);
  if (!old) {
    console.log(`  No old data for ${v2Slug} (${oldSlug})`);
    continue;
  }
  const { error } = await supabase
    .from("restaurants_v2")
    .update({ latitude: old.latitude, longitude: old.longitude })
    .eq("slug", v2Slug);
  if (error) {
    console.log(`  Error updating ${v2Slug}: ${error.message}`);
  } else {
    console.log(`  ${v2Slug} → lat=${old.latitude}, lng=${old.longitude}`);
    updated++;
  }
}
console.log(`\nUpdated ${updated} from slug mapping.`);

// For the 4 with no match, use Amap geocoding or manual coords
// simiantai, cheonghakgol-korean-bbq, sushisho-kappo-cuisine, yangege-yunnan-mushroom-hot-pot
// Using approximate Shanghai coordinates from Amap/Dianping
const MANUAL = [
  { slug: "simiantai", lat: 31.2179, lng: 121.4556, name: "Simiantai" },
  { slug: "cheonghakgol-korean-bbq", lat: 31.2355, lng: 121.5135, name: "Cheonghakgol Korean BBQ (Pudong)" },
  { slug: "sushisho-kappo-cuisine", lat: 31.2290, lng: 121.4892, name: "Sushisho Kappo Cuisine" },
  { slug: "yangege-yunnan-mushroom-hot-pot", lat: 31.2340, lng: 121.4410, name: "Yangege Yunnan Mushroom Hot Pot" },
];

console.log("\n--- Manual coordinates ---");
for (const m of MANUAL) {
  const { error } = await supabase
    .from("restaurants_v2")
    .update({ latitude: m.lat, longitude: m.lng })
    .eq("slug", m.slug);
  if (error) {
    console.log(`  Error updating ${m.slug}: ${error.message}`);
  } else {
    console.log(`  ${m.slug} → lat=${m.lat}, lng=${m.lng}`);
    updated++;
  }
}

// Final verification
const { data: stillMissing } = await supabase
  .from("restaurants_v2")
  .select("slug, name_en")
  .or("latitude.is.null,longitude.is.null");

console.log(`\nStill missing: ${stillMissing?.length || 0}`);
if (stillMissing?.length) {
  stillMissing.forEach(r => console.log(`  ${r.slug} (${r.name_en})`));
}
