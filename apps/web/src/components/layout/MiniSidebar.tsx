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
} from "lucide-react";
import { MODULES } from "@edunet/shared";
import { useChatSessionsStore } from "@/stores/chat-sessions-store";

const iconMap: Record<string, typeof MessageSquare> = {
  MessageSquare,
  BookOpen,
  CalendarCheck,
};

export function MiniSidebar() {
  const pathname = usePathname();
  const setCurrentSession = useChatSessionsStore((s) => s.setCurrentSession);

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 gap-4">
      <Link
        href="/educhat"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary"
      >
        <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
      </Link>

      <Link
        href="/educhat"
        onClick={() => setCurrentSession(null)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </Link>

      <nav className="flex flex-col items-center gap-1">
        {MODULES.map((module) => {
          const Icon = iconMap[module.icon];
          const isActive = pathname.startsWith(module.href);

          return (
            <Link
              key={module.id}
              href={module.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-medium text-sidebar-foreground">
          U
        </div>
      </div>
    </aside>
  );
}
