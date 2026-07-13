"use client";

import { FormEvent, useState } from "react";
import type { ExchangePlan, ExchangeProfileInput } from "@/lib/schema";

type IntakePanelProps = {
  plan: ExchangePlan;
  onSubmit: (input: ExchangeProfileInput) => void;
};

export function IntakePanel({ plan, onSubmit }: IntakePanelProps) {
  const [budget, setBudget] = useState(plan.profile.monthlyBudgetSgd);
  const [months, setMonths] = useState(plan.profile.stayLengthMonths);
  const [housing, setHousing] = useState(plan.profile.housingPreference);
  const [style, setStyle] = useState(plan.profile.travelStyle);
  const [startDate, setStartDate] = useState(plan.profile.startDate);
  const [endDate, setEndDate] = useState(plan.profile.endDate);
  const [studentEmail, setStudentEmail] = useState(plan.profile.studentEmail ?? "");
  const [dietaryNeeds, setDietaryNeeds] = useState(plan.profile.dietaryNeeds.join(", "));
  const [plannedActivities, setPlannedActivities] = useState(plan.profile.plannedActivities.join(", "));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      partnerUniversityId: plan.profile.partnerUniversityId,
      monthlyBudgetSgd: budget,
      stayLengthMonths: months,
      housingPreference: housing,
      travelStyle: style,
      dietaryNeeds: splitList(dietaryNeeds),
      plannedActivities: splitList(plannedActivities),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      studentEmail: studentEmail.trim()
    });
  }

  return (
    <form className="intake-panel" onSubmit={submit}>
      <div>
        <span className="panel-label">Student intake</span>
        <h3>{plan.profile.destinationCity} exchange requirements</h3>
        <p>
          Update the real constraints used by the plan, packing list, PDF, and email report.
        </p>
      </div>

      <div className="intake-field-grid">
        <label>
          Exchange start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label>
          Exchange end date
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>

      <label>
        Monthly budget in SGD
        <input
          type="number"
          min={800}
          max={12000}
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
        />
      </label>

      <label>
        Stay length in months
        <input
          type="number"
          min={1}
          max={12}
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
        />
      </label>

      <fieldset>
        <legend>Housing preference</legend>
        <div className="segmented-control">
          {(["school", "shared", "solo", "hotel"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={housing === option ? "selected" : ""}
              aria-pressed={housing === option}
              onClick={() => setHousing(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label>
        Dietary needs
        <input
          type="text"
          value={dietaryNeeds}
          placeholder="Halal, vegetarian, allergies"
          onChange={(event) => setDietaryNeeds(event.target.value)}
        />
      </label>

      <label>
        Planned activities
        <input
          type="text"
          value={plannedActivities}
          placeholder="Museums, hiking, football"
          onChange={(event) => setPlannedActivities(event.target.value)}
        />
      </label>

      <label>
        Student email for report
        <input
          type="email"
          value={studentEmail}
          placeholder="student@example.com"
          onChange={(event) => setStudentEmail(event.target.value)}
        />
      </label>

      <fieldset>
        <legend>Travel style</legend>
        <div className="segmented-control">
          {(["budget", "balanced", "comfort"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={style === option ? "selected" : ""}
              aria-pressed={style === option}
              onClick={() => setStyle(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="button primary full-width" type="submit">
        Regenerate plan
      </button>
    </form>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
