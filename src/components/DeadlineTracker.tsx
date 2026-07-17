"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarCheck, Check, Trash } from "@phosphor-icons/react";
import type { DeadlineItem } from "@/lib/schema";
import type { PersonalDeadlineCategory, TimelineEntry } from "@/lib/deadline-store";

type DeadlineTrackerProps = {
  suggested: DeadlineItem[];
};

const categoryOptions: PersonalDeadlineCategory[] = ["visa", "accommodation", "other"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function urgencyLabel(entry: TimelineEntry) {
  if (entry.completed) {
    return "done";
  }
  if (entry.daysRemaining < 0) {
    return `${Math.abs(entry.daysRemaining)}d overdue`;
  }
  if (entry.daysRemaining === 0) {
    return "due today";
  }
  return `${entry.daysRemaining}d left`;
}

export function DeadlineTracker({ suggested }: DeadlineTrackerProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PersonalDeadlineCategory>("visa");
  const [dueDate, setDueDate] = useState(todayIso());
  const [notes, setNotes] = useState("");

  async function loadTimeline() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/deadlines/timeline");
      if (!response.ok) {
        throw new Error(`Timeline request failed with ${response.status}`);
      }
      setEntries((await response.json()) as TimelineEntry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTimeline();
  }, []);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !dueDate) {
      return;
    }
    try {
      const response = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, dueDate, notes })
      });
      if (!response.ok) {
        throw new Error(`Add deadline failed with ${response.status}`);
      }
      setTitle("");
      setNotes("");
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add deadline");
    }
  }

  async function handleAddSuggested(item: DeadlineItem) {
    try {
      const response = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          category: item.category === "visa" || item.category === "accommodation" ? item.category : "other",
          dueDate: item.dueDate ?? todayIso(),
          notes: `From plan: ${item.linkedFeature}`
        })
      });
      if (!response.ok) {
        throw new Error(`Add deadline failed with ${response.status}`);
      }
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add deadline");
    }
  }

  async function handleToggle(entry: TimelineEntry) {
    try {
      const response = await fetch(`/api/deadlines/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !entry.completed })
      });
      if (!response.ok) {
        throw new Error(`Update deadline failed with ${response.status}`);
      }
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deadline");
    }
  }

  async function handleDelete(entry: TimelineEntry) {
    try {
      const response = await fetch(`/api/deadlines/${entry.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Delete deadline failed with ${response.status}`);
      }
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deadline");
    }
  }

  return (
    <div className="deadline-tracker">
      {suggested.length > 0 && (
        <div className="tracker-block">
          <span className="panel-label">Suggested from your plan</span>
          <div className="deadline-list">
            {suggested.map((item) => (
              <div key={item.title} className={`deadline-row ${item.urgency}`}>
                <CalendarCheck size={22} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.category} / {item.dueDate ?? "date pending"}</span>
                </div>
                <button type="button" className="button secondary" onClick={() => handleAddSuggested(item)}>
                  Track
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tracker-block">
        <span className="panel-label">Your tracked deadlines</span>
        <form className="tracker-form" onSubmit={handleAdd}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Submit visa application"
            aria-label="Deadline title"
            maxLength={160}
            required
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as PersonalDeadlineCategory)}
            aria-label="Deadline category"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-label="Due date"
            required
          />
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes (optional)"
            aria-label="Notes"
            maxLength={500}
          />
          <button className="button primary" type="submit">
            Add deadline
          </button>
        </form>

        {error && <p className="tracker-error">{error}</p>}
        {loading ? (
          <p>Loading deadlines…</p>
        ) : entries.length === 0 ? (
          <p>No tracked deadlines yet. Add one above or track a suggestion.</p>
        ) : (
          <div className="deadline-list">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`deadline-row urgency-${entry.urgency}${entry.completed ? " completed" : ""}`}
              >
                <CalendarCheck size={22} />
                <div>
                  <strong>{entry.title}</strong>
                  <span>
                    {entry.category} / due {entry.dueDate} / {urgencyLabel(entry)}
                    {entry.notes ? ` / ${entry.notes}` : ""}
                  </span>
                </div>
                <div className="tracker-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={entry.completed ? "Mark undone" : "Mark done"}
                    onClick={() => handleToggle(entry)}
                  >
                    <Check size={18} weight="bold" />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label="Delete deadline"
                    onClick={() => handleDelete(entry)}
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
