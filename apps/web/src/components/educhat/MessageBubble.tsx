"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="font-heading mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="font-heading mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="font-heading mt-2 text-sm font-medium">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-border/50 px-1 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="my-2 overflow-x rounded-lg bg-muted p-3 text-xs leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-0.5 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-0.5 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
};

type MessageBubbleProps = {
  role: "user" | "model";
  content: string;
};

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 sm:gap-4 px-3 sm:px-4 py-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div aria-label="AI" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Bot className="h-4 w-4 text-primary" aria-hidden />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div aria-label="You" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary">
          <User className="h-4 w-4 text-primary-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}
