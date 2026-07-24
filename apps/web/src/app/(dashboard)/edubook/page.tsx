import { BookOpen } from "lucide-react";

export default function EduBookPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold">EduBook</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your knowledge spaces — upload, organize, and explore your materials.
      </p>
    </div>
  );
}
