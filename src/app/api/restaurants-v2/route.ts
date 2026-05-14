import { NextResponse } from "next/server";
import { getFeaturedRestaurants } from "@/lib/curated-restaurants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || undefined;
    const restaurants = await getFeaturedRestaurants(8, city);
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("[Restaurants V2 API] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
