import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerTask, TaskPriority, TaskCategory } from "@/types/planner";
import { CATEGORY_LABELS } from "@/types/planner";

interface AddTaskFormProps {
  date: string;
  onAdd: (task: Omit<PlannerTask, "id" | "createdAt" | "updatedAt">) => void;
  onCancel?: () => void;
  initialOpen?: boolean;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  high: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function AddTaskForm({ date, onAdd, onCancel, initialOpen = false }: AddTaskFormProps) {
  const [open, setOpen] = useState(initialOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("general");

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("general");
    setOpen(false);
    onCancel?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      date,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: "todo",
      category,
      order: Date.now(),
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("general");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-all text-sm"
      >
        <Plus className="size-4 shrink-0" />
        Add task for this day
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/40"
      />

      {/* Priority + Category row */}
      <div className="flex items-center gap-2 flex-wrap">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={cn(
              "px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all capitalize",
              priority === p
                ? PRIORITY_CLASSES[p]
                : "bg-muted/60 text-muted-foreground border-transparent hover:border-border"
            )}
          >
            {p}
          </button>
        ))}
        <div className="h-3 w-px bg-border/60" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TaskCategory)}
          className="text-[11px] bg-background border border-input rounded-lg px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={reset}
          className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </form>
  );
}
