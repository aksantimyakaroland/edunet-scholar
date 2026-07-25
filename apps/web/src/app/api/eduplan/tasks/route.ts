import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

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

  let query = supabase
    .from("tasks")
    .select("*")
    .order("sort_order");

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data: tasks, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: tasks || [] });
}

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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data: maxOrder } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("workspace_id", workspace.id)
    .eq("subject_id", body.subjectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspace.id,
      title: body.title.trim(),
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      due_date: body.dueDate || null,
      parent_id: body.parentId || null,
      subject_id: body.subjectId || null,
      estimated_hours: body.estimatedHours || null,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task });
}