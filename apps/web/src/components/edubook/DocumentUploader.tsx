"use client";

import { useRef, useState } from "react";
import { Upload, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentUploaderProps = {
  onUpload: (file: File) => Promise<void | { id: string }>;
  isUploading: boolean;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
];

export function DocumentUploader({ onUpload, isUploading }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function handleFile(file: File) {
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, DOCX, TXT, MD, and CSV files are supported.");
      return;
    }
    onUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Drop a file here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD, CSV
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
