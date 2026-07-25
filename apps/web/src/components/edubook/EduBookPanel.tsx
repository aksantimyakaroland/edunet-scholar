"use client";

import { useEffect, useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { useEduBookStore } from "@/stores/edubook-store";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { EduBookChatPanel } from "./EduBookChatPanel";
import { StudyGuideDialog } from "./StudyGuideDialog";
import { FileText, BookOpen, MessageSquare } from "lucide-react";

export function EduBookPanel() {
  const { documents, isUploading, upload, remove, fetchDocuments } = useDocuments();
  const { selectedDocIds } = useEduBookStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-semibold">EduBook</h2>
          <p className="hidden sm:block text-xs text-muted-foreground">
            Upload course materials and ask questions about them.
          </p>
        </div>
        {selectedDocIds.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                showChat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => setShowChat(false)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                !showChat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Docs
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              onClick={() => setGuideOpen(true)}
              disabled={selectedDocIds.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-40"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Generate
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showChat ? (
          <div className="flex flex-1 flex-col">
            <EduBookChatPanel />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-3xl">
              <DocumentUploader onUpload={upload} isUploading={isUploading} />
              <div className="mt-6">
                <DocumentList documents={documents} onRemove={remove} />
              </div>
            </div>
          </div>
        )}
      </div>

      <StudyGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
