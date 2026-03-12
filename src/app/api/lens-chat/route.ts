import { NextRequest } from "next/server";
import { streamLensChatResponse } from "@/lib/ai-lens";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      image,
      mode,
    }: {
      messages: Array<{ role: string; content: string }>;
      image: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" };
      mode?: string;
    } = body;

    if (!messages?.length || !image?.base64) {
      return new Response(
        JSON.stringify({ error: "messages and image are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const stream = await streamLensChatResponse(messages, image, mode);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Lens chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
