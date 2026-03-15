import { Resend } from "resend";

const OWNER_EMAIL = "stevezhangh97@qq.com";

export type BookingNotificationData = {
  id: string;
  destinationName: string;
  destinationNameCn: string | null;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
};

export async function sendBookingEmail(booking: BookingNotificationData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping email");
    return;
  }

  const resend = new Resend(apiKey);

  const restaurantLine = booking.destinationNameCn
    ? `${booking.destinationName} (${booking.destinationNameCn})`
    : booking.destinationName;

  const { error } = await resend.emails.send({
    from: "HelloChina <onboarding@resend.dev>",
    to: OWNER_EMAIL,
    subject: `New Booking: ${booking.destinationName} — ${booking.bookingDate}`,
    html: `
      <h2 style="font-family:sans-serif;">New Booking Request</h2>
      <table style="border-collapse:collapse; font-family:sans-serif; font-size:14px;">
        <tr><td style="padding:8px 14px; font-weight:bold; color:#333;">Restaurant</td><td style="padding:8px 14px;">${restaurantLine}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 14px; font-weight:bold; color:#333;">Date</td><td style="padding:8px 14px;">${booking.bookingDate}</td></tr>
        <tr><td style="padding:8px 14px; font-weight:bold; color:#333;">Time</td><td style="padding:8px 14px;">${booking.bookingTime}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 14px; font-weight:bold; color:#333;">Party Size</td><td style="padding:8px 14px;">${booking.partySize} guests</td></tr>
        <tr><td style="padding:8px 14px; font-weight:bold; color:#333;">Guest Name</td><td style="padding:8px 14px;">${booking.guestName}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 14px; font-weight:bold; color:#333;">Phone</td><td style="padding:8px 14px;">${booking.guestPhone}</td></tr>
        <tr><td style="padding:8px 14px; font-weight:bold; color:#333;">Email</td><td style="padding:8px 14px;">${booking.guestEmail}</td></tr>
      </table>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
