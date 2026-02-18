import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { messageId, sessionId, rating, feedbackText, userQuery } =
      await request.json();

    // Validate required fields
    if (!messageId || !sessionId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: messageId, sessionId, rating" },
        { status: 400 },
      );
    }

    if (rating !== "up" && rating !== "down") {
      return NextResponse.json(
        { error: "Rating must be 'up' or 'down'" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    // Upsert: if a row with the same message_id exists, update it
    const { error } = await supabase
      .from("message_feedback")
      .upsert(
        {
          message_id: messageId,
          session_id: sessionId,
          rating,
          feedback_text: feedbackText || null,
          user_query: userQuery || null,
        },
        { onConflict: "message_id" },
      );

    if (error) {
      console.error("[Feedback] Error saving feedback:", error.message, error.details);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Feedback] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
