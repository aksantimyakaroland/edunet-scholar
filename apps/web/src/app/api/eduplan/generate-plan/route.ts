import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GemmaClient } from "@edunet/ai";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt: userPrompt, documentIds } = await request.json();
  if (!userPrompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  let documentsText = "";
  if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
    const { data: documents } = await supabase
      .from("documents")
      .select("title, content")
      .in("id", documentIds);

    if (documents) {
      documentsText = documents
        .map((d) => `--- ${d.title} ---\n${(d.content || "").slice(0, 4000)}`)
        .join("\n\n");
    }
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMMA_API_KEY not configured" }, { status: 500 });

  const client = new GemmaClient(apiKey);

  const systemPrompt = [
    "You are EduPlan, an AI academic planner. Create a detailed study plan broken into weeks.",
    "For each week, provide a title, description, and 3-6 specific tasks with estimated hours.",
    "Format as valid JSON:",
    '{ "weeks": [{ "title": "Week 1: ...", "description": "...", "tasks": [{ "title": "...", "estimatedHours": 2 }] }] }',
    "Respond in valid JSON only.",
  ].join("\n");

  let fullResponse = "";
  try {
    for await (const chunk of client.streamChat([
      { role: "user", content: systemPrompt },
      { role: "model", content: "I will output only valid JSON." },
      {
        role: "user",
        content: `Student request: ${userPrompt}\n\n${documentsText ? `Source materials:\n${documentsText}` : ""}`,
      },
    ])) {
      fullResponse += chunk.text;
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const plan = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({
      plan: {
        weeks: [
          {
            title: "Study Plan",
            description: "Could not generate a structured plan. Please try again with more details.",
            tasks: [{ title: userPrompt, estimatedHours: 1 }],
          },
        ],
      },
    });
  }
}
