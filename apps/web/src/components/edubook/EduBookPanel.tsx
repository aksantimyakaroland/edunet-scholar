"use client";

import { useDocuments } from "@/hooks/use-documents";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";

export function EduBookPanel() {
  const { documents, isUploading, upload, remove } = useDocuments();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-6">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold">EduBook</h2>
        <p className="text-sm text-muted-foreground">
          Upload your course materials and create knowledge spaces.
        </p>
      </div>

      <DocumentUploader onUpload={upload} isUploading={isUploading} />
      <div className="mt-6">
        <DocumentList documents={documents} onRemove={remove} />
      </div>
    </div>
  );
}
