import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { GemmaClient } from "@edunet/ai";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
  );

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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { title, firstMessage } = await request.json();

  let sessionTitle = title || "New Chat";

  if (!title && firstMessage) {
    try {
      const apiKey = process.env.GEMMA_API_KEY;
      if (apiKey) {
        const client = new GemmaClient(apiKey);
        const prompt = `Generate a very short title (max 5 words) for a chat conversation about: "${firstMessage}". Respond with ONLY the title, no quotes, no punctuation.`;
        let response = "";
        for await (const chunk of client.streamChat([{ role: "user", content: prompt }])) {
          response += chunk.text;
        }
        const cleaned = response.replace(/^["'\s]+|["'\s]+$/g, "").trim();
        if (cleaned.length > 0 && cleaned.length <= 60) {
          sessionTitle = cleaned;
        }
      }
    } catch {}
  }

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .insert({ workspace_id: workspace.id, title: sessionTitle })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session });
}
