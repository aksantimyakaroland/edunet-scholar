"use client";

import { useEduBookStore } from "@/stores/edubook-store";

export function useDocuments() {
  const {
    documents,
    isUploading,
    setDocuments,
    addDocument,
    removeDocument,
    setUploading,
    setLoading,
  } = useEduBookStore();

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch("/api/edubook");
      const data = await res.json();
      if (data.documents) {
        setDocuments(
          data.documents.map((d: { id: string; title: string; file_type: string; created_at: string }) => ({
            id: d.id,
            title: d.title,
            file_type: d.file_type,
            storage_path: "",
            created_at: d.created_at,
          }))
        );
      }
    } catch {}
    setLoading(false);
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/edubook/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      addDocument({
        id: data.id,
        title: data.name,
        file_type: data.type,
        storage_path: "",
        created_at: data.uploadedAt,
      });
      return data;
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/edubook/${id}`, { method: "DELETE" });
      removeDocument(id);
    } catch {}
  }

  return { documents, isUploading, upload, remove, fetchDocuments };
}
