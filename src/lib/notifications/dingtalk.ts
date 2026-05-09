import type { BookingNotificationData } from "./email";
import { SITE_URL } from "@/lib/site";

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

export type ConciergeNotificationData = {
  threadId: string;
  displayName: string | null;
  city: string | null;
  message: string;
};

export async function sendConciergeNotification(data: ConciergeNotificationData) {
  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[DingTalk] DINGTALK_WEBHOOK_URL not configured — skipping");
    return;
  }

  const who = data.displayName ?? "Anonymous";
  const where = data.city ? ` (${data.city})` : "";
  const preview = data.message.length > 200 ? `${data.message.slice(0, 200)}…` : data.message;
  const replyUrl = `${SITE_URL}/admin/chat/${data.threadId}`;

  const markdown = [
    `### 💬 New chat message`,
    ``,
    `**${who}${where}**`,
    ``,
    `> ${preview.replace(/\n/g, "\n> ")}`,
    ``,
    `[Open thread to reply](${replyUrl})`,
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        title: `Message from ${who}`,
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
