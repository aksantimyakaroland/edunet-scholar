import { NextRequest } from "next/server";
import { GemmaClient } from "@edunet/ai";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    return new Response("GEMMA_API_KEY not configured", { status: 500 });
  }

  const client = new GemmaClient(apiKey);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat(messages)) {
          controller.enqueue(new TextEncoder().encode(chunk.text));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          new TextEncoder().encode(`\n\nError: ${message}`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
