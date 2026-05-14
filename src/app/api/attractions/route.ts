import { NextResponse } from "next/server";
import { getAttractionBySlug, getAllAttractions, getAttractionsBySlugs, getAttractionsByCity } from "@/lib/attractions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const slugs = searchParams.get("slugs");
    const city = searchParams.get("city");
    const limitParam = searchParams.get("limit");

    // Batch fetch by slugs (comma-separated)
    if (slugs) {
      const slugArray = slugs.split(",").map((s) => s.trim()).filter(Boolean);
      if (slugArray.length === 0) {
        return NextResponse.json({ attractions: [] });
      }
      const attractions = await getAttractionsBySlugs(slugArray);
      return NextResponse.json({ attractions });
    }

    // Single attraction by slug
    if (slug) {
      const attraction = await getAttractionBySlug(slug);
      if (!attraction) {
        return NextResponse.json(
          { error: "Attraction not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ attraction });
    }

    // Fetch by city (featured list for Discover)
    if (city) {
      const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 12)) : 12;
      const attractions = await getAttractionsByCity(city, limit);
      return NextResponse.json({ attractions });
    }

    // List all attractions (for browse)
    const attractions = await getAllAttractions();
    return NextResponse.json({ attractions });
  } catch (error) {
    console.error("[Attractions API] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
