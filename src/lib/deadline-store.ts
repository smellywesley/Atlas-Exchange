import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const personalDeadlineCategorySchema = z.enum(["visa", "accommodation", "other"]);
export type PersonalDeadlineCategory = z.infer<typeof personalDeadlineCategorySchema>;

export const personalDeadlineCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: personalDeadlineCategorySchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be an ISO date (YYYY-MM-DD)."),
  notes: z.string().trim().max(500).default("")
});
export type PersonalDeadlineInput = z.infer<typeof personalDeadlineCreateSchema>;

export const personalDeadlineUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    category: personalDeadlineCategorySchema,
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be an ISO date (YYYY-MM-DD)."),
    notes: z.string().trim().max(500),
    completed: z.boolean()
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");
export type PersonalDeadlineUpdate = z.infer<typeof personalDeadlineUpdateSchema>;

export const deadlineIdSchema = z.string().regex(/^[a-f0-9]{32}$/, "Invalid deadline id.");

export type PersonalDeadline = {
  id: string;
  title: string;
  category: PersonalDeadlineCategory;
  dueDate: string;
  notes: string;
  completed: boolean;
  createdAt: string;
};

export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "planned";

export type TimelineEntry = PersonalDeadline & {
  daysRemaining: number;
  urgency: DeadlineUrgency;
};

const MAX_DEADLINES = 500;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "deadlines.json");

function ensureStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, "[]", "utf-8");
  }
}

function load(): PersonalDeadline[] {
  ensureStore();
  const raw = readFileSync(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersonalDeadline[]) : [];
  } catch {
    return [];
  }
}

function save(items: PersonalDeadline[]): void {
  ensureStore();
  writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export function listDeadlines(): PersonalDeadline[] {
  return load();
}

export function getDeadline(id: string): PersonalDeadline | null {
  return load().find((item) => item.id === id) ?? null;
}

export class DeadlineCapacityError extends Error {}

export function createDeadline(input: PersonalDeadlineInput): PersonalDeadline {
  const items = load();
  if (items.length >= MAX_DEADLINES) {
    throw new DeadlineCapacityError(`Cannot track more than ${MAX_DEADLINES} deadlines.`);
  }

  const deadline: PersonalDeadline = {
    id: randomUUID().replace(/-/g, ""),
    title: input.title,
    category: input.category,
    dueDate: input.dueDate,
    notes: input.notes ?? "",
    completed: false,
    createdAt: new Date().toISOString()
  };

  items.push(deadline);
  save(items);
  return deadline;
}

export function updateDeadline(id: string, patch: PersonalDeadlineUpdate): PersonalDeadline | null {
  const items = load();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const updated = { ...items[index], ...patch };
  items[index] = updated;
  save(items);
  return updated;
}

export function deleteDeadline(id: string): boolean {
  const items = load();
  const remaining = items.filter((item) => item.id !== id);
  if (remaining.length === items.length) {
    return false;
  }
  save(remaining);
  return true;
}

function urgencyFor(daysRemaining: number): DeadlineUrgency {
  if (daysRemaining < 0) {
    return "overdue";
  }
  if (daysRemaining <= 7) {
    return "urgent";
  }
  if (daysRemaining <= 30) {
    return "soon";
  }
  return "planned";
}

export function getTimeline(): TimelineEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = load().map((deadline) => {
    const due = new Date(`${deadline.dueDate}T00:00:00`);
    const daysRemaining = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...deadline,
      daysRemaining,
      urgency: urgencyFor(daysRemaining)
    };
  });

  entries.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  return entries;
}
