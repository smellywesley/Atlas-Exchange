"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
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
import {
  exchangeCountries,
  getCountriesForRegion,
  getDefaultCountryForRegion
} from "@/lib/exchange-map-data";
import { buildLondonPlanResponse } from "@/lib/plan-engine";
import type {
  DestinationRegion,
  ExchangePlan,
  ExchangeProfileInput,
  PartnerUniversity,
  ProviderStatus
} from "@/lib/schema";
import type { ExchangeCountry } from "@/lib/exchange-map-data";
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

const sectionMotion = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] }
} as const;

type AtlasShellProps = {
  initialPlan: ExchangePlan;
  initialProviderStatus?: ProviderStatus;
};

export function AtlasShell({ initialPlan, initialProviderStatus }: AtlasShellProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [providerStatus, setProviderStatus] = useState(
    initialProviderStatus ?? buildLondonPlanResponse(initialPlan.profile).providerStatus
  );
  const [activeRegion, setActiveRegion] = useState<DestinationRegion>("uk");
  const [selectedCountry, setSelectedCountry] = useState<ExchangeCountry>(
    exchangeCountries.find((country) => country.id === "united-kingdom") ?? exchangeCountries[0]
  );
  const activeCountries = useMemo(
    () => getCountriesForRegion(activeRegion),
    [activeRegion]
  );
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

  function handleRegionSelect(region: DestinationRegion) {
    setActiveRegion(region);
    setSelectedCountry(getDefaultCountryForRegion(region));
  }

  function handleCountrySelect(country: ExchangeCountry) {
    setSelectedCountry(country);
    setActiveRegion(country.region);
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

      <motion.section id="top" className="hero-section" {...sectionMotion}>
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
      </motion.section>

      <motion.section id="regions" className="region-section" {...sectionMotion}>
        <div className="section-copy">
          <p className="section-kicker">3D exchange atlas</p>
          <h2>Spin the world, zoom into countries, then choose the partner university.</h2>
          <p>
            The atlas maps NUS exchange partnerships into country paths. London remains the golden demo, while Seoul, Europe, Oceania, North America, and South America are ready for parallel expansion.
          </p>
        </div>
        <div className="region-grid">
          <RegionGlobe
            activeRegion={activeRegion}
            countries={activeCountries}
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
          />
          <div className="region-list">
            {regions.map((region) => (
              <button
                key={region.id}
                className={`region-tile ${region.id === activeRegion ? "active" : ""}`}
                onClick={() => handleRegionSelect(region.id)}
              >
                <span>{region.eyebrow}</span>
                <strong>{region.title}</strong>
                <small>{region.description}</small>
              </button>
            ))}
          </div>
        </div>
        <div
          className={`region-feature country-template-${selectedCountry.template}`}
          style={{ "--country-accent": selectedCountry.accent } as CSSProperties}
        >
          <div>
            <MapPin size={22} weight="duotone" />
            <span>{selectedCountry.name} / {selectedCountry.focusLabel}</span>
          </div>
          <p>{selectedCountry.logisticsAngle}</p>
        </div>
      </motion.section>

      <motion.section id="universities" className="university-section" {...sectionMotion}>
        <div className="section-copy compact">
          <p className="section-kicker">Partner universities</p>
          <h2>{selectedCountry.name} gets a unique exchange template.</h2>
          <p>
            Country cards keep the same architecture but adapt the story: mountain routes, coastal commute routes, dense city campuses, or US East/West campus corridors.
          </p>
        </div>
        <div className="university-grid">
          {selectedCountry.id === "united-kingdom"
            ? londonPartners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  className={`university-card ${partner.id === activePartner.id ? "active" : ""}`}
                  onClick={() => handlePartnerSelect(partner)}
                >
                  <div
                    className={`university-image template-${selectedCountry.template}`}
                    style={{ "--country-accent": selectedCountry.accent } as CSSProperties}
                  />
                  <div className="university-body">
                    <span>{partner.campusArea}</span>
                    <h3>{partner.name}</h3>
                    <p>{partner.strengths.join(", ")}</p>
                  </div>
                </button>
              ))
            : selectedCountry.universities.slice(0, 8).map((university) => (
                <a
                  key={`${university.name}-${university.city}-${university.partnership}`}
                  className="university-card"
                  href={university.sourceUrl ?? "#planner"}
                  target={university.sourceUrl ? "_blank" : undefined}
                  rel={university.sourceUrl ? "noreferrer" : undefined}
                >
                  <div
                    className={`university-image template-${selectedCountry.template}`}
                    style={{ "--country-accent": selectedCountry.accent } as CSSProperties}
                  />
                  <div className="university-body">
                    <span>{university.city} / {university.partnership}</span>
                    <h3>{university.name}</h3>
                    <p>
                      {university.faculties
                        ? `Faculty route: ${university.faculties.join(", ")}`
                        : selectedCountry.logisticsAngle}
                    </p>
                  </div>
                </a>
              ))}
        </div>
      </motion.section>

      <motion.section id="planner" className="planner-section" {...sectionMotion}>
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
      </motion.section>

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

      <motion.section id="sources" className="sources-section" {...sectionMotion}>
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
      </motion.section>

      <footer className="site-footer">
        <Compass size={24} weight="duotone" />
        <span>Atlas Exchange</span>
        <p>London first. Global exchange paths next.</p>
      </footer>
    </main>
  );
}
