import { Check, Trash2, Circle, ChevronRight } from "lucide-react";
import type { PlannerTask } from "@/types/planner";
import { PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/planner";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: PlannerTask;
  onToggle: (task: PlannerTask) => void;
  onDelete: (id: string) => void;
  onEdit: (task: PlannerTask) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

export function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const isDone = task.status === "done";
  const isInProgress = task.status === "in-progress";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border transition-all",
        isDone
          ? "bg-muted/30 border-border/40 opacity-60"
          : isInProgress
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border/60 hover:border-border"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={cn(
          "mt-0.5 shrink-0 size-5 rounded-md border-2 flex items-center justify-center transition-all",
          isDone
            ? "bg-primary border-primary"
            : isInProgress
            ? "border-primary/60 bg-primary/10"
            : "border-border hover:border-primary/60"
        )}
      >
        {isDone ? (
          <Check className="size-3 text-primary-foreground" strokeWidth={3} />
        ) : isInProgress ? (
          <ChevronRight className="size-3 text-primary" strokeWidth={3} />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit(task)}
          className="w-full text-left"
        >
          <p className={cn(
            "text-sm font-medium leading-snug",
            isDone && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {task.description && !isDone && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
        </button>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {/* Priority dot */}
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
            {task.priority}
          </span>
          <span className="text-muted-foreground/40">·</span>
          {/* Category */}
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            CATEGORY_COLORS[task.category]
          )}>
            {CATEGORY_LABELS[task.category]}
          </span>
          {/* In-progress label */}
          {isInProgress && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] font-medium text-primary">In progress</span>
            </>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
