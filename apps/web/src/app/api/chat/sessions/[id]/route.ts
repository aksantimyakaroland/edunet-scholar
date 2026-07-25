import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data: existing, error: fetchError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { error } = await supabase
    .from("chat_sessions")
    .update({ title: title.trim() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing, error: fetchError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
