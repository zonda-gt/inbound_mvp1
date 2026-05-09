import { NextResponse } from "next/server";
import {
  findThread,
  getOrCreateThread,
  getThreadMessages,
  requireSupabase,
} from "@/lib/concierge-server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const anonymousUserId: string | undefined = body?.anonymousUserId;
    const create: boolean = body?.create === true;
    const profile = {
      displayName: body?.displayName ?? null,
      city: body?.city ?? null,
      email: body?.email ?? null,
    };

    if (!anonymousUserId) {
      return NextResponse.json({ error: "Missing anonymousUserId" }, { status: 400 });
    }

    const supabase = requireSupabase();
    const identity = { anonymousUserId };

    const thread = create
      ? await getOrCreateThread(supabase, identity, profile)
      : await findThread(supabase, identity);

    if (!thread) {
      return NextResponse.json({ thread: null, messages: [] });
    }

    const messages = await getThreadMessages(supabase, thread.id);
    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error("[Concierge] thread POST exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
