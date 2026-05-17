import { createFileRoute, useSearch } from "@tanstack/react-router";
import { SoftSkillView } from "@/components/soft-skills/soft-skill-view";
import { SoftSkillTabs } from "@/components/soft-skills/soft-skill-tabs";
import { PageHeader, PageContainer, PageSection, TabNav } from "@/components/layout";
import { Heart, MessageCircle, Mic, Handshake } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  tab: z
    .enum([
      "communication",
      "leadership",
      "problem-solving",
      "teamwork",
      "time",
      "growth",
      "mental-models",
    ])
    .optional()
    .default("communication"),
  subtab: z
    .enum(["communication", "speaking", "negotiation"])
    .optional()
    .default("communication"),
});

const COMMUNICATION_SUBTABS = [
  { id: "communication", label: "General",        icon: MessageCircle },
  { id: "speaking",      label: "Public Speaking", icon: Mic },
  { id: "negotiation",   label: "Negotiation",     icon: Handshake },
] as const;

export const Route = createFileRoute("/soft-skills")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Soft Skills Hub — Dev Studio" },
      { name: "description", content: "Master communication, leadership, and human engineering with our unified hub." },
    ],
  }),
  component: SoftSkillsPage,
});

function SoftSkillsPage() {
  const { tab, subtab } = useSearch({ from: "/soft-skills" });

  const activeSubArea = tab === "communication" ? subtab : tab;

  return (
    <PageContainer>
      <PageSection>
        <PageHeader
          icon={Heart}
          title="Communication & Soft Skills"
          description="Master the art of collaboration, leadership, and emotional intelligence."
          className="mb-4"
        />
        <SoftSkillTabs />

        {tab === "communication" && (
          <div className="mt-2">
            <TabNav
              tabs={COMMUNICATION_SUBTABS.map((t) => ({
                id: t.id,
                label: t.label,
                icon: t.icon,
                to: "/soft-skills",
                search: { tab: "communication", subtab: t.id } as Record<string, unknown>,
              }))}
              activeTab={subtab}
            />
          </div>
        )}
      </PageSection>

      <div className="flex-1 min-h-0 overflow-hidden">
        <SoftSkillView activeTab={activeSubArea} />
      </div>
    </PageContainer>
  );
}
