"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { MiniSidebar } from "./MiniSidebar";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <div className="flex h-full flex-1">
        <div className="hidden lg:flex h-full">
          <AppSidebar />
        </div>

        <div className="hidden md:flex lg:hidden h-full">
          <MiniSidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border px-4 h-12 md:hidden">
            <SheetTrigger className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <span className="font-heading text-sm font-semibold">Edunet Scholar</span>
          </header>

          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>

      <SheetContent side="left" className="w-[280px] p-0">
        <AppSidebar />
      </SheetContent>
    </Sheet>
  );
}
