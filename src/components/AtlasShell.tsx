"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  buildUniversitySummaryTitles,
  imageMatchesUniversityIdentity,
  isInstitutionPhotoUrl
} from "@/lib/university-image-search";
import {
  exchangeCountries,
  getAllUniversities,
  getCampusIntelligence,
  getCountriesForRegion,
  getDefaultCountryForRegion,
  getUniversityIdentityTitle
} from "@/lib/exchange-map-data";
import type {
  DestinationRegion,
  ExchangePlan,
  ExchangeProfileInput,
  PlanResponse,
  PartnerUniversity,
  ProviderStatus
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

const identityImageCache = new Map<string, string | null>();

const fallbackProviderStatus: ProviderStatus = {
  mode: "mock",
  planner: "deterministic",
  search: "live-link",
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
  const [highlightedUniversityName, setHighlightedUniversityName] = useState<string | undefined>(
    "University College London"
  );
  const [universityQuery, setUniversityQuery] = useState("");
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
  const selectedExchangeUniversity = useMemo(
    () =>
      selectedCountry.universities.find((university) => university.name === highlightedUniversityName) ??
      selectedCountry.universities[0],
    [highlightedUniversityName, selectedCountry]
  );
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

  function getCurrentProfileInput(): ExchangeProfileInput {
    return {
      partnerUniversityId: plan.profile.partnerUniversityId,
      countryId: selectedCountry.id,
      universityName: selectedExchangeUniversity.name,
      monthlyBudgetSgd: plan.profile.monthlyBudgetSgd,
      stayLengthMonths: plan.profile.stayLengthMonths,
      housingPreference: plan.profile.housingPreference,
      travelStyle: plan.profile.travelStyle,
      dietaryNeeds: plan.profile.dietaryNeeds,
      plannedActivities: plan.profile.plannedActivities
    };
  }

  async function requestPlan(
    country: ExchangeCountry,
    university: ExchangeUniversity,
    input: ExchangeProfileInput
  ) {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...input,
        countryId: country.id,
        universityName: university.name
      })
    });

    if (!response.ok) {
      throw new Error(`Plan request failed with ${response.status}`);
    }

    return response.json() as Promise<PlanResponse>;
  }

  async function syncPlanToSelection(country: ExchangeCountry, university: ExchangeUniversity) {
    try {
      const response = await requestPlan(country, university, getCurrentProfileInput());
      setPlan(response.plan);
      setProviderStatus(response.providerStatus);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleProfileSubmit(input: ExchangeProfileInput) {
    try {
      const response = await requestPlan(selectedCountry, selectedExchangeUniversity, input);
      setPlan(response.plan);
      setProviderStatus(response.providerStatus);
    } catch (error) {
      console.error(error);
    }
  }

  function scrollToCampusIntelligence() {
    window.requestAnimationFrame(() => {
      document.getElementById("campus-intelligence")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  async function handlePartnerSelect(partner: PartnerUniversity) {
    const ukCountry = exchangeCountries.find((country) => country.id === "united-kingdom") ?? selectedCountry;
    const ukUniversity =
      ukCountry.universities.find((university) => university.name === partner.name) ??
      ukCountry.universities[0];

    const input = {
      partnerUniversityId: partner.id,
      monthlyBudgetSgd: plan.profile.monthlyBudgetSgd,
      stayLengthMonths: plan.profile.stayLengthMonths,
      housingPreference: plan.profile.housingPreference,
      travelStyle: plan.profile.travelStyle,
      dietaryNeeds: plan.profile.dietaryNeeds,
      plannedActivities: plan.profile.plannedActivities
    };

    setActiveRegion("uk");
    setSelectedCountry(ukCountry);
    setIsCountryDetailOpen(true);
    setHighlightedUniversityName(partner.name);
    try {
      const response = await requestPlan(ukCountry, ukUniversity, input);
      setPlan(response.plan);
      setProviderStatus(response.providerStatus);
    } catch (error) {
      console.error(error);
    }
    scrollToCampusIntelligence();
  }

  function handleRegionSelect(region: DestinationRegion) {
    const defaultCountry = getDefaultCountryForRegion(region);
    setActiveRegion(region);
    setSelectedCountry(defaultCountry);
    setIsCountryDetailOpen(false);
    setHighlightedUniversityName(defaultCountry.universities[0]?.name);
    void syncPlanToSelection(defaultCountry, defaultCountry.universities[0]);
  }

  function handleCountrySelect(country: ExchangeCountry, universityName?: string, shouldScroll = false) {
    const selectedUniversity =
      country.universities.find((university) => university.name === universityName) ??
      country.universities[0];
    setSelectedCountry(country);
    setActiveRegion(country.region);
    setIsCountryDetailOpen(true);
    setHighlightedUniversityName(selectedUniversity.name);
    void syncPlanToSelection(country, selectedUniversity);
    if (shouldScroll) {
      scrollToCampusIntelligence();
    }
  }

  function handleUniversitySelect(result: SearchableExchangeUniversity) {
    setUniversityQuery(result.name);
    handleCountrySelect(result.country, result.name, true);
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
              Build exchange plan
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
            highlightedUniversityName={highlightedUniversityName}
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
          <div className="university-search-panel">
            <div className="university-search-field">
              <MagnifyingGlass size={20} weight="bold" />
              <input
                value={universityQuery}
                onChange={(event) => setUniversityQuery(event.target.value)}
                placeholder="Search partner universities"
                aria-label="Search partner universities"
              />
            </div>
            <div className="university-search-results" aria-label="University search results">
              {universityQuery.trim() ? (
                universityResults.length > 0 ? (
                  universityResults.map((result) => (
                    <button
                      key={`${result.countryId}-${result.name}-${result.index}`}
                      type="button"
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
          {selectedCountry.id === "united-kingdom"
            ? londonPartners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  className={`university-card ${partner.id === activePartner.id ? "active" : ""}`}
                  onClick={() => handlePartnerSelect(partner)}
                >
                  <UniversityVisual
                    country={selectedCountry}
                    university={{
                      name: partner.name,
                      city: partner.city,
                      partnership: "university-wide"
                    }}
                    subtitle={partner.campusArea}
                    index={londonPartners.findIndex((item) => item.id === partner.id)}
                  />
                  <div className="university-body">
                    <span>{partner.campusArea}</span>
                    <h3>{partner.name}</h3>
                    <p>{partner.strengths.join(", ")}</p>
                  </div>
                </button>
              ))
            : selectedCountry.universities.slice(0, 8).map((university, index) => (
                <button
                  key={`${university.name}-${university.city}-${university.partnership}`}
                  type="button"
                  className={`university-card ${university.name === highlightedUniversityName ? "active" : ""}`}
                  onClick={() => handleCountrySelect(selectedCountry, university.name, true)}
                >
                  <UniversityVisual
                    country={selectedCountry}
                    university={university}
                    subtitle={university.city}
                    index={index}
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
                </button>
              ))}
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
  const identityImage = useUniversityIdentityImage(university);
  const identityTitle = getUniversityIdentityTitle(university);

  return (
    <div
      className={`university-image template-${country.template}`}
      style={{ "--country-accent": country.accent } as CSSProperties}
      aria-hidden="true"
    >
      {identityImage ? (
        <img
          className="university-identity-photo"
          src={identityImage}
          alt=""
          loading="lazy"
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

function useUniversityIdentityImage(university: ExchangeUniversity) {
  const identityTitle = getUniversityIdentityTitle(university);
  const cacheKey = `${university.name}::${identityTitle}`;
  const [imageUrl, setImageUrl] = useState<string | null>(() => identityImageCache.get(cacheKey) ?? null);
  const universityName = university.name;
  const universityCity = university.city;

  useEffect(() => {
    let isMounted = true;
    const cached = identityImageCache.get(cacheKey);

    if (cached !== undefined) {
      setImageUrl(cached);
      return () => {
        isMounted = false;
      };
    }

    const controller = new AbortController();

    resolveCommonsCampusImage(
      {
        name: universityName,
        city: universityCity,
        identityTitle
      },
      controller.signal
    )
      .then((resolvedImage) => {
        identityImageCache.set(cacheKey, resolvedImage);
        if (isMounted) {
          setImageUrl(resolvedImage);
        }
      })
      .catch(() => {
        identityImageCache.set(cacheKey, null);
        if (isMounted) {
          setImageUrl(null);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [cacheKey, identityTitle, universityCity, universityName]);

  return imageUrl;
}

async function resolveCommonsCampusImage(
  university: Pick<ExchangeUniversity, "name" | "city" | "identityTitle">,
  signal: AbortSignal
): Promise<string | null> {
  for (const title of buildUniversitySummaryTitles(university)) {
    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(endpoint, { signal });
    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as WikipediaSummaryResponse;
    const imageUrl = payload.thumbnail?.source ?? payload.originalimage?.source;

    if (
      imageUrl &&
      isInstitutionPhotoUrl(imageUrl) &&
      imageMatchesUniversityIdentity(university, payload.title ?? title, { thumburl: imageUrl })
    ) {
      return imageUrl;
    }
  }

  return null;
}

type WikipediaSummaryResponse = {
  title?: string;
  thumbnail?: {
    source?: string;
  };
  originalimage?: {
    source?: string;
  };
};

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
