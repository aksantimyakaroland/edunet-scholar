import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path, workspace_id")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", doc.workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!workspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (doc.storage_path) {
    const { error: storageError } = await supabase.storage.from("edubook-documents").remove([doc.storage_path]);
    if (storageError) {
      console.error("Failed to remove storage file:", storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Failed to delete document:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
