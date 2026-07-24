import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { GemmaClient } from "@edunet/ai";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, documentIds } = await request.json();

  if (!question || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json({ error: "Question and documentIds required" }, { status: 400 });
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, content")
    .in("id", documentIds);

  if (!documents || documents.length === 0) {
    return NextResponse.json({ error: "No documents found" }, { status: 404 });
  }

  const sourcesText = documents
    .map(
      (doc, i) =>
        `[${i + 1}] (filename: "${doc.title}")\n> ${(doc.content || "").slice(0, 8000)}`
    )
    .join("\n\n");

  const prompt = [
    "You are EduBook, an AI tutor analyzing the student's uploaded course materials.",
    "Answer the question using ONLY the provided sources below.",
    "For each claim, cite the source as [N] at the end of the relevant sentence or paragraph.",
    "If the sources don't contain the answer, say so clearly.",
    "",
    "Sources:",
    sourcesText,
    "",
    "Question: " + question,
    "Answer:",
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
          controller.enqueue(new TextEncoder().encode(chunk.text));
        }
        const sourcesList = documents
          .map((doc, i) => `[${i + 1}] ${doc.title}`)
          .join("\n");
        controller.enqueue(
          new TextEncoder().encode(`\n\n**Sources:**\n${sourcesList}`)
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(new TextEncoder().encode(`\n\nError: ${message}`));
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