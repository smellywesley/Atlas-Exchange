"use client";

import { useState } from "react";
import {
  ArrowSquareOut,
  CalendarCheck,
  HouseLine,
  ListChecks,
  MapTrifold,
  Package,
  Wallet
} from "@phosphor-icons/react";
import type { ExchangePlan } from "@/lib/schema";
import type { ProviderStatus } from "@/lib/schema";

type PlanDashboardProps = {
  plan: ExchangePlan;
  providerStatus: ProviderStatus;
};

const tabs = ["Overview", "Accommodation", "Budget", "Packing", "Deadlines", "Local Life"] as const;

export function PlanDashboard({ plan, providerStatus }: PlanDashboardProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Accommodation");

  return (
    <section className="dashboard-panel" aria-label="Exchange plan dashboard">
      <div className="dashboard-header">
        <div>
          <span className="panel-label">Generated plan</span>
          <h3>{plan.partnerUniversity.name}</h3>
          <p>
            {plan.profile.stayLengthMonths} months in {plan.profile.destinationCity} with SGD {plan.profile.monthlyBudgetSgd.toLocaleString()} monthly budget.
          </p>
        </div>
        <span className="mode-pill">{providerStatus.mode}</span>
      </div>

      <div className="tab-list" role="tablist" aria-label="Plan sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {activeTab === "Overview" && <Overview plan={plan} />}
        {activeTab === "Accommodation" && <Accommodation plan={plan} />}
        {activeTab === "Budget" && <Budget plan={plan} />}
        {activeTab === "Packing" && <Packing plan={plan} />}
        {activeTab === "Deadlines" && <Deadlines plan={plan} />}
        {activeTab === "Local Life" && <LocalLife plan={plan} />}
      </div>

      <ProviderBanner providerStatus={providerStatus} />
    </section>
  );
}

function Overview({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="overview-grid">
      <Metric icon={<HouseLine size={24} />} label="Top housing fit" value={`${plan.accommodation.rankedOptions[0].fitScore}/100`} />
      <Metric icon={<Wallet size={24} />} label="Monthly estimate" value={`SGD ${plan.budget.monthlyEstimateSgd.toLocaleString()}`} />
      <Metric icon={<CalendarCheck size={24} />} label="High urgency tasks" value={`${plan.deadlines.filter((item) => item.urgency === "high").length}`} />
      <Metric icon={<ListChecks size={24} />} label="Source cards" value={`${plan.sources.length}`} />
      <div className="recommendation-card">
        <strong>Agent recommendation</strong>
        <p>{plan.accommodation.recommendationSummary}</p>
      </div>
    </div>
  );
}

function Accommodation({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="listing-stack">
      {plan.accommodation.rankedOptions.map((option) => (
        <article key={option.id} className="listing-card">
          <div className="listing-main">
            <span>{option.provider} / {option.status}</span>
            <h4>{option.title}</h4>
            <p>{option.rankingReasons[0]}</p>
            <div className="listing-meta">
              <strong>Fit {option.fitScore}</strong>
              <strong>SGD {option.estimatedMonthlyCostSgd?.toLocaleString() ?? "Check source"}</strong>
              <strong>{option.commuteMinutes ?? "?"} min</strong>
            </div>
          </div>
          <a href={option.url} target="_blank" rel="noreferrer" className="icon-link" aria-label={`Open ${option.title}`}>
            <ArrowSquareOut size={22} />
          </a>
        </article>
      ))}
    </div>
  );
}

function Budget({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="budget-grid">
      {Object.entries(plan.budget.categories).map(([key, value]) => (
        <div key={key} className="budget-row">
          <span>{key.replace(/([A-Z])/g, " $1")}</span>
          <strong>SGD {value.toLocaleString()}</strong>
        </div>
      ))}
      <p>{plan.budget.notes.join(" ")}</p>
    </div>
  );
}

function Packing({ plan }: { plan: ExchangePlan }) {
  const groups = [
    ["Essentials", plan.packing.essentials],
    ["Weather", plan.packing.weatherBased],
    ["Accommodation", plan.packing.accommodationBased],
    ["Documents", plan.packing.documents]
  ] as const;

  return (
    <div className="packing-grid">
      {groups.map(([label, items]) => (
        <article key={label} className="packing-group">
          <Package size={22} />
          <h4>{label}</h4>
          {items.map((item) => (
            <div key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.reason}</span>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

function Deadlines({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="deadline-list">
      {plan.deadlines.map((deadline) => (
        <div key={deadline.title} className={`deadline-row ${deadline.urgency}`}>
          <CalendarCheck size={22} />
          <div>
            <strong>{deadline.title}</strong>
            <span>{deadline.category} / {deadline.dueDate ?? "date pending"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LocalLife({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="local-grid">
      <MapTrifold size={24} />
      <div>
        <h4>Groceries</h4>
        <p>{plan.localLife.groceries.join(", ")}</p>
      </div>
      <div>
        <h4>Food areas</h4>
        <p>{plan.localLife.foodAreas.join(", ")}</p>
      </div>
      <div>
        <h4>Weekend ideas</h4>
        <p>{plan.localLife.weekendIdeas.join(", ")}</p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProviderBanner({ providerStatus }: { providerStatus: ProviderStatus }) {
  return (
    <aside className="provider-banner" aria-label="Provider status">
      <div>
        <strong>Provider mode</strong>
        <span>{providerStatus.planner} planner / {providerStatus.search} search</span>
      </div>
      <div>
        <strong>Cost guardrail</strong>
        <span>
          {providerStatus.costControl.llmCallsPerSubmit} LLM calls per submit, max {providerStatus.costControl.maxOutputTokens} output tokens
        </span>
      </div>
      {providerStatus.warnings.length > 0 && (
        <p>{providerStatus.warnings[0]}</p>
      )}
    </aside>
  );
}
