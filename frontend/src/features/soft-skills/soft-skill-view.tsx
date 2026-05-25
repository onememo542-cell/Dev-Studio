import {
  Swords,
  Wifi,
  Terminal,
  GitPullRequest,
  Clock,
  Sparkles,
  Brain,
  Repeat2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SkillArea } from "@/features/tech-skills/skill-area";
import { getSoftSkillArea } from "@/lib/api/skills";

export const SOFT_SKILL_GROUPS: Record<string, { id: string; label: string; icon: any }[]> = {
  leadership: [
    { id: "time", label: "Time Management", icon: Clock },
    { id: "growth", label: "Growth Mindset", icon: Sparkles },
    { id: "mental-models", label: "Mental Models", icon: Brain },
  ],
  teamwork: [
    { id: "conflict", label: "Conflict Resolution", icon: Swords },
    { id: "remote", label: "Remote Collaboration", icon: Wifi },
    { id: "pairing", label: "Pair Programming", icon: Terminal },
    { id: "code-review", label: "Code Review Culture", icon: GitPullRequest },
    { id: "agile", label: "Agile / Scrum", icon: Repeat2 },
  ],
};

export function SoftSkillView({ activeTab }: { activeTab?: string }) {
  const { data: softArea, isLoading } = useQuery({
    queryKey: ["skill-areas", "soft"],
    queryFn: getSoftSkillArea,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!softArea) return null;

  const softAreaFiltered = {
    ...softArea,
    subAreas: softArea.subAreas?.filter((sa) => sa.id !== "top-10"),
  };

  return (
    <SkillArea
      data={softAreaFiltered}
      activeSubArea={activeTab}
      subAreaGroups={SOFT_SKILL_GROUPS}
    />
  );
}
