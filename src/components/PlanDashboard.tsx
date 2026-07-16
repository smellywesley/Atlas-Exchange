"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowSquareOut,
  CalendarCheck,
  DownloadSimple,
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
  isPlanLoading?: boolean;
  onReportDeliveryStateChange?: (isWorking: boolean) => void;
};

const tabs = ["Overview", "Visa", "Modules", "Culture", "Accommodation", "Budget", "Packing", "Deadlines", "Local Life", "Daily Plan", "Q&A"] as const;

export function PlanDashboard({
  plan,
  providerStatus,
  isPlanLoading = false,
  onReportDeliveryStateChange
}: PlanDashboardProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Accommodation");
  const activeTabId = tabId(activeTab);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

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
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`plan-tab-${tabId(tab)}`}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            aria-controls={`plan-panel-${tabId(tab)}`}
            tabIndex={tab === activeTab ? 0 : -1}
            className={tab === activeTab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        id={`plan-panel-${activeTabId}`}
        className="tab-panel"
        role="tabpanel"
        aria-labelledby={`plan-tab-${activeTabId}`}
      >
        {activeTab === "Overview" && <Overview plan={plan} />}
        {activeTab === "Visa" && <Visa plan={plan} />}
        {activeTab === "Modules" && <Modules plan={plan} />}
        {activeTab === "Culture" && <Culture plan={plan} />}
        {activeTab === "Accommodation" && <Accommodation plan={plan} />}
        {activeTab === "Budget" && <Budget plan={plan} />}
        {activeTab === "Packing" && <Packing plan={plan} />}
        {activeTab === "Deadlines" && <Deadlines plan={plan} />}
        {activeTab === "Local Life" && <LocalLife plan={plan} />}
        {activeTab === "Daily Plan" && <DailyPlan plan={plan} />}
        {activeTab === "Q&A" && <Qna plan={plan} />}
      </div>

      <ProviderBanner providerStatus={providerStatus} />
      <ReportDelivery
        plan={plan}
        isPlanLoading={isPlanLoading}
        onDeliveryStateChange={onReportDeliveryStateChange}
      />
    </section>
  );
}

function Visa({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="evidence-panel-grid">
      <article className="evidence-card">
        <span>{plan.visa.reviewStatus}</span>
        <h4>Official entry check for {plan.visa.destinationCountry}</h4>
        <p>Visa decision: not evaluated. Complete nationality and stay checks only on the linked official service.</p>
        {plan.visa.notices.map((notice) => <p key={notice}>{notice}</p>)}
        {plan.visa.source && (
          <a href={plan.visa.source.url} target="_blank" rel="noreferrer" className="evidence-link">
            {plan.visa.source.authority}: {plan.visa.source.title}
            <ArrowSquareOut size={18} />
          </a>
        )}
      </article>
    </div>
  );
}

function Modules({ plan }: { plan: ExchangePlan }) {
  return (
    <div className="evidence-panel-grid">
      <article className="evidence-card">
        <span>candidate-only / faculty approval required</span>
        <h4>NUS module discovery</h4>
        <p>{plan.academics.notice}</p>
      </article>
      {plan.academics.modules.length === 0 ? (
        <article className="evidence-card muted-evidence">
          <span>not requested</span>
          <h4>Add an academic year and up to six NUS module codes</h4>
          <p>The planner will retrieve current NUSMods records without pretending they are approved host mappings.</p>
        </article>
      ) : plan.academics.modules.map((module) => (
        <article className="evidence-card" key={module.moduleCode}>
          <span>{module.lookupStatus} / {module.academicYear}</span>
          <h4>{module.moduleCode}{module.title ? `: ${module.title}` : ""}</h4>
          <p>
            {module.moduleCredit ? `${module.moduleCredit} MCs. ` : ""}
            {module.semesters?.length ? `Listed for semester ${module.semesters.join(", ")}. ` : ""}
            Mapping approval is still required.
          </p>
          {module.warning && <p>{module.warning}</p>}
          {module.sourceUrl && (
            <a href={module.sourceUrl} target="_blank" rel="noreferrer" className="evidence-link">
              Open live NUSMods record <ArrowSquareOut size={18} />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function Culture({ plan }: { plan: ExchangePlan }) {
  const groups = [
    ["Etiquette", plan.culture.etiquetteTips],
    ["Food", plan.culture.foodNotes],
    ["Transport", plan.culture.transportNotes],
    ["Payments", plan.culture.paymentNotes]
  ] as const;
  return (
    <div className="evidence-panel-grid">
      <article className="evidence-card">
        <span>{plan.culture.reviewStatus}</span>
        <h4>{plan.culture.destinationCity} local orientation</h4>
        {plan.culture.notices.map((notice) => <p key={notice}>{notice}</p>)}
        {plan.culture.source && (
          <a href={plan.culture.source.url} target="_blank" rel="noreferrer" className="evidence-link">
            {plan.culture.source.title} <ArrowSquareOut size={18} />
          </a>
        )}
      </article>
      {groups.map(([label, items]) => items.length > 0 && (
        <article className="evidence-card" key={label}>
          <span>{label}</span>
          {items.map((item) => <p key={item}>{item}</p>)}
        </article>
      ))}
    </div>
  );
}

function Overview({ plan }: { plan: ExchangePlan }) {
  const topHousingFit = plan.accommodation.rankedOptions[0]?.fitScore;
  const budgetLabel = plan.budget.basis === "planning-envelope" ? "Monthly envelope" : "Monthly estimate";

  return (
    <div className="overview-grid">
      <Metric icon={<HouseLine size={24} />} label="Top housing fit" value={topHousingFit !== undefined ? `${topHousingFit}/100` : "Needs review"} />
      <Metric icon={<Wallet size={24} />} label={budgetLabel} value={`SGD ${plan.budget.monthlyEstimateSgd.toLocaleString()}`} />
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
  if (plan.accommodation.rankedOptions.length === 0) {
    return (
      <div className="listing-stack">
        <article className="listing-card">
          <div className="listing-main">
            <span>needs-review</span>
            <h4>No accommodation options ready yet</h4>
            <p>Run the accommodation provider or use a seeded fallback before presenting this as booking-ready.</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="listing-stack">
      {plan.accommodation.rankedOptions.map((option) => (
        <article key={option.id} className="listing-card">
          <div className="listing-main">
            <span>{option.provider} / {option.status}</span>
            <h4>{option.title}</h4>
            <p>{option.rankingReasons[0]}</p>
            <div className="listing-meta">
              <strong>{option.fitScore !== undefined ? `Fit ${option.fitScore}` : "Fit needs review"}</strong>
              <strong>{option.estimatedMonthlyCostSgd !== undefined ? `SGD ${option.estimatedMonthlyCostSgd.toLocaleString()}` : "Cost: check source"}</strong>
              <strong>{option.commuteMinutes !== undefined ? `${option.commuteMinutes} min` : "Commute: check route"}</strong>
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
      <div className="budget-basis">
        <strong>{plan.budget.basis.replace(/-/g, " ")}</strong>
        <span>{plan.budget.confidence} confidence</span>
      </div>
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
    <div className="local-life-stack">
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
      <div className="local-place-grid">
        {plan.localLife.places.map((place) => (
          <a key={place.id} href={place.mapsUrl} target="_blank" rel="noreferrer" className="local-place-link">
            <span>{place.category} / {place.status}</span>
            <strong>{place.title}</strong>
            <small>{place.whyRecommended}</small>
            <ArrowSquareOut size={18} />
          </a>
        ))}
      </div>
    </div>
  );
}

function DailyPlan({ plan }: { plan: ExchangePlan }) {
  const groups = [
    ["Arrival", plan.dailyLogistics.arrival],
    ["Week one", plan.dailyLogistics.weekOne],
    ["Ongoing", plan.dailyLogistics.ongoing]
  ] as const;

  return (
    <div className="daily-logistics-grid">
      {groups.map(([label, items]) => (
        <article key={label} className="logistics-column">
          <span>{label}</span>
          {items.map((item, index) => (
            <div key={`${label}-${item.timing}-${index}`} className="logistics-item">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <small>{item.linkedFeature} / {item.sourceRefIds.length} source refs</small>
            </div>
          ))}
        </article>
      ))}
      <article className="parent-assurance-card">
        <span>Parent assurance</span>
        {plan.dailyLogistics.parentAssurance.map((note, index) => (
          <p key={`parent-assurance-${index}`}>{note}</p>
        ))}
      </article>
    </div>
  );
}

function Qna({ plan }: { plan: ExchangePlan }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const activePlanId = useRef(plan.generatedAt);

  useEffect(() => {
    activePlanId.current = plan.generatedAt;
    requestController.current?.abort();
    setQuestion("");
    setAnswer("");
    setStatus("");
    setIsLoading(false);
  }, [plan.generatedAt]);

  useEffect(() => () => requestController.current?.abort(), []);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim().length < 3) return;
    const planId = plan.generatedAt;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setAnswer("");
    setIsLoading(true);
    setStatus("Checking the plan evidence...");
    try {
      const response = await fetch("/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          context: { classification: "non-pii", evidence: buildQnaEvidence(plan) }
        })
      });
      const payload = await response.json() as { answer?: string; error?: string; cacheStatus?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "Q&A failed");
      if (activePlanId.current === planId) {
        setAnswer(payload.answer);
        setStatus(`Evidence-only answer / cache ${payload.cacheStatus ?? "unknown"}`);
      }
    } catch (error) {
      if (activePlanId.current === planId && !isAbortError(error)) {
        setAnswer("");
        setStatus(error instanceof Error ? error.message : "Q&A failed");
      }
    } finally {
      if (activePlanId.current === planId) setIsLoading(false);
    }
  }

  return (
    <div className="qna-stack">
      <form className="qna-ask" onSubmit={submitQuestion}>
        <label htmlFor="plan-question">Ask about this plan</label>
        <div>
          <input
            id="plan-question"
            value={question}
            maxLength={240}
            placeholder={`Ask about ${plan.profile.destinationCity} housing, visa, modules, packing, or local life`}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button className="button primary" type="submit" disabled={isLoading}>
            {isLoading ? "Checking" : "Ask"}
          </button>
        </div>
        {status && <small role="status">{status}</small>}
        <div className="qna-live" aria-live="polite" aria-atomic="true">
          {answer && <p className="qna-answer">{answer}</p>}
        </div>
      </form>
      {plan.qna.map((item) => (
        <article key={item.id} className="qna-card">
          <div>
            <span>{item.confidence} confidence / {item.sourceRefIds.length} source refs</span>
            <h4>{item.question}</h4>
          </div>
          <p>{item.answer}</p>
        </article>
      ))}
      <article className="qna-card open-questions">
        <div>
          <span>Needs teammate input</span>
          <h4>Open planning questions</h4>
        </div>
        {plan.dailyLogistics.openQuestions.map((question, index) => (
          <p key={`open-question-${index}`}>{question}</p>
        ))}
      </article>
    </div>
  );
}

function buildQnaEvidence(plan: ExchangePlan) {
  return [
    {
      id: "visa-status",
      topic: "visa",
      text: `Visa eligibility is not evaluated. Review status for ${plan.profile.destinationCountry}: ${plan.visa.reviewStatus}.`,
      sourceRefIds: sourceIdsForUrl(plan, plan.visa.source?.url)
    },
    ...plan.academics.modules.map((module) => ({
      id: `module-${module.moduleCode}`,
      topic: "modules",
      text: `${module.moduleCode}${module.title ? ` is ${module.title}` : ""}; it is candidate-only and requires faculty approval.`,
      sourceRefIds: sourceIdsForUrl(plan, module.sourceUrl)
    })),
    {
      id: "culture-status",
      topic: "culture",
      text: `${plan.profile.destinationCity} cultural guidance status is ${plan.culture.reviewStatus}. ${plan.culture.etiquetteTips.join(" ")}`,
      sourceRefIds: sourceIdsForUrl(plan, plan.culture.source?.url)
    },
    ...plan.accommodation.rankedOptions.slice(0, 3).map((option, index) => ({
      id: `housing-${index}`,
      topic: "accommodation",
      text: `${option.title}: ${option.rankingReasons.join(" ")}`,
      sourceRefIds: option.sourceRefIds
    })),
    {
      id: "budget-summary",
      topic: "budget",
      text: `The monthly planning envelope is SGD ${plan.budget.monthlyEstimateSgd} with ${plan.budget.confidence} confidence.`,
      sourceRefIds: []
    },
    ...plan.packing.essentials.slice(0, 5).map((item, index) => ({
      id: `packing-${index}`,
      topic: "packing",
      text: `${item.label}: ${item.reason}`,
      sourceRefIds: []
    })),
    ...plan.deadlines.slice(0, 5).map((item, index) => ({
      id: `deadline-${index}`,
      topic: "deadlines",
      text: `${item.title}: ${item.dueDate ?? "official date not imported"}.`,
      sourceRefIds: item.sourceRefIds
    })),
    ...plan.localLife.places.slice(0, 8).map((place, index) => ({
      id: `local-${index}`,
      topic: "local-life",
      text: `${place.title}: ${place.whyRecommended}`,
      sourceRefIds: place.sourceRefIds
    }))
  ];
}

function sourceIdsForUrl(plan: ExchangePlan, url: string | undefined) {
  if (!url) return [];
  return plan.sources.filter((source) => source.url === url).map((source) => source.id);
}

function tabId(tab: (typeof tabs)[number]) {
  return tab.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

function ReportDelivery({
  plan,
  isPlanLoading,
  onDeliveryStateChange
}: {
  plan: ExchangePlan;
  isPlanLoading: boolean;
  onDeliveryStateChange?: (isWorking: boolean) => void;
}) {
  const [status, setStatus] = useState<string>("");
  const [isWorking, setIsWorking] = useState(false);
  const reportProfile = {
    ...plan.profile,
    startDate: plan.profile.startDate || undefined,
    endDate: plan.profile.endDate || undefined
  };
  const activeReportId = useRef(plan.generatedAt);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    activeReportId.current = plan.generatedAt;
    requestController.current?.abort();
    onDeliveryStateChange?.(false);
    setIsWorking(false);
    setStatus("");
  }, [plan.generatedAt, onDeliveryStateChange]);

  useEffect(() => {
    if (!isPlanLoading) return;
    requestController.current?.abort();
    onDeliveryStateChange?.(false);
    setIsWorking(false);
    setStatus("Report delivery cancelled because the plan is updating.");
  }, [isPlanLoading, onDeliveryStateChange]);

  useEffect(() => () => {
    requestController.current?.abort();
    onDeliveryStateChange?.(false);
  }, [onDeliveryStateChange]);

  async function downloadPdf() {
    const reportId = plan.generatedAt;
    const controller = new AbortController();
    requestController.current = controller;
    onDeliveryStateChange?.(true);
    setIsWorking(true);
    setStatus("Generating PDF report...");
    try {
      const response = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ profile: reportProfile })
      });
      if (!response.ok) {
        const payload = await readJsonResponse(response);
        throw new Error(payload.error ?? "PDF generation failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slugify(plan.partnerUniversity.name)}-exchange-plan.pdf`;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      if (activeReportId.current === reportId) {
        setStatus("PDF download started.");
      }
    } catch (error) {
      if (activeReportId.current === reportId && !isAbortError(error)) {
        setStatus(error instanceof Error ? error.message : "PDF generation failed");
      }
    } finally {
      if (activeReportId.current === reportId) {
        onDeliveryStateChange?.(false);
        setIsWorking(false);
      }
    }
  }

  return (
    <section className="report-delivery" aria-label="Report delivery">
      <div>
        <strong>Take the plan with you</strong>
        <span>Download the evidence-linked PDF for offline review and departure prep.</span>
      </div>
      <div className="report-actions">
        <button className="primary" type="button" onClick={downloadPdf} disabled={isWorking || isPlanLoading}>
          <DownloadSimple size={20} />
          Download PDF
        </button>
      </div>
      <p aria-live="polite">
        {status || (isPlanLoading
          ? "Updating the selected university before the PDF is prepared."
          : "The export reflects the currently selected university and planner inputs.")}
      </p>
    </section>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return {} as { error?: string; sent?: boolean };
  }
  try {
    return JSON.parse(text) as { error?: string; sent?: boolean };
  } catch {
    return { error: `Report service returned ${response.status}.` };
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
