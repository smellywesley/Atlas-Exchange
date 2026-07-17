"use client";

import { FormEvent, useState } from "react";
import { ArrowsClockwise, GraduationCap } from "@phosphor-icons/react";
import type { UniversityProfile } from "@/lib/university-research";

type UniversityCompareProps = {
  defaultNames: string[];
};

const MAX_NAMES = 4;

export function UniversityCompare({ defaultNames }: UniversityCompareProps) {
  const [namesInput, setNamesInput] = useState(defaultNames.slice(0, MAX_NAMES).join(", "));
  const [profiles, setProfiles] = useState<UniversityProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const names = namesInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, MAX_NAMES);

    if (names.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/universities/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityNames: names })
      });
      if (!response.ok) {
        const payload = await readErrorPayload(response);
        throw new Error(payload ?? `Compare request failed with ${response.status}`);
      }
      const data = (await response.json()) as { universities: UniversityProfile[] };
      setProfiles(data.universities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare universities");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh(profile: UniversityProfile) {
    setError(null);
    try {
      const response = await fetch(`/api/universities/${encodeURIComponent(profile.universityName)}/refresh`, {
        method: "POST"
      });
      if (!response.ok) {
        const payload = await readErrorPayload(response);
        throw new Error(payload ?? `Refresh failed with ${response.status}`);
      }
      const updated = (await response.json()) as UniversityProfile;
      setProfiles((current) =>
        current.map((item) => (item.universityName === profile.universityName ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh university research");
    }
  }

  return (
    <div className="compare-panel">
      <form className="compare-form" onSubmit={handleCompare}>
        <input
          value={namesInput}
          onChange={(event) => setNamesInput(event.target.value)}
          placeholder="University College London, King's College London"
          aria-label="University names, comma separated"
          maxLength={640}
        />
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? "Researching…" : "Compare"}
        </button>
      </form>
      <p className="compare-hint">Up to {MAX_NAMES} universities per comparison.</p>

      {error && <p className="tracker-error">{error}</p>}
      {loading && <p>Researching universities… this can take a while with live web search.</p>}

      {!loading && profiles.length === 0 && (
        <p>Enter comma-separated university names to research cost of living, language, CCAs, and weekend trips.</p>
      )}

      <div className="research-grid">
        {profiles.map((profile) => (
          <ResearchCard key={profile.universityName} profile={profile} onRefresh={handleRefresh} />
        ))}
      </div>
    </div>
  );
}

async function readErrorPayload(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? null;
  } catch {
    return null;
  }
}

function ResearchCard({
  profile,
  onRefresh
}: {
  profile: UniversityProfile;
  onRefresh: (profile: UniversityProfile) => void;
}) {
  const { costOfLiving, weekendPlans } = profile;

  return (
    <article className="research-card">
      <div className="research-card-header">
        <GraduationCap size={22} />
        <div>
          <h4>{profile.universityName}</h4>
          <span>{profile.country || "Country pending research"}</span>
        </div>
        <span className={`mode-pill ${profile.mode}`}>{profile.mode}</span>
      </div>

      <div className="research-section">
        <h5>Language</h5>
        <p>{profile.primaryLanguage || "—"}. {profile.languageNotes}</p>
      </div>

      <div className="research-section">
        <h5>Cost of living</h5>
        <p>
          {costOfLiving.monthlyEstimateLocalCurrency || "—"} {costOfLiving.currency} / month
        </p>
        <ul>
          {costOfLiving.housing && <li>Housing: {costOfLiving.housing}</li>}
          {costOfLiving.food && <li>Food: {costOfLiving.food}</li>}
          {costOfLiving.transport && <li>Transport: {costOfLiving.transport}</li>}
        </ul>
        {costOfLiving.notes && <p>{costOfLiving.notes}</p>}
      </div>

      <div className="research-section">
        <h5>CCAs</h5>
        <ul>{profile.ccas.length > 0 ? profile.ccas.map((cca) => <li key={cca}>{cca}</li>) : <li>—</li>}</ul>
      </div>

      <div className="research-section">
        <h5>Places to explore</h5>
        <ul>
          {weekendPlans.placesToExplore.length > 0 ? (
            weekendPlans.placesToExplore.map((place) => <li key={place}>{place}</li>)
          ) : (
            <li>—</li>
          )}
        </ul>
      </div>

      <div className="research-section">
        <h5>Communities</h5>
        <ul>
          {weekendPlans.communities.length > 0 ? (
            weekendPlans.communities.map((community) => <li key={community}>{community}</li>)
          ) : (
            <li>—</li>
          )}
        </ul>
      </div>

      {profile.sources.length > 0 && (
        <div className="research-section">
          <h5>Sources</h5>
          <p className="research-sources">{profile.sources.join(" · ")}</p>
        </div>
      )}

      <button type="button" className="button secondary" onClick={() => onRefresh(profile)}>
        <ArrowsClockwise size={16} weight="bold" />
        Refresh research
      </button>
    </article>
  );
}
