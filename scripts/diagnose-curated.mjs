import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse .env.local manually
const envFile = readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("Supabase URL:", url ? url.substring(0, 30) + "..." : "MISSING");
console.log("Service key:", key ? "SET (" + key.length + " chars)" : "MISSING");

if (!url || !key) process.exit(1);

const supabase = createClient(url, key);

// 1. Check restaurants table
const { data: rows, error: rowsErr } = await supabase
  .from("restaurants")
  .select("slug, name_en")
  .limit(5);

console.log("\n--- Restaurants table ---");
if (rowsErr) {
  console.log("Error:", rowsErr.message);
} else {
  console.log("Sample rows:", rows?.length || 0);
  rows?.forEach((r) => console.log("  -", r.slug, "|", r.name_en));
}

// 2. Check embeddings
const { data: embRows, error: embErr } = await supabase
  .from("restaurants")
  .select("slug")
  .not("embedding", "is", null)
  .limit(3);

console.log("\n--- Embeddings ---");
if (embErr) {
  console.log("Error:", embErr.message);
} else {
  console.log("Restaurants with embeddings:", embRows?.length || 0);
  embRows?.forEach((r) => console.log("  -", r.slug));
}

// 3. Get a real embedding for "what to eat in shanghai"
const openaiKey = process.env.OPENAI_API_KEY;
let realEmbedding;
if (openaiKey) {
  console.log("\n--- Embedding test ---");
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: "food restaurant eat shanghai" }),
  });
  if (resp.ok) {
    const body = await resp.json();
    realEmbedding = body.data?.[0]?.embedding;
    console.log("Got embedding, length:", realEmbedding?.length);
  } else {
    console.log("OpenAI error:", resp.status, await resp.text());
  }
} else {
  console.log("\nOPENAI_API_KEY missing, using zero vector");
}

// 3. Test RPC
const zeros = "[" + new Array(1536).fill(0).join(",") + "]";
const embVector = realEmbedding ? "[" + realEmbedding.join(",") + "]" : zeros;
const { data: rpcData, error: rpcErr } = await supabase.rpc(
  "search_restaurants_hybrid",
  {
    query_embedding: embVector,
    filter_category: null,
    max_price: null,
    user_lat: null,
    user_lng: null,
    max_distance_km: 50,
    match_limit: 3,
    similarity_threshold: 0.1,
  },
);

// 4. City filter check
const { data: allRows } = await supabase.from("restaurants").select("slug, address");
const shanghaiTokens = ["上海", "shanghai"];
const matching = allRows.filter((r) => shanghaiTokens.some((t) => (r.address || "").toLowerCase().includes(t)));
const excluded = allRows.filter((r) => shanghaiTokens.every((t) => (r.address || "").toLowerCase().indexOf(t) === -1));
console.log("\n--- City filter check ---");
console.log("Addresses containing shanghai/上海:", matching.length, "of", allRows.length);
console.log("Addresses EXCLUDED by city filter:", excluded.length);
excluded.slice(0, 5).forEach((r) => console.log("  EXCLUDED:", r.slug, "|", (r.address || "").substring(0, 60)));

console.log("\n--- RPC search_restaurants_hybrid ---");
if (rpcErr) {
  console.log("Error:", rpcErr.message);
  console.log("Code:", rpcErr.code);
  console.log("Details:", rpcErr.details);
} else {
  console.log("Results:", rpcData?.length || 0);
  rpcData?.forEach((r) => console.log("  -", r.slug, "| similarity:", r.similarity));
}
