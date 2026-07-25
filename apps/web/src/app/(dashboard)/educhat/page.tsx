import { Suspense } from "react";
import { ChatInterface } from "@/components/educhat/ChatInterface";

export default function EduChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
