import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("sort_order");

  return NextResponse.json({ subjects: subjects || [] });
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

  const { name, color } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data: maxOrder } = await supabase
    .from("subjects")
    .select("sort_order")
    .eq("workspace_id", workspace.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: subject, error } = await supabase
    .from("subjects")
    .insert({
      workspace_id: workspace.id,
      name: name.trim(),
      color: color || "#5B5BD6",
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ subject });
}
