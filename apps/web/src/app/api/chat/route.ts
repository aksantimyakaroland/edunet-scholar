import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, sessionId } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    return new Response("GEMMA_API_KEY not configured", { status: 500 });
  }

  // Verify session ownership if sessionId provided
  if (sessionId) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (workspace) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("workspace_id", workspace.id)
        .single();

      if (!session) {
        return new Response("Session not found", { status: 404 });
      }
    }
  }

  const client = new GemmaClient(apiKey);
  const primedMessages = [SYSTEM_TURN, CONFIRM_TURN, ...messages];

  const encoder = new TextEncoder();
  let fullResponse = "";

  // Save user message immediately if sessionId provided
  if (sessionId) {
    const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
    if (lastUserMsg) {
      supabaseInsert(sessionId, { role: "user", content: lastUserMsg.content }).catch(
        (err) => console.error("Failed to persist user message:", err)
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat(primedMessages)) {
          if (request.signal.aborted) {
            controller.close();
            return;
          }
          fullResponse += chunk.text;
          controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("Chat stream error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        fullResponse += `\n\nError: ${message}`;
        controller.enqueue(encoder.encode(`\n\nError: ${message}`));
      } finally {
        controller.close();
        if (sessionId && fullResponse) {
          supabaseInsert(sessionId, { role: "assistant", content: fullResponse }).catch(
            (err) => console.error("Failed to persist assistant message:", err)
          );
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

async function supabaseInsert(
  sessionId: string,
  msg: { role: string; content: string }
) {
  const supabase = await createClient();
  await supabase.from("messages").insert({
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
  });
}
