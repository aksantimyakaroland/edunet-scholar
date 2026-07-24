"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { AIComposer } from "./AIComposer";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatInterface() {
  const { messages, isLoading, sendMessage, stop, clear } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="font-heading text-sm font-semibold">EduChat</h2>
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
        {messages.length === 0 ? (
          <EmptyState onSuggestion={sendMessage} />
        ) : (
          <div className="mx-auto max-w-3xl py-4">
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
