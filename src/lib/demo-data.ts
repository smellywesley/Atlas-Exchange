import type { DestinationRegion, PartnerUniversity } from "./schema";

export type RegionStory = {
  id: DestinationRegion;
  eyebrow: string;
  title: string;
  description: string;
  cities: string[];
  image: string;
  readiness: "golden-path" | "scenario-ready" | "coming-next";
};

export const regions: RegionStory[] = [
  {
    id: "uk",
    eyebrow: "Golden path",
    title: "London",
    description:
      "A dense exchange city where housing, commute, and budget decisions matter immediately.",
    cities: ["London"],
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&q=80",
    readiness: "golden-path"
  },
  {
    id: "asia",
    eyebrow: "Asia path",
    title: "Seoul",
    description:
      "High-energy campus life with weather-aware packing and neighborhood planning.",
    cities: ["Seoul", "Tokyo", "Singapore"],
    image:
      "https://images.unsplash.com/photo-1538485399081-7c8d89e033e6?auto=format&fit=crop&w=1800&q=80",
    readiness: "scenario-ready"
  },
  {
    id: "europe",
    eyebrow: "Europe path",
    title: "Continental Europe",
    description:
      "Rail-first weekends, mixed languages, and scholarship-sensitive budgets.",
    cities: ["Zurich", "Paris", "Milan"],
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=80",
    readiness: "scenario-ready"
  },
  {
    id: "us",
    eyebrow: "Elite path",
    title: "US campuses",
    description:
      "Large campus ecosystems where accommodation timing can decide the whole semester.",
    cities: ["Berkeley", "Philadelphia", "New York"],
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=80",
    readiness: "coming-next"
  },
  {
    id: "south-america",
    eyebrow: "South America path",
    title: "Sao Paulo",
    description:
      "Urban scale, language immersion, and local transport planning in one plan.",
    cities: ["Sao Paulo", "Santiago"],
    image:
      "https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&w=1800&q=80",
    readiness: "coming-next"
  }
];

export const londonPartners: PartnerUniversity[] = [
  {
    id: "ucl",
    name: "University College London",
    country: "United Kingdom",
    city: "London",
    region: "uk",
    termLabel: "Autumn exchange",
    campusArea: "Bloomsbury",
    heroImage:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1800&q=80",
    accommodationUrl: "https://www.ucl.ac.uk/accommodation/",
    strengths: ["central campus", "research depth", "dense student housing market"]
  },
  {
    id: "kcl",
    name: "King's College London",
    country: "United Kingdom",
    city: "London",
    region: "uk",
    termLabel: "Autumn exchange",
    campusArea: "Strand",
    heroImage:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1800&q=80",
    accommodationUrl: "https://www.kcl.ac.uk/accommodation",
    strengths: ["central commute", "culture access", "strong humanities network"]
  },
  {
    id: "imperial",
    name: "Imperial College London",
    country: "United Kingdom",
    city: "London",
    region: "uk",
    termLabel: "Autumn exchange",
    campusArea: "South Kensington",
    heroImage:
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1800&q=80",
    accommodationUrl: "https://www.imperial.ac.uk/students/accommodation/",
    strengths: ["STEM focus", "museum district", "higher rent pressure"]
  },
  {
    id: "lse",
    name: "London School of Economics",
    country: "United Kingdom",
    city: "London",
    region: "uk",
    termLabel: "Autumn exchange",
    campusArea: "Holborn",
    heroImage:
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1800&q=80",
    accommodationUrl: "https://www.lse.ac.uk/student-life/accommodation",
    strengths: ["urban campus", "policy network", "fast housing competition"]
  }
];
