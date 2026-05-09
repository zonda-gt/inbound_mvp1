import { NextResponse } from "next/server";
import { findThread, requireSupabase } from "@/lib/concierge-server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const anonymousUserId: string | undefined = body?.anonymousUserId;
    if (!anonymousUserId) {
      return NextResponse.json({ error: "Missing anonymousUserId" }, { status: 400 });
    }

    const supabase = requireSupabase();
    const thread = await findThread(supabase, { anonymousUserId });
    if (!thread) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();
    const [threadUpdate, messagesUpdate] = await Promise.all([
      supabase
        .from("concierge_threads")
        .update({ user_unread_count: 0 })
        .eq("id", thread.id),
      supabase
        .from("concierge_messages")
        .update({ read_at: now })
        .eq("thread_id", thread.id)
        .eq("sender", "admin")
        .is("read_at", null),
    ]);

    if (threadUpdate.error) console.error("[Concierge] read thread err:", threadUpdate.error);
    if (messagesUpdate.error) console.error("[Concierge] read messages err:", messagesUpdate.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Concierge] read POST exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
