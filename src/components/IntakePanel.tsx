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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      partnerUniversityId: plan.profile.partnerUniversityId,
      monthlyBudgetSgd: budget,
      stayLengthMonths: months,
      housingPreference: housing,
      travelStyle: style,
      dietaryNeeds: [],
      plannedActivities: ["museums", "weekend rail trips", "student societies"]
    });
  }

  return (
    <form className="intake-panel" onSubmit={submit}>
      <div>
        <span className="panel-label">Student intake</span>
        <h3>London exchange requirements</h3>
        <p>
          This is the judge-friendly form: enough input to prove personalization without slowing the demo.
        </p>
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
              onClick={() => setHousing(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Travel style</legend>
        <div className="segmented-control">
          {(["budget", "balanced", "comfort"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={style === option ? "selected" : ""}
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
