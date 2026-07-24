"use client";

import { useState } from "react";

export type EduDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
};

export function useDocuments() {
  const [documents, setDocuments] = useState<EduDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);

    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1500));

    const doc: EduDocument = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [...prev, doc]);
    setIsUploading(false);
    return doc;
  }

  function remove(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return { documents, isUploading, upload, remove };
}
