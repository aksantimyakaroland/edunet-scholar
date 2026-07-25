"use client";

import { useEffect, useState, useRef } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export function DailyDigest() {
  const { digest, setDigest, setDigestLoading, digestLoading, tasks, currentSubjectId } =
    useEduPlanStore();
  const [loaded, setLoaded] = useState(false);
  const prevSubjectRef = useRef(currentSubjectId);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (prevSubjectRef.current !== currentSubjectId) {
      setLoaded(false);
      prevSubjectRef.current = currentSubjectId;
    }

    if (!loaded && tasks.length > 0) {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setDigestLoading(true);
      const params = currentSubjectId ? `?subjectId=${currentSubjectId}` : "";
      fetch(`/api/eduplan/digest${params}`, {
        signal: abortRef.current.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setDigest(data);
          setLoaded(true);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.error("Failed to load digest:", err);
          setLoaded(true);
        })
        .finally(() => setDigestLoading(false));
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [tasks, loaded, currentSubjectId, setDigest, setDigestLoading]);

  if (digestLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading digest...</span>
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" />
        Today&apos;s Focus
      </div>
      <p className="text-sm leading-relaxed text-foreground">{digest.focus}</p>
      {digest.topTask && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          Start with: <span className="font-medium text-foreground">{digest.topTask}</span>
        </div>
      )}
      {digest.urgentTasks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {digest.urgentTasks.map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-1.5 text-[10px] text-muted-foreground">
        {digest.totalPending} pending task{digest.totalPending !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
