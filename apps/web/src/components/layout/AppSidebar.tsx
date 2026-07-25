"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Plus,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { MODULES } from "@edunet/shared";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatSessionsStore } from "@/stores/chat-sessions-store";
import { UserMenu } from "./UserMenu";

const iconMap = {
  MessageSquare,
  BookOpen,
  CalendarCheck,
} as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { sessions, deleteSession } = useChatSessions();
  const currentSessionId = useChatSessionsStore((s) => s.currentSessionId);
  const setCurrentSession = useChatSessionsStore((s) => s.setCurrentSession);

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-sm font-semibold text-sidebar-foreground">
              Edunet Scholar
            </h1>
            <p className="text-xs text-sidebar-foreground/50">AI Workspace</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-4">
        <Link
          href="/educhat"
          onClick={() => setCurrentSession(null)}
          className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-medium text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Link>
      </div>

      <nav className="shrink-0 space-y-1 px-3 pb-4">
        {MODULES.map((module) => {
          const Icon = iconMap[module.icon as keyof typeof iconMap];
          const isActive = pathname.startsWith(module.href);

          return (
            <Link
              key={module.id}
              href={module.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {module.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 px-3 pb-2">
        <p className="px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/40">
          Recent chats
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 min-h-0">
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-sidebar-foreground/30">
            No recent chats
          </p>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                <Link
                  href={`/educhat?session=${session.id}`}
                  onClick={() => setCurrentSession(session.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 pr-8 text-sm transition-colors",
                    session.id === currentSessionId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80"
                  )}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteSession(session.id);
                    if (session.id === currentSessionId) {
                      setCurrentSession(null);
                    }
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/30 opacity-0 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground/60 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <UserMenu />
      </div>
    </aside>
  );
}
