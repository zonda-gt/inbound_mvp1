#!/usr/bin/env node
/**
 * Generate TTS audio for Pocket Phrases using OpenAI API.
 * Outputs MP3 files to public/audio/
 *
 * Usage: node scripts/generate-phrase-audio.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "audio");

// Load env
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const phrases = [
  { id: "no-spicy", text: "不要辣" },
  { id: "the-bill", text: "买单" },
  { id: "where-toilet", text: "厕所在哪里？" },
  { id: "allergic", text: "我对花生过敏" },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateAudio(phrase) {
  const outFile = path.join(OUT_DIR, `${phrase.id}.mp3`);

  console.log(`Generating: ${phrase.id} → "${phrase.text}"`);

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: phrase.text,
      voice: "nova",
      response_format: "mp3",
      speed: 0.9,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI TTS failed for "${phrase.id}": ${res.status} ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buffer);
  console.log(`  ✓ Saved ${outFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

console.log("Generating Pocket Phrases audio...\n");

for (const phrase of phrases) {
  await generateAudio(phrase);
}

console.log("\nDone! Audio files saved to public/audio/");
