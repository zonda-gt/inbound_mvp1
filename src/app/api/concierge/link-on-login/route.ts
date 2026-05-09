import { NextResponse } from "next/server";
import { requireSupabase } from "@/lib/concierge-server";

// Stamps the existing anonymous_user_id thread with the authenticated user's
// id so history isn't orphaned the first time they sign in. Inert until
// LOGIN_ENABLED is true and the caller passes a verified userId.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const anonymousUserId: string | undefined = body?.anonymousUserId;
    const userId: string | undefined = body?.userId;

    if (!anonymousUserId || !userId) {
      return NextResponse.json(
        { error: "Missing anonymousUserId or userId" },
        { status: 400 },
      );
    }

    const supabase = requireSupabase();
    const { error } = await supabase
      .from("concierge_threads")
      .update({ user_id: userId })
      .eq("anonymous_user_id", anonymousUserId)
      .is("user_id", null);

    if (error) {
      console.error("[Concierge] link-on-login error:", error);
      return NextResponse.json({ error: "Failed to link thread" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Concierge] link-on-login exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
