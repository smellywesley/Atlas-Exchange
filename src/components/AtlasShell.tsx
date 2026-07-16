"use client";
/* eslint-disable @next/next/no-img-element -- campus imagery is supplied as verified local WebP assets. */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import {
  ArrowSquareOut,
  CalendarCheck,
  Coffee,
  Compass,
  ForkKnife,
  HouseLine,
  MagnifyingGlass,
  MapTrifold,
  MapPin,
  NavigationArrow,
  Package,
  Star,
  Storefront,
  Train,
  Wallet
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { regions, londonPartners } from "@/lib/demo-data";
import {
  exchangeCountries,
  getAllUniversities,
  getCampusIntelligence,
  getDefaultCountryForRegion,
  getUniversityIdentityTitle,
  getUniversityRouteKey
} from "@/lib/exchange-map-data";
import { getUniversityAsset, getUniversityImagePath } from "@/lib/university-assets";
import {
  providerStatusSchema,
  type DestinationRegion,
  type ExchangePlan,
  type ExchangeProfileInput,
  type PlanResponse,
  type ProviderStatus
} from "@/lib/schema";
import type { ExchangeCountry } from "@/lib/exchange-map-data";
import type {
  CampusPlace,
  ExchangeUniversity,
  SearchableExchangeUniversity
} from "@/lib/exchange-map-data";
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

const fallbackProviderStatus: ProviderStatus = {
  mode: "mock",
  planner: "deterministic",
  search: "live-link",
  reportDelivery: {
    pdf: "available",
    email: "disabled"
  },
  costControl: {
    llmCallsPerSubmit: 0,
    maxSourceSnippets: 6,
    maxOutputTokens: 1800,
    cacheRecommended: true
  },
  warnings: ["Provider status was not supplied by the server. Deterministic planning is active."]
};

type AtlasShellProps = {
  initialPlan: ExchangePlan;
  initialProviderStatus?: ProviderStatus;
};

export function AtlasShell({ initialPlan, initialProviderStatus }: AtlasShellProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [providerStatus, setProviderStatus] = useState(
    initialProviderStatus ?? fallbackProviderStatus
  );
  const [activeRegion, setActiveRegion] = useState<DestinationRegion>("uk");
  const [selectedCountry, setSelectedCountry] = useState<ExchangeCountry>(
    exchangeCountries.find((country) => country.id === "united-kingdom") ?? exchangeCountries[0]
  );
  const [isCountryDetailOpen, setIsCountryDetailOpen] = useState(false);
  const [highlightedUniversityKey, setHighlightedUniversityKey] = useState(
    "University College London::university-wide::"
  );
  const [universityQuery, setUniversityQuery] = useState("");
  const committedSelection = useRef({
    activeRegion: "uk" as DestinationRegion,
    selectedCountry,
    isCountryDetailOpen: false,
    highlightedUniversityKey: "University College London::university-wide::",
    universityQuery: ""
  });
  const requestState = useRef<{ sequence: number; controller: AbortController | null }>({
    sequence: 0,
    controller: null
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const parsed = providerStatusSchema.safeParse(await response.json());
        if (parsed.success) setProviderStatus(parsed.data);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Runtime provider status is unavailable.", error);
        }
      });

    return () => controller.abort();
  }, []);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isReportDeliveryWorking, setIsReportDeliveryWorking] = useState(false);
  const [planError, setPlanError] = useState("");
  const selectedExchangeUniversity = useMemo(
    () =>
      selectedCountry.universities.find((university) => getUniversityRouteKey(university) === highlightedUniversityKey) ??
      selectedCountry.universities[0],
    [highlightedUniversityKey, selectedCountry]
  );
  const selectedUniversityAsset = getUniversityAsset(selectedExchangeUniversity.name);
  const selectedUniversityImage = selectedUniversityAsset?.imagePath;
  const campusIntelligence = useMemo(
    () => getCampusIntelligence(selectedCountry, selectedExchangeUniversity),
    [selectedCountry, selectedExchangeUniversity]
  );
  const universityResults = useMemo(() => {
    const query = universityQuery.trim().toLowerCase();

    if (!query) {
      return [] as SearchableExchangeUniversity[];
    }

    return getAllUniversities()
      .filter((university) => {
        const searchable = [
          university.name,
          university.city,
          university.country.name,
          university.partnership,
          university.faculties?.join(" ") ?? ""
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 8);
  }, [universityQuery]);

  useEffect(() => () => requestState.current.controller?.abort(), []);

  function getCurrentProfileInput(): ExchangeProfileInput {
    return {
      partnerUniversityId: plan.profile.partnerUniversityId,
      countryId: selectedCountry.id,
      universityName: selectedExchangeUniversity.name,
      universityPartnership: selectedExchangeUniversity.partnership,
      monthlyBudgetSgd: plan.profile.monthlyBudgetSgd,
      stayLengthMonths: plan.profile.stayLengthMonths,
      housingPreference: plan.profile.housingPreference,
      travelStyle: plan.profile.travelStyle,
      dietaryNeeds: plan.profile.dietaryNeeds,
      plannedActivities: plan.profile.plannedActivities,
      academicYear: plan.profile.academicYear ?? "",
      nusModuleCodes: plan.profile.nusModuleCodes ?? [],
      startDate: plan.profile.startDate || undefined,
      endDate: plan.profile.endDate || undefined,
      studentEmail: plan.profile.studentEmail ?? ""
    };
  }

  async function requestPlan(
    country: ExchangeCountry,
    university: ExchangeUniversity,
    input: ExchangeProfileInput,
    signal: AbortSignal
  ) {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal,
      body: JSON.stringify({
        ...input,
        countryId: country.id,
        universityName: university.name,
        universityPartnership: university.partnership
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(payload.error ?? `Plan request failed with ${response.status}`);
    }

    const payload = await response.json() as Omit<PlanResponse, "providerStatus"> & {
      providerStatus?: unknown;
    };
    const parsedStatus = providerStatusSchema.safeParse(payload.providerStatus);

    return {
      plan: payload.plan,
      providerStatus: parsedStatus.success ? parsedStatus.data : fallbackProviderStatus
    };
  }

  async function runPlanRequest(
    country: ExchangeCountry,
    university: ExchangeUniversity,
    input: ExchangeProfileInput,
    nextSelection = {
      activeRegion,
      selectedCountry,
      isCountryDetailOpen,
      highlightedUniversityKey,
      universityQuery
    }
  ) {
    if (isReportDeliveryWorking) return;
    requestState.current.controller?.abort();
    const controller = new AbortController();
    const sequence = requestState.current.sequence + 1;
    requestState.current = { sequence, controller };
    setIsPlanLoading(true);
    setPlanError("");
    try {
      const response = await requestPlan(country, university, input, controller.signal);
      if (requestState.current.sequence !== sequence) {
        return;
      }
      setPlan(response.plan);
      setProviderStatus(response.providerStatus);
      committedSelection.current = nextSelection;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error(error);
      if (requestState.current.sequence === sequence) {
        const previousSelection = committedSelection.current;
        setPlanError(error instanceof Error ? error.message : "Plan update failed.");
        setActiveRegion(previousSelection.activeRegion);
        setSelectedCountry(previousSelection.selectedCountry);
        setIsCountryDetailOpen(previousSelection.isCountryDetailOpen);
        setHighlightedUniversityKey(previousSelection.highlightedUniversityKey);
        setUniversityQuery(previousSelection.universityQuery);
      }
    } finally {
      if (requestState.current.sequence === sequence) {
        setIsPlanLoading(false);
      }
    }
  }

  async function syncPlanToSelection(
    country: ExchangeCountry,
    university: ExchangeUniversity,
    nextSelection: typeof committedSelection.current
  ) {
    await runPlanRequest(country, university, getCurrentProfileInput(), nextSelection);
  }

  async function handleProfileSubmit(input: ExchangeProfileInput) {
    await runPlanRequest(selectedCountry, selectedExchangeUniversity, input);
  }

  function scrollToCampusIntelligence() {
    window.requestAnimationFrame(() => {
      document.getElementById("campus-intelligence")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function handleRegionSelect(region: DestinationRegion) {
    if (isReportDeliveryWorking) return;
    const defaultCountry = getDefaultCountryForRegion(region);
    const nextSelection = {
      activeRegion: region,
      selectedCountry: defaultCountry,
      isCountryDetailOpen: false,
      highlightedUniversityKey: getUniversityRouteKey(defaultCountry.universities[0]),
      universityQuery: ""
    };
    setActiveRegion(region);
    setSelectedCountry(defaultCountry);
    setIsCountryDetailOpen(false);
    setHighlightedUniversityKey(nextSelection.highlightedUniversityKey);
    setUniversityQuery("");
    void syncPlanToSelection(defaultCountry, defaultCountry.universities[0], nextSelection);
  }

  function handleCountrySelect(
    country: ExchangeCountry,
    universityName?: string,
    shouldScroll = false,
    routeKey?: string,
    searchQuery = ""
  ) {
    if (isReportDeliveryWorking) return;
    const selectedUniversity =
      country.universities.find((university) => getUniversityRouteKey(university) === routeKey) ??
      country.universities.find((university) => university.name === universityName) ??
      country.universities[0];
    const nextSelection = {
      activeRegion: country.region,
      selectedCountry: country,
      isCountryDetailOpen: true,
      highlightedUniversityKey: getUniversityRouteKey(selectedUniversity),
      universityQuery: searchQuery
    };
    setSelectedCountry(country);
    setActiveRegion(country.region);
    setIsCountryDetailOpen(true);
    setHighlightedUniversityKey(nextSelection.highlightedUniversityKey);
    setUniversityQuery(searchQuery);
    void syncPlanToSelection(country, selectedUniversity, nextSelection);
    if (shouldScroll) {
      scrollToCampusIntelligence();
    }
  }

  function handleUniversitySelect(result: SearchableExchangeUniversity) {
    handleCountrySelect(result.country, result.name, true, getUniversityRouteKey(result), result.name);
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

      <motion.section id="top" className="hero-section" {...sectionMotion} initial={false}>
        <div className="hero-backdrop" aria-hidden="true">
          {selectedUniversityImage && <img src={selectedUniversityImage} alt="" />}
        </div>
        <div className="hero-copy">
          <p className="hero-kicker">{plan.profile.destinationCity} exchange path</p>
          <h1>Plan the semester before it starts.</h1>
          <p>
            Atlas Exchange turns housing, budgets, packing, and deadlines into one departure plan with visible sources.
          </p>
          <div className="hero-actions">
            <a href="#planner" className="button primary">
              Build exchange plan
            </a>
            <a href="#regions" className="button secondary">
              View regions
            </a>
          </div>
        </div>
        <div className="hero-card" aria-label={`${plan.profile.destinationCity} plan preview`}>
          {selectedUniversityImage ? (
            <img
              className="hero-card-image"
              src={selectedUniversityImage}
              alt={`${selectedExchangeUniversity.name} campus`}
            />
          ) : (
            <div className="hero-card-image" aria-hidden="true" />
          )}
          <div className="hero-card-body">
            <span>Ready path</span>
            <strong>{plan.partnerUniversity.name}</strong>
            <p>{plan.partnerUniversity.city} housing, commute, budget, packing, and deadlines.</p>
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
            countries={exchangeCountries}
            selectedCountry={selectedCountry}
            isDetailOpen={isCountryDetailOpen}
            highlightedUniversityKey={highlightedUniversityKey}
            onCountrySelect={handleCountrySelect}
            disabled={isReportDeliveryWorking}
          />
          <div className="region-list">
            {regions.map((region) => (
              <button
                key={region.id}
                className={`region-tile ${region.id === activeRegion ? "active" : ""}`}
                aria-pressed={region.id === activeRegion}
                disabled={isReportDeliveryWorking}
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
          <div className="university-search-panel">
            <div className="university-search-field">
              <MagnifyingGlass size={20} weight="bold" />
              <input
                value={universityQuery}
                onChange={(event) => setUniversityQuery(event.target.value)}
                placeholder="Search partner universities"
                aria-label="Search partner universities"
                disabled={isReportDeliveryWorking}
              />
            </div>
            <div className="university-search-results" aria-label="University search results">
              {universityQuery.trim() ? (
                universityResults.length > 0 ? (
                  universityResults.map((result) => (
                    <button
                      key={`${result.countryId}-${result.name}-${result.index}`}
                      type="button"
                      disabled={isReportDeliveryWorking}
                      onClick={() => handleUniversitySelect(result)}
                    >
                      <span>{result.country.name} / {result.city}</span>
                      <strong>{result.name}</strong>
                    </button>
                  ))
                ) : (
                  <p>No partner university found for this search yet.</p>
                )
              ) : (
                <p>Search by university, city, country, or faculty route.</p>
              )}
            </div>
          </div>
          {selectedCountry.universities.map((university, index) => {
            const londonPartner = londonPartners.find((partner) => partner.name === university.name);
            return (
                <button
                  key={`${university.name}-${university.city}-${university.partnership}`}
                  type="button"
                  className={`university-card ${getUniversityRouteKey(university) === highlightedUniversityKey ? "active" : ""}`}
                  aria-pressed={getUniversityRouteKey(university) === highlightedUniversityKey}
                  disabled={isReportDeliveryWorking}
                  onClick={() => handleCountrySelect(selectedCountry, university.name, true, getUniversityRouteKey(university))}
                >
                  <UniversityVisual
                    country={selectedCountry}
                    university={university}
                    subtitle={university.city}
                    index={index}
                  />
                  <div className="university-body">
                    <span>{londonPartner?.campusArea ?? university.city} / {university.partnership}</span>
                    <h3>{university.name}</h3>
                    <p>
                      {londonPartner
                        ? londonPartner.strengths.join(", ")
                        : university.faculties
                        ? `Faculty route: ${university.faculties.join(", ")}`
                        : selectedCountry.logisticsAngle}
                    </p>
                  </div>
                </button>
              );
          })}
        </div>
        <CampusIntelligencePanel
          campus={campusIntelligence}
          accent={selectedCountry.accent}
        />
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
          <IntakePanel
            plan={plan}
            onSubmit={handleProfileSubmit}
            disabled={isReportDeliveryWorking}
          />
          <div className="planner-output">
            {planError && <p className="plan-error" role="alert">{planError}</p>}
            <PlanDashboard
              plan={plan}
              providerStatus={providerStatus}
              isPlanLoading={isPlanLoading}
              onReportDeliveryStateChange={setIsReportDeliveryWorking}
            />
          </div>
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
          <span>Destination, room, and activity aware</span>
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
          {selectedUniversityAsset && (
            <a
              href={selectedUniversityAsset.attribution.source_page_url || selectedUniversityAsset.attribution.url}
              target="_blank"
              rel="noreferrer"
              className="source-row campus-attribution-row"
            >
              <img src={selectedUniversityAsset.imagePath} alt="" />
              <div>
                <span>
                  Campus image / {selectedUniversityAsset.attribution.license || "attribution pending"}
                </span>
                <strong>{selectedUniversityAsset.attribution.title}</strong>
                <small>
                  {selectedUniversityAsset.attribution.author || "Author not supplied"}
                  {selectedUniversityAsset.attribution.license_url && selectedUniversityAsset.attribution.usage_terms
                    ? " / source and usage terms recorded"
                    : " / incomplete attribution record - verify before public launch"}
                </small>
              </div>
              <ArrowSquareOut size={20} />
            </a>
          )}
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
        <p>{plan.profile.destinationCity} plan selected. Global partner paths connected.</p>
      </footer>
    </main>
  );
}

function UniversityVisual({
  country,
  university,
  subtitle,
  index
}: {
  country: ExchangeCountry;
  university: ExchangeUniversity;
  subtitle: string;
  index: number;
}) {
  const identityTitle = getUniversityIdentityTitle(university);
  const localImage = getUniversityImagePath(university.name);
  const [localImageFailed, setLocalImageFailed] = useState(false);
  const visualSource = localImageFailed ? undefined : localImage;

  useEffect(() => {
    setLocalImageFailed(false);
  }, [localImage]);

  return (
    <div
      className={`university-image template-${country.template}`}
      style={{ "--country-accent": country.accent } as CSSProperties}
      aria-hidden="true"
    >
      {visualSource ? (
        <img
          className="university-identity-photo"
          src={visualSource}
          alt=""
          loading="lazy"
          onError={() => setLocalImageFailed(true)}
        />
      ) : (
        <div className="university-identity-fallback">
          <span className="campus-layout-line line-a" />
          <span className="campus-layout-line line-b" />
          <span className="campus-layout-line line-c" />
          <span className="campus-layout-node node-a" />
          <span className="campus-layout-node node-b" />
          <span className="campus-layout-node node-c" />
        </div>
      )}
      <div className="visual-caption">
        <span>{subtitle}</span>
        <strong>{index + 1 < 10 ? `0${index + 1}` : index + 1}</strong>
      </div>
      <span className="visual-source">Campus image</span>
      <p>{identityTitle}</p>
    </div>
  );
}

function CampusIntelligencePanel({
  campus,
  accent
}: {
  campus: ReturnType<typeof getCampusIntelligence>;
  accent: string;
}) {
  return (
    <motion.div
      id="campus-intelligence"
      className="campus-intelligence"
      style={{ "--country-accent": accent } as CSSProperties}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.76, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="campus-intel-copy">
        <p className="section-kicker">Local life around campus</p>
        <h3>{campus.university.name} on the ground.</h3>
        <p>
          The selected university opens into a Maps-aware student layer: campus location first, then groceries,
          food, study spots, and transit checks around a practical 10-minute radius.
        </p>
      </div>

      <div className="campus-intel-grid">
        <article className="campus-map-panel">
          <div className="campus-map-frame">
            <iframe
              title={`${campus.university.name} Google Maps preview`}
              src={campus.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="campus-map-overlay">
            <div>
              <span>{campus.country.name} / {campus.university.city}</span>
              <strong>{campus.university.name}</strong>
              <small>Google Maps satellite preview</small>
            </div>
            <a href={campus.mapUrl} target="_blank" rel="noreferrer">
              <MapTrifold size={18} weight="bold" />
              Open Maps
            </a>
          </div>
        </article>

        <div className="campus-place-stack">
          {campus.places.map((place, index) => (
            <motion.a
              key={place.id}
              href={place.mapUrl}
              target="_blank"
              rel="noreferrer"
              className={`campus-place-card place-${place.category}`}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="place-icon">
                <PlaceIcon place={place} />
              </div>
              <div>
                <span>{place.radiusMinutes} min radius / Google Maps</span>
                <strong>{place.title}</strong>
                <p>{place.description}</p>
                <small>
                  <Star size={14} weight="fill" />
                  {place.reviewSignal}
                </small>
              </div>
              <ArrowSquareOut size={18} weight="bold" />
            </motion.a>
          ))}
        </div>
      </div>

      <div className="campus-action-row">
        <a href={campus.directionsUrl} target="_blank" rel="noreferrer">
          <NavigationArrow size={18} weight="bold" />
          Directions
        </a>
        <a href={campus.radiusUrl} target="_blank" rel="noreferrer">
          <MapPin size={18} weight="bold" />
          Review radius
        </a>
        <span>{campus.campusQuery}</span>
      </div>
    </motion.div>
  );
}

function PlaceIcon({ place }: { place: CampusPlace }) {
  if (place.category === "groceries") {
    return <Storefront size={22} weight="duotone" />;
  }

  if (place.category === "food") {
    return <ForkKnife size={22} weight="duotone" />;
  }

  if (place.category === "study") {
    return <Coffee size={22} weight="duotone" />;
  }

  return <Train size={22} weight="duotone" />;
}
