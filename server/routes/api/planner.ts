import { Router } from "express";
import { db } from "../../db/index.js";
import { plannerTasks } from "../../../shared/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireUser, stripDates, isUUID } from "../../middleware/auth.js";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

function parseRow(row: any) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description || undefined,
    priority: row.priority || "medium",
    status: row.status || "todo",
    category: row.category || "general",
    order: row.order ?? 0,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
}

router.get("/", async (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { from, to } = req.query as { from?: string; to?: string };
  let rows;
  if (from && to) {
    rows = await db.select().from(plannerTasks).where(
      and(
        eq(plannerTasks.userId, uid),
        gte(plannerTasks.date, from),
        lte(plannerTasks.date, to)
      )
    );
  } else {
    rows = await db.select().from(plannerTasks).where(eq(plannerTasks.userId, uid));
  }
  res.json(rows.map(parseRow));
});

router.post("/", async (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { id, ...raw } = req.body;
  const data = stripDates(raw);
  const safeId = isUUID(id) ? id : undefined;
  const existing = safeId
    ? await db.select().from(plannerTasks).where(and(eq(plannerTasks.id, safeId), eq(plannerTasks.userId, uid)))
    : [];

  if (existing.length > 0) {
    const [r] = await db.update(plannerTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plannerTasks.id, safeId!))
      .returning();
    res.json(parseRow(r));
  } else {
    const [r] = await db.insert(plannerTasks)
      .values({ ...data, userId: uid, ...(safeId ? { id: safeId } : {}) } as any)
      .returning();
    res.json(parseRow(r));
  }
});

router.delete("/:id", async (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  if (!isUUID(req.params.id)) { res.json({ ok: true }); return; }
  await db.delete(plannerTasks).where(
    and(eq(plannerTasks.id, req.params.id), eq(plannerTasks.userId, uid))
  );
  res.json({ ok: true });
});

router.post("/suggest", async (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const { date, tasks } = req.body;

  const taskList = (tasks || [])
    .map((t: any) => `- [${t.status}] ${t.title} (${t.priority} priority, ${t.category})${t.description ? `: ${t.description}` : ""}`)
    .join("\n") || "No tasks yet for this day.";

  const systemPrompt = `You are a personal productivity coach for a software developer. Analyze their task list and provide helpful, practical suggestions to improve their schedule and productivity. Be concise and actionable.

Return ONLY a valid JSON object with this exact structure:
{
  "suggestions": ["<actionable suggestion>", "<actionable suggestion>", "<actionable suggestion>"],
  "schedule": "<A suggested daily schedule in plain text, e.g. 09:00 Deep work - [task]. 11:00 Meetings. etc.>"
}`;

  const userPrompt = `Date: ${date}\n\nCurrent tasks:\n${taskList}\n\nPlease analyze and suggest improvements.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    res.json(JSON.parse(content));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
