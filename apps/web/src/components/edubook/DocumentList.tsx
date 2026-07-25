"use client";

import { FileText, Trash2, CheckSquare, Square, Upload } from "lucide-react";
import { useEduBookStore, type EduBookDocument } from "@/stores/edubook-store";

type Props = {
  documents: EduBookDocument[];
  onRemove: (id: string) => void;
};

export function DocumentList({ documents, onRemove }: Props) {
  const { selectedDocIds, toggleDocSelection } = useEduBookStore();

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Upload className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No documents yet</p>
        <p className="text-xs text-muted-foreground/60">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
          {selectedDocIds.length > 0 && ` (${selectedDocIds.length} selected)`}
        </p>
      </div>
      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.id);
        return (
          <div
            key={doc.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
              isSelected
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <button
              onClick={() => toggleDocSelection(doc.id)}
              className="shrink-0"
              aria-label={isSelected ? `Deselect ${doc.title}` : `Select ${doc.title}`}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onRemove(doc.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${doc.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
