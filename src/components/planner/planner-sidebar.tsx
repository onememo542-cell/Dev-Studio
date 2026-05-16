import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerTask } from "@/types/planner";

interface PlannerSidebarProps {
  selectedDate: string;
  weekStart: Date;
  tasks: PlannerTask[];
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddTask: () => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PlannerSidebar({
  selectedDate,
  weekStart,
  tasks,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddTask,
}: PlannerSidebarProps) {
  const today = toDateStr(new Date());
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} – ${
    weekStart.getMonth() !== weekEnd.getMonth() ? MONTH_NAMES[weekEnd.getMonth()] + " " : ""
  }${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = toDateStr(d);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const done = dayTasks.filter((t) => t.status === "done").length;
    return { date: d, dateStr, dayTasks, done, name: DAY_NAMES[i] };
  });

  const weekTotal = weekDays.reduce((a, d) => a + d.dayTasks.length, 0);
  const weekDone = weekDays.reduce((a, d) => a + d.done, 0);
  const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Week nav header */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onPrevWeek}
            className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={onToday}
            className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/60"
          >
            {weekLabel}
          </button>
          <button
            onClick={onNextWeek}
            className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Today shortcut */}
        <button
          onClick={onToday}
          className="w-full text-[10px] font-medium text-primary/80 hover:text-primary transition-colors py-1 hover:bg-primary/5 rounded-lg"
        >
          Jump to today
        </button>
      </div>

      <div className="shrink-0 h-px bg-border/60 mx-3" />

      {/* Week days */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
        {weekDays.map(({ date, dateStr, dayTasks, done, name }) => {
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const total = dayTasks.length;
          const allDone = total > 0 && done === total;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left",
                isSelected
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : isToday
                  ? "bg-primary/5 text-primary/80 hover:bg-primary/10"
                  : isWeekend
                  ? "text-muted-foreground/60 hover:bg-muted/40 hover:text-muted-foreground"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              {/* Day number */}
              <div className={cn(
                "size-7 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0",
                isToday && !isSelected && "bg-primary text-primary-foreground",
                isSelected && !isToday && "bg-primary/20",
              )}>
                {date.getDate()}
              </div>

              {/* Day name + task info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{name}</p>
                {total > 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    {done}/{total} done
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50">No tasks</p>
                )}
              </div>

              {/* Progress dots */}
              {total > 0 && (
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: Math.min(total, 5) }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1.5 rounded-full",
                        i < done ? "bg-primary" : "bg-border"
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 h-px bg-border/60 mx-3" />

      {/* Week summary */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Week
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {weekDone}/{weekTotal} · {weekPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${weekPct}%` }}
          />
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-2 pb-2 shrink-0">
        <button
          onClick={onAddTask}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 text-xs font-semibold transition-colors border border-primary/20"
        >
          <CalendarDays className="size-3.5" /> Add Task
        </button>
      </div>
    </div>
  );
}
