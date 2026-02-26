import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { AttractionData } from "@/types/attraction";

const ATTRACTIONS_DIR = path.join(process.cwd(), "content", "attractions");

export async function getAllAttractionSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(ATTRACTIONS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getAttractionBySlug(
  slug: string,
): Promise<AttractionData | null> {
  try {
    const filePath = path.join(ATTRACTIONS_DIR, `${slug}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw) as Omit<AttractionData, "slug">;
    if (!data.attraction_name_en || !data.attraction_name_cn) return null;
    return { ...data, slug };
  } catch {
    return null;
  }
}
