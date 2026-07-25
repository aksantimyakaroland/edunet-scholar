"use client";

import { useEffect, useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SubjectSidebar } from "./SubjectSidebar";
import { TaskItem } from "./TaskItem";
import { SmartTaskInput } from "./SmartTaskInput";
import { DailyDigest } from "./DailyDigest";
import { StudyPlanDialog } from "./StudyPlanDialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Calendar, Loader2, BookOpen } from "lucide-react";

export function EduPlanPanel() {
  const {
    subjects,
    currentSubjectId,
    tasks,
    allTasks,
    isLoading,
    fetchTasks,
    fetchSubjects,
    setCurrentSubjectId,
    update,
  } = useTasks();
  const [planOpen, setPlanOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (currentSubjectId) {
      fetchTasks(currentSubjectId);
    }
  }, [currentSubjectId, fetchTasks]);

  useEffect(() => {
    if (subjects.length > 0 && !currentSubjectId) {
      setCurrentSubjectId(subjects[0].id);
    }
  }, [subjects, currentSubjectId, setCurrentSubjectId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = allTasks.find((t) => t.id === active.id);
    const overTask = allTasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    const newOrder = overTask.sort_order;
    await update(active.id as string, { sortOrder: newOrder });
    if (currentSubjectId) fetchTasks(currentSubjectId);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3">
        <div className="min-w-0 flex items-center gap-2">
          <Sheet>
            <SheetTrigger className="flex lg:hidden items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <BookOpen className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SubjectSidebar />
            </SheetContent>
          </Sheet>
          <div>
            <h2 className="font-heading text-sm font-semibold">EduPlan</h2>
            <p className="hidden sm:block text-xs text-muted-foreground">
              Manage tasks and plan your study schedule.
            </p>
          </div>
        </div>
        <button
          onClick={() => setPlanOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
        >
          <Calendar className="h-3.5 w-3.5" />
          Study Plan
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block w-56 shrink-0">
          <SubjectSidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            {currentSubjectId && (
              <DailyDigest />
            )}

            <div className="mt-4">
              <SmartTaskInput subjectId={currentSubjectId} />
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !currentSubjectId ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Select or create a subject to get started.
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No tasks yet. Add your first task above.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {[...tasks].sort((a, b) => a.sort_order - b.sort_order).map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>

      <StudyPlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
    </div>
  );
}
