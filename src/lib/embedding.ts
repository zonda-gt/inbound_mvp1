import "server-only";

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding: number[] }>;
  error?: { message?: string };
};

export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const input = text.trim();
  if (!input) {
    throw new Error("Cannot embed empty text");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI embeddings request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as OpenAIEmbeddingResponse;
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error(payload.error?.message || "OpenAI embeddings response missing data");
  }

  return embedding;
}
