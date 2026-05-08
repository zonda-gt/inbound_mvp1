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

// 1. Fetch coordinates from old restaurants table
console.log("Fetching coordinates from old restaurants table...");
const { data: oldRows, error: oldErr } = await supabase
  .from("restaurants")
  .select("slug, latitude, longitude")
  .not("latitude", "is", null);

if (oldErr || !oldRows) {
  console.error("Error fetching old data:", oldErr?.message);
  process.exit(1);
}
console.log(`Found ${oldRows.length} restaurants with coordinates.\n`);

// 3. Copy coordinates to restaurants_v2
let updated = 0;
let skipped = 0;
for (const row of oldRows) {
  const { error } = await supabase
    .from("restaurants_v2")
    .update({ latitude: row.latitude, longitude: row.longitude })
    .eq("slug", row.slug);

  if (error) {
    console.log(`  Skip ${row.slug}: ${error.message}`);
    skipped++;
  } else {
    updated++;
  }
}

console.log(`Done! Updated: ${updated}, Skipped: ${skipped}`);

// 4. Verify
const { data: verify } = await supabase
  .from("restaurants_v2")
  .select("slug, latitude, longitude")
  .not("latitude", "is", null)
  .limit(5);

console.log("\nVerification (sample):");
verify?.forEach((r) => console.log(`  ${r.slug}: lat=${r.latitude}, lng=${r.longitude}`));
