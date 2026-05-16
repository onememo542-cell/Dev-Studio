import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/layout/page-header";
import { TabNav } from "@/components/layout/tab-nav";
import { SplitLayout } from "@/components/layout/split-layout";
import { PlannerSidebar } from "@/components/planner/planner-sidebar";
import { TaskCard } from "@/components/planner/task-card";
import { AddTaskForm } from "@/components/planner/add-task-form";
import { EditTaskDialog } from "@/components/planner/edit-task-dialog";
import { AISuggestionsPanel } from "@/components/planner/ai-suggestions-panel";
import { OverviewPanel } from "@/components/planner/overview-panel";
import { getPlannerTasks, upsertPlannerTask, deletePlannerTask } from "@/lib/api/planner";
import type { PlannerTask, TaskStatus } from "@/types/planner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  component: PlannerPage,
});

const TABS = (setTab: (v: string) => void) => [
  { id: "schedule", label: "Schedule", onClick: () => setTab("schedule") },
  { id: "overview", label: "Overview", onClick: () => setTab("overview") },
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekStart(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDayTitle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));
  const yesterday = toDateStr(addDays(new Date(), -1));
  const label =
    dateStr === today ? "Today" :
    dateStr === tomorrow ? "Tomorrow" :
    dateStr === yesterday ? "Yesterday" : null;
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return label ? `${label} · ${weekday}, ${dateLabel}` : `${weekday}, ${dateLabel}`;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

export default function PlannerPage() {
  const [tab, setTab] = useState("schedule");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const weekEnd = addDays(weekStart, 6);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlannerTasks(toDateStr(weekStart), toDateStr(weekEnd));
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [weekStart.toISOString()]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (partial: Omit<PlannerTask, "id" | "createdAt" | "updatedAt">) => {
    const tempId = crypto.randomUUID();
    const optimistic: PlannerTask = { ...partial, id: tempId, createdAt: Date.now(), updatedAt: Date.now() };
    setTasks((prev) => [...prev, optimistic]);
    try {
      const saved = await upsertPlannerTask(partial);
      setTasks((prev) => prev.map((t) => t.id === tempId ? saved : t));
    } catch (e: any) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      toast.error(`Failed to add task: ${e.message}`);
    }
  };

  const handleToggle = async (task: PlannerTask) => {
    const newStatus = STATUS_CYCLE[task.status];
    const updated = { ...task, status: newStatus, updatedAt: Date.now() };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try {
      await upsertPlannerTask(updated);
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
      toast.error(`Failed to update: ${e.message}`);
    }
  };

  const handleSaveEdit = async (task: PlannerTask) => {
    const previous = tasks.find((t) => t.id === task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    setEditingTask(null);
    try {
      await upsertPlannerTask(task);
      toast.success("Task updated");
    } catch (e: any) {
      if (previous) setTasks((prev) => prev.map((t) => t.id === task.id ? previous : t));
      toast.error(`Failed to save: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deletePlannerTask(id);
      toast.success("Task deleted");
    } catch (e: any) {
      setTasks(previous);
      toast.error(`Failed to delete: ${e.message}`);
    }
  };

  const handlePrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const handleNextWeek = () => setWeekStart((w) => addDays(w, 7));
  const handleToday = () => {
    const today = new Date();
    setSelectedDate(toDateStr(today));
    setWeekStart(getWeekStart(today));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setTab("schedule");
  };

  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const todoTasks = dayTasks.filter((t) => t.status === "todo");
  const inProgressTasks = dayTasks.filter((t) => t.status === "in-progress");
  const doneTasks = dayTasks.filter((t) => t.status === "done");

  const allSortedTasks = [
    ...inProgressTasks.sort((a, b) => a.order - b.order),
    ...todoTasks.sort((a, b) => a.order - b.order),
    ...doneTasks.sort((a, b) => a.order - b.order),
  ];

  const doneCount = doneTasks.length;
  const totalCount = dayTasks.length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <PageContainer>
      <PageSection>
        <PageHeader
          icon={CalendarDays}
          title="Planner"
          description="Schedule your day, track progress and get AI-powered plan suggestions"
          actions={
            <button
              onClick={() => { setTab("schedule"); setShowAddForm(true); }}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="size-4" /> New Task
            </button>
          }
        />
        <TabNav tabs={TABS(setTab)} activeTab={tab} />
      </PageSection>

      {tab === "schedule" ? (
        <SplitLayout
          sidebar={
            <PlannerSidebar
              selectedDate={selectedDate}
              weekStart={weekStart}
              tasks={tasks}
              onSelectDate={handleSelectDate}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
              onAddTask={() => setShowAddForm(true)}
            />
          }
        >
          {/* Day Content */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Day header */}
            <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {formatDayTitle(selectedDate)}
                  </h2>
                  {totalCount > 0 ? (
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        {doneCount} done
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5 text-primary" />
                        {inProgressTasks.length} in progress
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Circle className="size-3.5" />
                        {todoTasks.length} todo
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No tasks scheduled</p>
                  )}
                </div>

                {/* Completion ring */}
                {totalCount > 0 && (
                  <div className="shrink-0 flex items-center gap-2">
                    <div className="relative size-10">
                      <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/60" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${completionPct * 0.942} 94.2`}
                          strokeLinecap="round"
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                        {completionPct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading tasks…
                </div>
              ) : allSortedTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Nothing planned for this day</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Add a task below or ask the AI for suggestions</p>
                </div>
              ) : (
                allSortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))
              )}

              {/* Add task form */}
              <div className="pt-1">
                <AddTaskForm
                  key={showAddForm ? "open" : "closed"}
                  date={selectedDate}
                  onAdd={(t) => { handleAddTask(t); setShowAddForm(false); }}
                  onCancel={() => setShowAddForm(false)}
                  initialOpen={showAddForm}
                />
              </div>

              {/* AI Suggestions */}
              {!loading && (
                <div className="pt-2">
                  <AISuggestionsPanel date={selectedDate} tasks={dayTasks} />
                </div>
              )}
            </div>
          </div>
        </SplitLayout>
      ) : (
        <OverviewPanel tasks={tasks} weekStart={weekStart} />
      )}

      {/* Edit dialog */}
      <EditTaskDialog
        task={editingTask}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />
    </PageContainer>
  );
}
