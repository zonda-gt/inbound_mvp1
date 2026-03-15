import type { BookingNotificationData } from "./email";

export async function sendDingTalkNotification(booking: BookingNotificationData) {
  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[DingTalk] DINGTALK_WEBHOOK_URL not configured — skipping");
    return;
  }

  const restaurantLine = booking.destinationNameCn
    ? `${booking.destinationName} (${booking.destinationNameCn})`
    : booking.destinationName;

  const markdown = [
    `### 🍽 New Booking Request`,
    ``,
    `- **Restaurant:** ${restaurantLine}`,
    `- **Date:** ${booking.bookingDate}`,
    `- **Time:** ${booking.bookingTime}`,
    `- **Party Size:** ${booking.partySize} guests`,
    `- **Guest:** ${booking.guestName}`,
    `- **Phone:** ${booking.guestPhone}`,
    `- **Email:** ${booking.guestEmail}`,
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        title: `New Booking: ${booking.destinationName}`,
        text: markdown,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DingTalk webhook failed (${response.status}): ${body}`);
  }

  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`DingTalk API error: ${result.errmsg}`);
  }
}
