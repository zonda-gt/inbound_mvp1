// Client-side action logging utility
import { getSupabaseClient } from "./supabase";
import {
  getAnonymousUserId,
  getCurrentSessionId,
  getCurrentLocation,
} from "./tracking";

type ActionType =
  | "tap_navigate"
  | "tap_taxi"
  | "tap_restaurant"
  | "tap_save"
  | "tap_show_driver"
  | "tap_suggested_question";

/**
 * Log a user action (client-side)
 * Fire-and-forget - doesn't block the UI
 */
export async function logAction(
  actionType: ActionType,
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const sessionId = getCurrentSessionId();
    const anonymousUserId = getAnonymousUserId();

    if (!sessionId || !anonymousUserId) {
      console.warn("Cannot log action: missing session or user ID");
      return;
    }

    // Get current location (non-blocking, max 1 second)
    const location = await getCurrentLocation(1000);

    const { error } = await supabase.from("user_actions").insert({
      session_id: sessionId,
      anonymous_user_id: anonymousUserId,
      action_type: actionType,
      action_metadata: metadata || null,
      user_lat: location?.lat || null,
      user_lng: location?.lng || null,
    });

    if (error) {
      console.error("Failed to log action:", error);
    }
  } catch (error) {
    console.error("Exception logging action:", error);
  }
}
