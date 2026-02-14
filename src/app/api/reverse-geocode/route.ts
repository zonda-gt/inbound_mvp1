import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/google-maps";

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: "location is required" },
        { status: 400 },
      );
    }

    const result = await reverseGeocode(location);

    if (!result) {
      return NextResponse.json(
        { error: "Could not reverse geocode location" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reverse geocode API error:", error);
    return NextResponse.json(
      { error: "Reverse geocoding failed. Please try again." },
      { status: 500 },
    );
  }
}
