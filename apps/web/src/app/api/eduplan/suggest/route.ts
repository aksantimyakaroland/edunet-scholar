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

  const { title } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMMA_API_KEY not configured" }, { status: 500 });

  const client = new GemmaClient(apiKey);

  const prompt = [
    "You are EduPlan, an AI academic planner. Given a student's task title, suggest priority, estimated hours, and subtasks.",
    "Respond in valid JSON only. No markdown, no explanation.",
    "",
    "Task: " + title,
    "",
    '{"priority": "medium", "estimatedHours": 2, "suggestedDueDate": "2026-07-28", "suggestedSubtasks": ["subtask 1", "subtask 2", "subtask 3"]}',
  ].join("\n");

  try {
    let fullResponse = "";
    for await (const chunk of client.streamChat([
      { role: "user", content: prompt },
    ])) {
      fullResponse += chunk.text;
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        priority: "medium",
        estimatedHours: 1,
        suggestedSubtasks: [],
      });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      priority: suggestions.priority || "medium",
      estimatedHours: suggestions.estimatedHours || 1,
      suggestedDueDate: suggestions.suggestedDueDate || null,
      suggestedSubtasks: suggestions.suggestedSubtasks || [],
    });
  } catch {
    return NextResponse.json({
      priority: "medium",
      estimatedHours: 1,
      suggestedSubtasks: [],
    });
  }
}