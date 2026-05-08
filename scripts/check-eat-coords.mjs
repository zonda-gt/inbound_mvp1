import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse .env.local
const envFile = readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check restaurants_v2 — which have coords, which don't
const { data: allV2 } = await supabase
  .from("restaurants_v2")
  .select("slug, name_en, latitude, longitude");

const withCoords = allV2.filter(r => r.latitude != null && r.longitude != null);
const missing = allV2.filter(r => r.latitude == null || r.longitude == null);

console.log(`Total in restaurants_v2: ${allV2.length}`);
console.log(`With coordinates: ${withCoords.length}`);
console.log(`Missing coordinates: ${missing.length}\n`);

if (missing.length > 0) {
  console.log("--- Missing coordinates ---");
  missing.forEach(r => console.log(`  ${r.slug} (${r.name_en})`));

  // Check old table for possible slug matches
  const { data: oldAll } = await supabase
    .from("restaurants")
    .select("slug, name_en, latitude, longitude")
    .not("latitude", "is", null);

  console.log("\n--- Possible matches in old table ---");
  for (const m of missing) {
    // Try partial slug match
    const slugBase = m.slug.split("-").slice(0, 2).join("-");
    const matches = oldAll.filter(o =>
      o.slug.includes(slugBase) || o.name_en?.toLowerCase().includes(m.name_en?.toLowerCase().split(" ")[0])
    );
    if (matches.length > 0) {
      console.log(`  ${m.slug} → possible: ${matches.map(o => `${o.slug} (lat=${o.latitude})`).join(", ")}`);
    } else {
      console.log(`  ${m.slug} → NO MATCH in old table`);
    }
  }
}
