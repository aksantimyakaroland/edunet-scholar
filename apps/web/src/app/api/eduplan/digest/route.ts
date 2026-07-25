import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GemmaClient } from "@edunet/ai";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  let query = supabase
    .from("tasks")
    .select("title, status, priority, due_date, estimated_hours")
    .eq("workspace_id", workspace.id)
    .in("status", ["todo", "in_progress"]);

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data: tasks } = await query;

  if (tasks) {
    tasks.sort((a: { priority: string }, b: { priority: string }) =>
      (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    );
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({
      focus: "You have no pending tasks. Create tasks or generate a study plan to get started!",
      urgentTasks: [],
      totalPending: 0,
    });
  }

  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      focus: "Check your pending tasks below.",
      urgentTasks: tasks.filter((t: { priority: string }) => t.priority === "high").map((t: { title: string }) => t.title),
      totalPending: tasks.length,
    });
  }

  const client = new GemmaClient(apiKey);

  const taskList = tasks
    .map(
      (t: { title: string; priority: string; due_date: string | null; estimated_hours: number | null }) =>
        `- ${t.title} (priority: ${t.priority}${t.due_date ? `, due: ${t.due_date}` : ""}${t.estimated_hours ? `, ~${t.estimated_hours}h` : ""})`
    )
    .join("\n");

  const prompt = [
    "You are EduPlan. Given the student's pending tasks, suggest what they should focus on today.",
    "Be concise. Respond in JSON:",
    '{"focus": "1-2 sentence recommendation", "topTask": "the single most important task to do today"}',
    "",
    "Tasks:",
    taskList,
  ].join("\n");

  try {
    let fullResponse = "";
    for await (const chunk of client.streamChat([{ role: "user", content: prompt }])) {
      fullResponse += chunk.text;
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    const digest = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      focus: digest.focus || "Focus on your high-priority tasks.",
      topTask: digest.topTask || tasks[0]?.title,
      urgentTasks: tasks.filter((t: { priority: string }) => t.priority === "high").map((t: { title: string }) => t.title),
      totalPending: tasks.length,
    });
  } catch {
    return NextResponse.json({
      focus: "You have pending tasks. Start with the highest priority ones.",
      urgentTasks: tasks.filter((t: { priority: string }) => t.priority === "high").map((t: { title: string }) => t.title),
      totalPending: tasks.length,
    });
  }
}
