import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getThreadMessages, requireSupabase } from "@/lib/concierge-server";

type Params = { threadId: string };

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = await context.params;
    const supabase = requireSupabase();

    const { data: thread, error: threadError } = await supabase
      .from("concierge_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle();
    if (threadError) {
      console.error("[Admin Concierge] thread get error:", threadError);
      return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
    }
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const messages = await getThreadMessages(supabase, thread.id);

    // Mark this thread as read by admin (zero unread + stamp user messages).
    const now = new Date().toISOString();
    await supabase
      .from("concierge_threads")
      .update({ admin_unread_count: 0 })
      .eq("id", thread.id);
    await supabase
      .from("concierge_messages")
      .update({ read_at: now })
      .eq("thread_id", thread.id)
      .eq("sender", "user")
      .is("read_at", null);

    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error("[Admin Concierge] thread GET exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
