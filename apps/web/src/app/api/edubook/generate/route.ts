import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GemmaClient } from "@edunet/ai";

const TYPE_PROMPTS: Record<string, string> = {
  summary:
    "Write a structured academic summary of the provided material. Include:\n- TL;DR (1-2 sentences)\n- Key sections with bullet points\n- Main takeaways\n- Important conclusions",
  key_concepts:
    "Extract and explain the key concepts from the provided material. For each concept:\n- Concept name (bold)\n- Definition\n- Example if applicable",
  quiz:
    "Generate 5-10 quiz questions based on the provided material. Number each question. After all questions, provide an answer key. Format:\n\n## Questions\n1. ...\n\n## Answer Key\n1. ...",
  study_guide:
    "Create a comprehensive study guide from the provided material. Include:\n- Summary of each major topic\n- Key terms and definitions\n- Important formulas, dates, or people\n- Connections between topics\n- Review questions",
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentIds, type } = await request.json();

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json({ error: "documentIds required" }, { status: 400 });
  }

  const typePrompt = TYPE_PROMPTS[type] || TYPE_PROMPTS.summary;

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, content")
    .in("id", documentIds);

  if (!documents || documents.length === 0) {
    return NextResponse.json({ error: "No documents found" }, { status: 404 });
  }

  const sourcesText = documents
    .map((doc) => `--- ${doc.title} ---\n${(doc.content || "").slice(0, 12000)}`)
    .join("\n\n");

  const prompt = [
    "You are EduBook, an AI tutor creating study materials from the student's course documents.",
    typePrompt,
    "",
    "Material:",
    sourcesText,
    "",
    "Generate the study material using clear markdown formatting.",
  ].join("\n");

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) return new Response("GEMMA_API_KEY not configured", { status: 500 });

  const client = new GemmaClient(apiKey);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat([
          { role: "user", content: prompt },
        ])) {
          if (request.signal.aborted) {
            controller.close();
            return;
          }
          controller.enqueue(new TextEncoder().encode(chunk.text));
        }
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("EduBook generate error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(new TextEncoder().encode(`\n\nError: ${message}`));
      } finally {
        controller.close();
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
