export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskCategory =
  | "general"
  | "coding"
  | "learning"
  | "meetings"
  | "job-search"
  | "freelance"
  | "personal";

export interface PlannerTask {
  id: string;
  date: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  general: "General",
  coding: "Coding",
  learning: "Learning",
  meetings: "Meetings",
  "job-search": "Job Search",
  freelance: "Freelance",
  personal: "Personal",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-emerald-500/20 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/20 text-amber-600 border-amber-500/20",
  high: "bg-red-500/20 text-red-600 border-red-500/20",
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  general: "bg-muted text-muted-foreground",
  coding: "bg-blue-500/10 text-blue-600",
  learning: "bg-purple-500/10 text-purple-600",
  meetings: "bg-orange-500/10 text-orange-600",
  "job-search": "bg-primary/10 text-primary",
  freelance: "bg-teal-500/10 text-teal-600",
  personal: "bg-pink-500/10 text-pink-600",
};
