import { getSupabaseServerClient, getSupabaseClient } from "./supabase";

// Types for database records
export type ChatSession = {
  id?: string;
  created_at?: string;
  anonymous_user_id: string;
  referral_source?: string | null;
  device_type: "mobile" | "desktop";
  user_city?: string | null;
  gps_permission_status?: "granted" | "denied" | "dismissed" | null;
  entry_page: string;
  first_message?: string | null;
  message_count?: number;
  last_active_at?: string;
};

export type ChatMessage = {
  id?: string;
  session_id: string;
  created_at?: string;
  role: "user" | "assistant";
  content: string;
  user_lat?: number | null;
  user_lng?: number | null;
  tools_called?: string[] | null;
  tool_success?: boolean | null;
  is_fallback?: boolean;
  response_time_ms?: number | null;
  user_language?: string | null;
};

export type UserAction = {
  id?: string;
  created_at?: string;
  session_id: string;
  anonymous_user_id: string;
  action_type:
    | "tap_navigate"
    | "tap_taxi"
    | "tap_restaurant"
    | "tap_save"
    | "tap_show_driver"
    | "tap_suggested_question";
  action_metadata?: Record<string, any> | null;
  user_lat?: number | null;
  user_lng?: number | null;
};

/**
 * Create a new chat session (server-side)
 */
export async function createChatSession(
  session: ChatSession,
): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.warn("[Supabase] No server client — createChatSession skipped");
      return null;
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert(session)
      .select("id")
      .single();

    if (error) {
      console.error("[Supabase] Error creating chat session:", error.message, error.details, error.hint);
      return null;
    }

    console.log("[Supabase] Chat session created:", data.id);
    return data.id;
  } catch (error) {
    console.error("[Supabase] Exception creating chat session:", error);
    return null;
  }
}

/**
 * Update chat session (server-side)
 */
export async function updateChatSession(
  sessionId: string,
  updates: Partial<ChatSession>,
): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.warn("[Supabase] No server client — updateChatSession skipped");
      return;
    }

    const { error } = await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", sessionId);

    if (error) {
      console.error("[Supabase] Error updating chat session:", sessionId, error.message, error.details);
    } else {
      console.log("[Supabase] Session updated:", sessionId, "updates:", JSON.stringify(updates));
    }
  } catch (error) {
    console.error("[Supabase] Exception updating chat session:", error);
  }
}

/**
 * Log a chat message (server-side)
 */
export async function logChatMessage(message: ChatMessage): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.warn("[Supabase] No server client — logChatMessage skipped");
      return;
    }

    const { error } = await supabase.from("chat_messages").insert(message);

    if (error) {
      console.error("[Supabase] Error logging chat message:", error.message, error.details, "role:", message.role, "session:", message.session_id);
    } else {
      console.log("[Supabase] Message logged:", message.role, "session:", message.session_id, message.tools_called ? `tools: ${message.tools_called.join(",")}` : "");
    }
  } catch (error) {
    console.error("[Supabase] Exception logging chat message:", error);
  }
}

/**
 * Log a user action (client-side or server-side)
 */
export async function logUserAction(
  action: UserAction,
  useServerClient = false,
): Promise<void> {
  try {
    const supabase = useServerClient
      ? getSupabaseServerClient()
      : getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from("user_actions").insert(action);

    if (error) {
      console.error("Error logging user action:", error);
    }
  } catch (error) {
    console.error("Exception logging user action:", error);
  }
}

/**
 * Detect language from text content
 */
export function detectLanguage(text: string): string {
  // Check for CJK characters (Chinese, Japanese, Korean)
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  const cjkCount = (text.match(cjkPattern) || []).length;

  if (cjkCount / text.length > 0.3) {
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return "ja";
    if (/[\uac00-\ud7af]/.test(text)) return "ko";
    return "zh";
  }

  if (
    /\b(le|la|les|un|une|des|je|tu|il|elle|nous|vous|ils|elles)\b/i.test(text)
  ) {
    return "fr";
  }

  if (/\b(der|die|das|ich|du|er|sie|wir|ihr|sie)\b/i.test(text)) {
    return "de";
  }

  if (/\b(el|la|los|las|un|una|yo|tú|él|ella|nosotros|vosotros)\b/i.test(text)) {
    return "es";
  }

  return "en";
}

/**
 * Check if message contains navigation/food intent keywords
 */
export function hasToolIntent(message: string): boolean {
  const intentKeywords = [
    "how do i get to",
    "navigate",
    "directions",
    "take me to",
    "restaurant",
    "food",
    "eat near",
    "where can i",
    "find food",
    "what to eat",
  ];

  const lowerMessage = message.toLowerCase();
  return intentKeywords.some((keyword) => lowerMessage.includes(keyword));
}
