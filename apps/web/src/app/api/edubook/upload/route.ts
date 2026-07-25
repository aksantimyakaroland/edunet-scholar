import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
  ];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("edubook-documents")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  let content = "";
  try {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const pdfText = await parser.getText();
      content = pdfText.text;
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else {
      content = buffer.toString("utf-8");
    }
  } catch (extractError) {
    console.error("Content extraction error:", extractError);
    content = "[Content extraction failed]";
  }

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspace.id,
      title: file.name,
      file_type: file.type,
      storage_path: fileName,
      content,
    })
    .select("id, title, file_type, storage_path, created_at")
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
    await supabase.storage.from("edubook-documents").remove([fileName]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: doc.id,
    name: doc.title,
    type: doc.file_type,
    storage_path: doc.storage_path,
    uploadedAt: doc.created_at,
  });
}
