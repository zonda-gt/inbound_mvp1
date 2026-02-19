import { NextResponse } from "next/server";
import { getCuratedRestaurantsBySlugs } from "@/lib/curated-restaurants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slugsParam = searchParams.get("slugs");

    if (!slugsParam) {
      return NextResponse.json(
        { error: "Missing required parameter: slugs" },
        { status: 400 },
      );
    }

    const slugs = slugsParam.split(",").filter(Boolean);
    if (slugs.length === 0) {
      return NextResponse.json({ restaurants: [] });
    }

    const restaurants = await getCuratedRestaurantsBySlugs(slugs);
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("[CuratedRestaurants API] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
