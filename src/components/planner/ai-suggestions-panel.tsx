import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2, Clock } from "lucide-react";
import { getAISuggestions } from "@/lib/api/planner";
import type { PlannerTask } from "@/types/planner";

interface AISuggestionsPanelProps {
  date: string;
  tasks: PlannerTask[];
}

export function AISuggestionsPanel({ date, tasks }: AISuggestionsPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ suggestions: string[]; schedule: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (result) { setOpen(!open); return; }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const data = await getAISuggestions(date, tasks);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getAISuggestions(date, tasks);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleFetch}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
      >
        <Sparkles className="size-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">AI Plan Assistant</p>
          <p className="text-xs text-primary/60">Get schedule suggestions and productivity tips</p>
        </div>
        {loading ? (
          <Loader2 className="size-4 text-primary animate-spin shrink-0" />
        ) : open ? (
          <ChevronUp className="size-4 text-primary/60 shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-primary/60 shrink-0" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-primary/10 px-4 py-3 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-primary/70">
              <Loader2 className="size-4 animate-spin" />
              Analyzing your tasks…
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {result && !loading && (
            <>
              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-2">
                    Suggestions
                  </p>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule */}
              {result.schedule && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-2 flex items-center gap-1">
                    <Clock className="size-3" /> Suggested Schedule
                  </p>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed bg-background/60 rounded-lg px-3 py-2.5 border border-border/40">
                    {result.schedule}
                  </pre>
                </div>
              )}

              <button
                onClick={handleRefresh}
                className="text-[11px] font-mono text-primary/60 hover:text-primary transition-colors"
              >
                Regenerate ↻
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
