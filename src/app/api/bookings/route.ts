import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { sendDingTalkNotification } from "@/lib/notifications/dingtalk";

export async function POST(request: Request) {
  try {
    const {
      destinationName,
      bookingDate,
      bookingTime,
      partySize,
      guestName,
      guestPhone,
      guestEmail,
    } = await request.json();

    if (!destinationName || !bookingDate || !bookingTime || !guestName || !guestPhone || !guestEmail) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
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

    // Best-effort lookup of Chinese name
    let destinationNameCn: string | null = null;
    const { data: restaurant } = await supabase
      .from("restaurants_v2")
      .select("name_cn")
      .eq("name_en", destinationName)
      .limit(1)
      .maybeSingle();
    if (restaurant?.name_cn) {
      destinationNameCn = restaurant.name_cn;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        destination_name: destinationName,
        destination_name_cn: destinationNameCn,
        booking_date: bookingDate,
        booking_time: bookingTime,
        party_size: partySize,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Bookings] Error creating booking:", error.message, error.details);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 },
      );
    }

    // Fire-and-forget notifications
    const details = {
      id: data.id,
      destinationName,
      destinationNameCn,
      bookingDate,
      bookingTime,
      partySize,
      guestName,
      guestPhone,
      guestEmail,
    };

    sendDingTalkNotification(details).catch((err) =>
      console.error("[Bookings] DingTalk notification failed:", err),
    );

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("[Bookings] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
