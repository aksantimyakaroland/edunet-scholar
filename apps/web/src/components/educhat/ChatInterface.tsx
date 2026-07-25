"use client";

import { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { AIComposer } from "./AIComposer";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatInterface() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const { messages, isLoading, sessionLoaded, sendMessage, stop, clear } =
    useChat(sessionId);
  const { sessions } = useChatSessions();
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-sm font-semibold">
            {currentSession ? currentSession.title : "EduChat"}
          </h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear chat
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {!sessionLoaded ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onSuggestion={sendMessage} />
        ) : (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}
            <div ref={bottomRef} className="h-px w-full" />
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border bg-background pt-2">
        <AIComposer
          onSend={sendMessage}
          onStop={stop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
