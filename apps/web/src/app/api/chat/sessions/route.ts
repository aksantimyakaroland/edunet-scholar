import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GemmaClient } from "@edunet/ai";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: sessions || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { title, firstMessage } = await request.json();

  const sessionTitle = title || (firstMessage
    ? firstMessage.substring(0, 40) + (firstMessage.length > 40 ? "..." : "")
    : "New Chat");

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .insert({ workspace_id: workspace.id, title: sessionTitle })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!title && firstMessage && session) {
    refineTitle(session.id, firstMessage).catch(() => {});
  }

  return NextResponse.json({ session });
}

async function refineTitle(sessionId: string, firstMessage: string) {
  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) return;

  const client = new GemmaClient(apiKey);
  const prompt = `Generate a very short title (max 5 words) for a chat conversation about: "${firstMessage}". Respond with ONLY the title, no quotes, no punctuation.`;
  let response = "";
  try {
    for await (const chunk of client.streamChat([{ role: "user", content: prompt }])) {
      response += chunk.text;
    }
  } catch {
    return;
  }

  const cleaned = response.replace(/^["'\s]+|["'\s]+$/g, "").trim();
  if (!cleaned || cleaned.length > 60) return;

  try {
    const supabase = await createClient();
    await supabase.from("chat_sessions").update({ title: cleaned }).eq("id", sessionId);
  } catch {
    // Ignore — substring title is already set
  }
}
