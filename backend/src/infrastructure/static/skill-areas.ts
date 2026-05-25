import { createRequire } from "module";

const require = createRequire(import.meta.url);

interface RawSkillArea {
  id: string;
  label: string;
  iconName?: string;
  description: string;
  concepts: unknown[];
  resources: unknown[];
  checklist: unknown[];
  subAreasLabel?: string;
  subAreas?: unknown[];
}

interface SkillAreasData {
  tech: Record<string, RawSkillArea>;
  soft: RawSkillArea;
}

export const skillAreasData: SkillAreasData = require("./skill-areas.json");
