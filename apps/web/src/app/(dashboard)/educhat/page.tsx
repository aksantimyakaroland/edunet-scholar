import { MessageSquare } from "lucide-react";

export default function EduChatPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold">EduChat</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your AI tutor — ask anything about your courses.
      </p>
    </div>
  );
}
