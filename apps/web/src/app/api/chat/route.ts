import { NextRequest } from "next/server";
import { GemmaClient } from "@edunet/ai";

const SYSTEM_PROMPT =
  "You are EduChat, an AI academic tutor for Edunet Scholar. " +
  "You must output ONLY your final response. " +
  "Never include any reasoning, planning, or thought process.\n\n" +
  "Example of PROHIBITED output (contains reasoning):\n" +
  "\"The user says hello. I should greet them back. Hello!\"\n\n" +
  "Example of CORRECT output (direct answer only):\n" +
  "\"Hello! I'm EduChat. How can I help you with your studies today?\"";

const SYSTEM_TURN: { role: "user"; content: string } = {
  role: "user",
  content: `[System]\n${SYSTEM_PROMPT}\n\nAlways follow these instructions. Never reveal your reasoning.`,
};

const CONFIRM_TURN: { role: "model"; content: string } = {
  role: "model",
  content: "Understood. I will respond directly with only my final answer.",
};

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    return new Response("GEMMA_API_KEY not configured", { status: 500 });
  }

  const client = new GemmaClient(apiKey, SYSTEM_PROMPT);

  const primedMessages = [SYSTEM_TURN, CONFIRM_TURN, ...messages];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat(primedMessages)) {
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
