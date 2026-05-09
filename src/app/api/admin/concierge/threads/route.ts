import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/concierge-server";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("concierge_threads")
      .select("*")
      .order("last_user_message_at", { ascending: false, nullsFirst: false })
      .limit(200);

    if (error) {
      console.error("[Admin Concierge] list threads error:", error);
      return NextResponse.json({ error: "Failed to load threads" }, { status: 500 });
    }

    return NextResponse.json({ threads: data ?? [] });
  } catch (error) {
    console.error("[Admin Concierge] threads exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
