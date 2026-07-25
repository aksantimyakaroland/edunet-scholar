"use client";

import { useState, useRef, useEffect } from "react";
import { useEduBookStore } from "@/stores/edubook-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, FileText, Lightbulb, GraduationCap, BookOpen } from "lucide-react";

const TYPES = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "key_concepts", label: "Key Concepts", icon: Lightbulb },
  { id: "quiz", label: "Quiz", icon: GraduationCap },
  { id: "study_guide", label: "Study Guide", icon: BookOpen },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StudyGuideDialog({ open, onClose }: Props) {
  const { selectedDocIds } = useEduBookStore();
  const [type, setType] = useState("summary");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setContent("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  function handleTypeChange(newType: string) {
    abortRef.current?.abort();
    setType(newType);
    setContent("");
    setError("");
  }

  async function handleGenerate() {
    setIsLoading(true);
    setContent("");
    setError("");

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/edubook/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: selectedDocIds, type }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `Generation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setContent(buffer);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function handleClose() {
    abortRef.current?.abort();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="flex flex-col max-h-[80vh] sm:max-h-[70vh] p-0 gap-0">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="font-heading text-sm font-semibold">
            Generate Study Material
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!content && !isLoading && !error && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              {selectedDocIds.length === 0 ? (
                <p>Select documents to generate study materials.</p>
              ) : (
                <p>
                  Generate a {type.replace("_", " ")} from {selectedDocIds.length} document(s).
                </p>
              )}
            </div>
          )}
          {isLoading && !content && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {content && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || selectedDocIds.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Generating..." : `Generate ${type.replace("_", " ")}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
