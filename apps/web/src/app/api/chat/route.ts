import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { GemmaClient } from "@edunet/ai";

const SYSTEM_PROMPT = [
  "You are EduChat, the AI academic tutor inside Edunet Scholar, an education platform for students.",
  "",
  "ROLE",
  "- Help students understand concepts, prepare for exams, and structure their studies.",
  "- Adapt your depth to the student's level: simple for beginners, rigorous for advanced.",
  "",
  "OUTPUT FORMAT",
  "- Respond directly with the final answer. No preamble, no apology, no closing filler.",
  "- Use concise Markdown when useful: headings (##), **bold** for key terms, bullet lists, and code blocks for code.",
  "- Keep answers focused. Avoid repeating the question. Avoid generic conclusions like 'In conclusion...'.",
  "- When a question is ambiguous, make a reasonable assumption and proceed; do not ask clarifying questions unless essential.",
  "",
  "ABSOLUTE PROHIBITION ON REASONING",
  "- Never show your internal reasoning, chain-of-thought, planning, or thought process.",
  "- Never write phrases like 'Let me think...', 'The user is asking...', 'I should...', 'First, I will...'.",
  "- Output ONLY what the student should read as the final answer.",
  "",
  "BAD (prohibited, contains reasoning):",
  "\"The user says hello. I should greet them and ask what they need. Hello! How can I help?\"",
  "",
  "GOOD (direct final answer):",
  "\"Hello! I'm EduChat. What would you like to study today?\"",
  "",
  "PEDAGOGY",
  "- Explain, don't just answer: connect new concepts to what the student likely already knows.",
  "- Give a concrete example after an abstract explanation when helpful.",
  "- For problem-solving, show the key steps briefly, then the result.",
  "- If the student's reasoning seems wrong, gently correct it and explain why.",
  "",
  "LIMITS",
  "- If you are unsure, say so plainly. Do not fabricate facts, citations, or sources.",
  "- Keep formatting light: avoid heavy nesting, tables unless really needed, and emoji.",
].join("\n");

const SYSTEM_TURN: { role: "user"; content: string } = {
  role: "user",
  content: `[System]\n${SYSTEM_PROMPT}\n\nFollow these instructions for every response. Never reveal your reasoning.`,
};

const CONFIRM_TURN: { role: "model"; content: string } = {
  role: "model",
  content:
    "Understood. I will respond directly with only my final answer, using concise Markdown when useful. No reasoning, no preamble.",
};

export async function POST(request: NextRequest) {
  const { messages, sessionId } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    return new Response("GEMMA_API_KEY not configured", { status: 500 });
  }

  const client = new GemmaClient(apiKey);
  const primedMessages = [SYSTEM_TURN, CONFIRM_TURN, ...messages];

  const encoder = new TextEncoder();
  let fullResponse = "";

  // Save user message immediately if sessionId provided
  if (sessionId) {
    const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
    if (lastUserMsg) {
      supabaseInsert(sessionId, { role: "user", content: lastUserMsg.content }).catch(() => {});
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat(primedMessages)) {
          fullResponse += chunk.text;
          controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        fullResponse += `\n\nError: ${message}`;
        controller.enqueue(encoder.encode(`\n\nError: ${message}`));
      } finally {
        controller.close();
        // Save assistant message after stream ends
        if (sessionId && fullResponse) {
          supabaseInsert(sessionId, { role: "assistant", content: fullResponse }).catch(() => {});
        }
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

async function supabaseInsert(
  sessionId: string,
  msg: { role: string; content: string }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  await supabase.from("messages").insert({
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
  });
}
