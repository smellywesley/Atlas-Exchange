"use client";

import { useMemo, useState } from "react";
import {
  ArrowSquareOut,
  CalendarCheck,
  Compass,
  HouseLine,
  MapPin,
  Package,
  Wallet
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { regions, londonPartners } from "@/lib/demo-data";
import { buildLondonPlanResponse } from "@/lib/plan-engine";
import type {
  ExchangePlan,
  ExchangeProfileInput,
  PartnerUniversity,
  ProviderStatus
} from "@/lib/schema";
import { IntakePanel } from "./IntakePanel";
import { PlanDashboard } from "./PlanDashboard";

const RegionGlobe = dynamic(
  () => import("./RegionGlobe").then((module) => module.RegionGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="globe-card globe-fallback">
        <div className="globe-overlay">
          <span>Loading region scene</span>
          <strong>UK</strong>
        </div>
      </div>
    )
  }
);

type AtlasShellProps = {
  initialPlan: ExchangePlan;
  initialProviderStatus?: ProviderStatus;
};

export function AtlasShell({ initialPlan, initialProviderStatus }: AtlasShellProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [providerStatus, setProviderStatus] = useState(
    initialProviderStatus ?? buildLondonPlanResponse(initialPlan.profile).providerStatus
  );
  const [activeRegion, setActiveRegion] = useState("uk");
  const goldenRegion = regions.find((region) => region.id === "uk") ?? regions[0];
  const activePartner = useMemo(
    () =>
      londonPartners.find(
        (partner) => partner.id === plan.profile.partnerUniversityId
      ) ?? londonPartners[0],
    [plan.profile.partnerUniversityId]
  );

  function handleProfileSubmit(input: ExchangeProfileInput) {
    const response = buildLondonPlanResponse({
      ...input,
      partnerUniversityId: activePartner.id
    });
    setPlan(response.plan);
    setProviderStatus(response.providerStatus);
  }

  function handlePartnerSelect(partner: PartnerUniversity) {
    const response = buildLondonPlanResponse({
      partnerUniversityId: partner.id,
      monthlyBudgetSgd: plan.profile.monthlyBudgetSgd,
      stayLengthMonths: plan.profile.stayLengthMonths,
      housingPreference: plan.profile.housingPreference,
      travelStyle: plan.profile.travelStyle,
      dietaryNeeds: plan.profile.dietaryNeeds,
      plannedActivities: plan.profile.plannedActivities
    });
    setPlan(response.plan);
    setProviderStatus(response.providerStatus);
  }

  return (
    <main className="site-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <a href="#top" className="brand-lockup" aria-label="Atlas Exchange home">
          <span className="brand-mark">AE</span>
          <span>Atlas Exchange</span>
        </a>
        <div className="nav-links">
          <a href="#regions">Regions</a>
          <a href="#universities">Universities</a>
          <a href="#planner">Planner</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <section id="top" className="hero-section">
        <div className="hero-backdrop" />
        <div className="hero-copy">
          <p className="hero-kicker">London golden path</p>
          <h1>Plan the semester before it starts.</h1>
          <p>
            Atlas Exchange turns housing, budgets, packing, and deadlines into one departure plan with visible sources.
          </p>
          <div className="hero-actions">
            <a href="#planner" className="button primary">
              Build London plan
            </a>
            <a href="#regions" className="button secondary">
              View regions
            </a>
          </div>
        </div>
        <div className="hero-card" aria-label="London plan preview">
          <div className="hero-card-image" />
          <div className="hero-card-body">
            <span>Ready path</span>
            <strong>{activePartner.name}</strong>
            <p>{activePartner.campusArea} housing, commute, budget, packing, and deadlines.</p>
          </div>
        </div>
      </section>

      <section id="regions" className="region-section">
        <div className="section-copy">
          <p className="section-kicker">Global surface, London depth</p>
          <h2>Start broad, then land on the path judges can test.</h2>
          <p>
            The interface shows a global exchange surface, but London carries the full accommodation and logistics workflow first.
          </p>
        </div>
        <div className="region-grid">
          <RegionGlobe activeRegion={activeRegion} />
          <div className="region-list">
            {regions.map((region) => (
              <button
                key={region.id}
                className={`region-tile ${region.id === activeRegion ? "active" : ""}`}
                onClick={() => setActiveRegion(region.id)}
              >
                <span>{region.eyebrow}</span>
                <strong>{region.title}</strong>
                <small>{region.description}</small>
              </button>
            ))}
          </div>
        </div>
        <div
          className="region-feature"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(8,17,17,.9), rgba(8,17,17,.35)), url(${goldenRegion.image})` }}
        >
          <div>
            <MapPin size={22} weight="duotone" />
            <span>{goldenRegion.cities.join(" / ")}</span>
          </div>
          <p>{goldenRegion.description}</p>
        </div>
      </section>

      <section id="universities" className="university-section">
        <div className="section-copy compact">
          <p className="section-kicker">Partner universities</p>
          <h2>London becomes the first complete exchange operating view.</h2>
        </div>
        <div className="university-grid">
          {londonPartners.map((partner) => (
            <button
              key={partner.id}
              type="button"
              className={`university-card ${partner.id === activePartner.id ? "active" : ""}`}
              onClick={() => handlePartnerSelect(partner)}
            >
              <div
                className="university-image"
                style={{ backgroundImage: `url(${partner.heroImage})` }}
              />
              <div className="university-body">
                <span>{partner.campusArea}</span>
                <h3>{partner.name}</h3>
                <p>{partner.strengths.join(", ")}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="planner" className="planner-section">
        <div className="planner-intro">
          <p className="section-kicker">Living plan</p>
          <h2>Requirements in. Ranked actions out.</h2>
          <p>
            Students fill constraints once. The dashboard ties accommodation, logistics, packing, and deadlines to the same plan object.
          </p>
        </div>
        <div className="planner-grid">
          <IntakePanel plan={plan} onSubmit={handleProfileSubmit} />
          <PlanDashboard plan={plan} providerStatus={providerStatus} />
        </div>
      </section>

      <section className="capability-band" aria-label="Feature modules">
        <div>
          <HouseLine size={28} weight="duotone" />
          <strong>Accommodation</strong>
          <span>Live links, ranked by fit</span>
        </div>
        <div>
          <Wallet size={28} weight="duotone" />
          <strong>Budget</strong>
          <span>Monthly planning in SGD</span>
        </div>
        <div>
          <Package size={28} weight="duotone" />
          <strong>Packing</strong>
          <span>Weather and room aware</span>
        </div>
        <div>
          <CalendarCheck size={28} weight="duotone" />
          <strong>Deadlines</strong>
          <span>Visa, housing, modules</span>
        </div>
      </section>

      <section id="sources" className="sources-section">
        <div className="section-copy compact">
          <p className="section-kicker">Trust layer</p>
          <h2>Every recommendation keeps its evidence visible.</h2>
        </div>
        <div className="source-list">
          {plan.sources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="source-row">
              <div>
                <span>{source.provider}</span>
                <strong>{source.title}</strong>
                <small>{source.snippet}</small>
              </div>
              <ArrowSquareOut size={20} />
            </a>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <Compass size={24} weight="duotone" />
        <span>Atlas Exchange</span>
        <p>London first. Global exchange paths next.</p>
      </footer>
    </main>
  );
}
