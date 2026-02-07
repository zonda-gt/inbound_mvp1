import { NextRequest, NextResponse } from "next/server";
import { getChatResponse } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { messages, origin } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const result = await getChatResponse(messages, origin);

    return NextResponse.json({
      response: result.text,
      navigationData: result.navigationData || null,
      placesData: result.placesData || null,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
