import { NextRequest, NextResponse } from "next/server";
import {
  searchNearbyRestaurants,
  searchNearbyAttractions,
  searchNearbyPOI,
} from "@/lib/google-maps";

const DEFAULT_LOCATION = "139.6917,35.6895"; // Fallback coordinates (Tokyo) when GPS unavailable

export async function POST(request: NextRequest) {
  try {
    const { type, keyword, location, radius } = await request.json();

    const center = location || DEFAULT_LOCATION;
    const searchRadius = radius || 1000;

    let results;
    switch (type) {
      case "restaurant":
        results = await searchNearbyRestaurants(center, keyword, searchRadius);
        break;
      case "attraction":
        results = await searchNearbyAttractions(center, keyword, searchRadius);
        break;
      case "general":
        results = await searchNearbyPOI(
          center,
          keyword || "",
          undefined,
          searchRadius,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Use: restaurant, attraction, or general" },
          { status: 400 },
        );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
