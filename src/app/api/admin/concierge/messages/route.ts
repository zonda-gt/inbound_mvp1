import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/concierge-server";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const threadId: string | undefined = body?.threadId;
    const content: string | undefined = body?.content;

    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: "Missing threadId or content" }, { status: 400 });
    }

    const trimmed = content.trim().slice(0, 4000);
    const supabase = requireSupabase();

    const { data: thread, error: threadError } = await supabase
      .from("concierge_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle();
    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data: message, error: insertError } = await supabase
      .from("concierge_messages")
      .insert({
        thread_id: thread.id,
        sender: "admin",
        content: trimmed,
      })
      .select("*")
      .single();
    if (insertError) {
      console.error("[Admin Concierge] insert reply error:", insertError);
      return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("concierge_threads")
      .update({
        last_admin_message_at: now,
        user_unread_count: thread.user_unread_count + 1,
      })
      .eq("id", thread.id);
    if (updateError) {
      console.error("[Admin Concierge] update thread error:", updateError);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[Admin Concierge] reply POST exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
