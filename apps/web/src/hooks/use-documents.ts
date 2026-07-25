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
    setError,
  } = useEduBookStore();

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch("/api/edubook");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch documents");
      }
      const data = await res.json();
      if (data.documents) {
        setDocuments(
          data.documents.map((d: { id: string; title: string; file_type: string; storage_path: string; created_at: string }) => ({
            id: d.id,
            title: d.title,
            file_type: d.file_type,
            storage_path: d.storage_path ?? "",
            created_at: d.created_at,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents");
    }
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      addDocument({
        id: data.id,
        title: data.name,
        file_type: data.type,
        storage_path: data.storage_path ?? "",
        created_at: data.uploadedAt,
      });
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setError(msg);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/edubook/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Delete failed");
      }
      removeDocument(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return { documents, isUploading, upload, remove, fetchDocuments };
}
