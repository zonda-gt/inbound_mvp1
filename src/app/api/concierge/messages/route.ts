import { NextResponse } from "next/server";
import {
  getOrCreateThread,
  requireSupabase,
} from "@/lib/concierge-server";
import { sendConciergeNotification } from "@/lib/notifications/dingtalk";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const anonymousUserId: string | undefined = body?.anonymousUserId;
    const content: string | undefined = body?.content;
    const profile = {
      displayName: body?.displayName ?? null,
      city: body?.city ?? null,
      email: body?.email ?? null,
    };

    if (!anonymousUserId || !content?.trim()) {
      return NextResponse.json({ error: "Missing anonymousUserId or content" }, { status: 400 });
    }

    const trimmed = content.trim().slice(0, 4000);
    const supabase = requireSupabase();

    const thread = await getOrCreateThread(supabase, { anonymousUserId }, profile);

    const now = new Date().toISOString();
    const { data: message, error: insertError } = await supabase
      .from("concierge_messages")
      .insert({
        thread_id: thread.id,
        sender: "user",
        content: trimmed,
      })
      .select("*")
      .single();
    if (insertError) {
      console.error("[Concierge] insert message error:", insertError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("concierge_threads")
      .update({
        last_user_message_at: now,
        admin_unread_count: thread.admin_unread_count + 1,
      })
      .eq("id", thread.id);
    if (updateError) {
      console.error("[Concierge] update thread error:", updateError);
    }

    sendConciergeNotification({
      threadId: thread.id,
      displayName: thread.display_name ?? profile.displayName,
      city: thread.city ?? profile.city,
      message: trimmed,
    }).catch((err) =>
      console.error("[Concierge] DingTalk notification failed:", err),
    );

    return NextResponse.json({ message, thread });
  } catch (error) {
    console.error("[Concierge] messages POST exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
