import { CheckCircle2, Circle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerTask } from "@/types/planner";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/planner";

interface OverviewPanelProps {
  tasks: PlannerTask[];
  weekStart: Date;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function OverviewPanel({ tasks, weekStart }: OverviewPanelProps) {
  const today = toDateStr(new Date());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = toDateStr(d);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const done = dayTasks.filter((t) => t.status === "done").length;
    const inProgress = dayTasks.filter((t) => t.status === "in-progress").length;
    return { d, dateStr, dayTasks, done, inProgress, name: DAY_NAMES[i] };
  });

  const totalTasks = tasks.length;
  const totalDone = tasks.filter((t) => t.status === "done").length;
  const totalInProgress = tasks.filter((t) => t.status === "in-progress").length;
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = Object.keys(CATEGORY_LABELS).map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const catDone = catTasks.filter((t) => t.status === "done").length;
    return { cat, total: catTasks.length, done: catDone };
  }).filter((c) => c.total > 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 max-w-3xl space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Tasks", value: totalTasks, icon: Circle, color: "text-foreground" },
            { label: "Completed", value: totalDone, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "In Progress", value: totalInProgress, icon: Clock, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
              <s.icon className={cn("size-5 mx-auto mb-1", s.color)} />
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Completion rate bar */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <p className="text-sm font-semibold">Week Completion</p>
            </div>
            <span className="text-sm font-mono font-semibold text-primary">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalDone} of {totalTasks} tasks completed this week
          </p>
        </div>

        {/* Day-by-day grid */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Daily Breakdown
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map(({ d, dateStr, dayTasks, done, name }) => {
              const total = dayTasks.length;
              const pct = total > 0 ? (done / total) : 0;
              const isToday = dateStr === today;

              return (
                <div key={dateStr} className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-medium text-muted-foreground">{name}</p>
                  {/* Bar */}
                  <div className="w-full h-16 rounded-lg bg-muted/60 relative overflow-hidden">
                    {total > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-lg bg-primary/70 transition-all duration-500"
                        style={{ height: `${Math.max(pct * 100, 8)}%` }}
                      />
                    )}
                    {isToday && (
                      <div className="absolute inset-0 border-2 border-primary rounded-lg" />
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {done}/{total}
                  </p>
                  <p className={cn(
                    "text-[10px] font-medium",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              By Category
            </p>
            <div className="space-y-2">
              {categoryBreakdown.map(({ cat, total, done }) => {
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md w-24 text-center shrink-0",
                      CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]
                    )}>
                      {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-12 text-right shrink-0">
                      {done}/{total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalTasks === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-medium">No tasks this week yet</p>
            <p className="text-xs mt-1 opacity-70">Add tasks from the Schedule tab to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  );
}
