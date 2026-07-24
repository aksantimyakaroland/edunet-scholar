"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookOpen,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { MODULES } from "@edunet/shared";

const iconMap = {
  MessageSquare,
  BookOpen,
  CalendarCheck,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 px-6 pt-6 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-sm font-semibold text-sidebar-foreground">
            Edunet Scholar
          </h1>
          <p className="text-xs text-sidebar-foreground/50">
            AI Workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
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

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent" />
          <span className="text-sidebar-foreground/80">User</span>
        </div>
      </div>
    </aside>
  );
}
