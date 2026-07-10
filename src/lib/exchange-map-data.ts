import type { DestinationRegion } from "./schema";

export type PartnershipKind = "university-wide" | "faculty-level";

export type ExchangeUniversity = {
  name: string;
  city: string;
  partnership: PartnershipKind;
  faculties?: string[];
  sourceUrl?: string;
};

export type ExchangeCountry = {
  id: string;
  name: string;
  region: DestinationRegion;
  focusLabel: string;
  latitude: number;
  longitude: number;
  accent: string;
  template: "metropolis" | "mountain" | "coastal" | "campus" | "heritage" | "pacific";
  summary: string;
  logisticsAngle: string;
  universities: ExchangeUniversity[];
};

export type SearchableExchangeUniversity = ExchangeUniversity & {
  country: ExchangeCountry;
  countryId: string;
  index: number;
};

export type CampusPlaceCategory = "groceries" | "food" | "study" | "transit";

export type CampusPlace = {
  id: string;
  category: CampusPlaceCategory;
  title: string;
  description: string;
  radiusMinutes: number;
  reviewSignal: string;
  query: string;
  mapUrl: string;
};

export type CampusIntelligence = {
  university: ExchangeUniversity;
  country: ExchangeCountry;
  coordinates: { latitude: number; longitude: number };
  campusQuery: string;
  mapEmbedUrl: string;
  mapUrl: string;
  directionsUrl: string;
  radiusUrl: string;
  places: CampusPlace[];
};

const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  london: { latitude: 51.5072, longitude: -0.1276 },
  edinburgh: { latitude: 55.9533, longitude: -3.1883 },
  cambridge: { latitude: 52.2053, longitude: 0.1218 },
  oxford: { latitude: 51.752, longitude: -1.2577 },
  seoul: { latitude: 37.5665, longitude: 126.978 },
  daejeon: { latitude: 36.3504, longitude: 127.3845 },
  pohang: { latitude: 36.019, longitude: 129.3435 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  kyoto: { latitude: 35.0116, longitude: 135.7681 },
  osaka: { latitude: 34.6937, longitude: 135.5023 },
  beijing: { latitude: 39.9042, longitude: 116.4074 },
  shanghai: { latitude: 31.2304, longitude: 121.4737 },
  hangzhou: { latitude: 30.2741, longitude: 120.1551 },
  nanjing: { latitude: 32.0603, longitude: 118.7969 },
  "hong kong": { latitude: 22.3193, longitude: 114.1694 },
  taipei: { latitude: 25.033, longitude: 121.5654 },
  tainan: { latitude: 22.9999, longitude: 120.227 },
  hsinchu: { latitude: 24.8138, longitude: 120.9675 },
  sydney: { latitude: -33.8688, longitude: 151.2093 },
  melbourne: { latitude: -37.8136, longitude: 144.9631 },
  canberra: { latitude: -35.2809, longitude: 149.13 },
  brisbane: { latitude: -27.4698, longitude: 153.0251 },
  auckland: { latitude: -36.8509, longitude: 174.7645 },
  christchurch: { latitude: -43.5321, longitude: 172.6362 },
  dunedin: { latitude: -45.8788, longitude: 170.5028 },
  wellington: { latitude: -41.2924, longitude: 174.7787 },
  zurich: { latitude: 47.3769, longitude: 8.5417 },
  lausanne: { latitude: 46.5197, longitude: 6.6323 },
  geneva: { latitude: 46.2044, longitude: 6.1432 },
  "st gallen": { latitude: 47.4245, longitude: 9.3767 },
  delft: { latitude: 52.0116, longitude: 4.3571 },
  eindhoven: { latitude: 51.4416, longitude: 5.4697 },
  amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  utrecht: { latitude: 52.0907, longitude: 5.1214 },
  rotterdam: { latitude: 51.9244, longitude: 4.4777 },
  leiden: { latitude: 52.1601, longitude: 4.497 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  lyon: { latitude: 45.764, longitude: 4.8357 },
  munich: { latitude: 48.1351, longitude: 11.582 },
  aachen: { latitude: 50.7753, longitude: 6.0839 },
  berlin: { latitude: 52.52, longitude: 13.405 },
  mannheim: { latitude: 49.4875, longitude: 8.466 },
  karlsruhe: { latitude: 49.0069, longitude: 8.4037 },
  princeton: { latitude: 40.3573, longitude: -74.6672 },
  philadelphia: { latitude: 39.9526, longitude: -75.1652 },
  ithaca: { latitude: 42.443, longitude: -76.5019 },
  boston: { latitude: 42.3601, longitude: -71.0589 },
  "washington, dc": { latitude: 38.9072, longitude: -77.0369 },
  "new york": { latitude: 40.7128, longitude: -74.006 },
  california: { latitude: 37.7749, longitude: -122.4194 },
  "los angeles": { latitude: 34.0522, longitude: -118.2437 },
  seattle: { latitude: 47.6062, longitude: -122.3321 },
  eugene: { latitude: 44.0521, longitude: -123.0868 },
  stanford: { latitude: 37.4275, longitude: -122.1697 },
  toronto: { latitude: 43.6532, longitude: -79.3832 },
  vancouver: { latitude: 49.2827, longitude: -123.1207 },
  montreal: { latitude: 45.5019, longitude: -73.5674 },
  waterloo: { latitude: 43.4643, longitude: -80.5204 },
  kingston: { latitude: 44.2312, longitude: -76.486 },
  "london, ontario": { latitude: 42.9849, longitude: -81.2453 },
  monterrey: { latitude: 25.6866, longitude: -100.3161 },
  "mexico city": { latitude: 19.4326, longitude: -99.1332 },
  "sao paulo": { latitude: -23.5505, longitude: -46.6333 }
};

const universityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "university college london": { latitude: 51.5246, longitude: -0.134 },
  "king's college london": { latitude: 51.5115, longitude: -0.116 },
  "imperial college london": { latitude: 51.4988, longitude: -0.1749 },
  "london school of economics": { latitude: 51.5145, longitude: -0.1165 },
  "university of edinburgh": { latitude: 55.9445, longitude: -3.1892 },
  "university of cambridge": { latitude: 52.2043, longitude: 0.1149 },
  "university of oxford": { latitude: 51.7548, longitude: -1.2544 },
  "seoul national university": { latitude: 37.4599, longitude: 126.9519 },
  "yonsei university": { latitude: 37.5665, longitude: 126.9387 },
  "korea university": { latitude: 37.5908, longitude: 127.0278 },
  kaist: { latitude: 36.3721, longitude: 127.3601 },
  postech: { latitude: 36.0142, longitude: 129.325 },
  "university of tokyo": { latitude: 35.7127, longitude: 139.761 },
  "waseda university": { latitude: 35.709, longitude: 139.7199 },
  "keio university": { latitude: 35.6498, longitude: 139.742 },
  "kyoto university": { latitude: 35.0262, longitude: 135.7809 },
  "university of osaka": { latitude: 34.8203, longitude: 135.5235 },
  "peking university": { latitude: 39.9928, longitude: 116.3109 },
  "tsinghua university": { latitude: 40.0032, longitude: 116.3263 },
  "fudan university": { latitude: 31.299, longitude: 121.501 },
  "shanghai jiao tong university": { latitude: 31.2002, longitude: 121.4295 },
  "university of hong kong": { latitude: 22.283, longitude: 114.1378 },
  "national taiwan university": { latitude: 25.0173, longitude: 121.5398 },
  "university of sydney": { latitude: -33.8886, longitude: 151.1873 },
  "university of melbourne": { latitude: -37.7983, longitude: 144.961 },
  "eth zurich": { latitude: 47.3763, longitude: 8.548 },
  epfl: { latitude: 46.5191, longitude: 6.5668 },
  "delft university of technology": { latitude: 51.9992, longitude: 4.3734 },
  "university of amsterdam": { latitude: 52.3559, longitude: 4.9558 },
  "sciences po": { latitude: 48.8546, longitude: 2.3309 },
  "technical university of munich": { latitude: 48.1496, longitude: 11.5679 },
  "princeton university": { latitude: 40.3431, longitude: -74.6551 },
  "university of pennsylvania": { latitude: 39.9522, longitude: -75.1932 },
  "cornell university": { latitude: 42.4534, longitude: -76.4735 },
  "boston university": { latitude: 42.3505, longitude: -71.1054 },
  "georgetown university": { latitude: 38.9076, longitude: -77.0723 },
  "new york university": { latitude: 40.7295, longitude: -73.9965 },
  "university of southern california": { latitude: 34.0224, longitude: -118.2851 },
  "university of washington, seattle": { latitude: 47.6553, longitude: -122.3035 },
  "stanford university": { latitude: 37.4275, longitude: -122.1697 },
  "university of toronto": { latitude: 43.6629, longitude: -79.3957 },
  "university of british columbia": { latitude: 49.2606, longitude: -123.246 },
  "mcgill university": { latitude: 45.5048, longitude: -73.5772 },
  "fgv eaesp": { latitude: -23.5536, longitude: -46.6508 },
  "universidade de sao paulo": { latitude: -23.5596, longitude: -46.7314 }
};

export const exchangeCountries: ExchangeCountry[] = [
  {
    id: "united-kingdom",
    name: "United Kingdom",
    region: "uk",
    focusLabel: "London golden path",
    latitude: 51.5072,
    longitude: -0.1276,
    accent: "#37b7c8",
    template: "metropolis",
    summary: "Dense city campuses where accommodation timing, commute, and budget are the judge-ready story.",
    logisticsAngle: "Prioritize campus-adjacent housing, Tube/bus access, rain-ready packing, and source-linked deadlines.",
    universities: [
      { name: "University College London", city: "London", partnership: "university-wide" },
      { name: "King's College London", city: "London", partnership: "university-wide" },
      { name: "Imperial College London", city: "London", partnership: "university-wide" },
      { name: "London School of Economics", city: "London", partnership: "university-wide" },
      { name: "University of Edinburgh", city: "Edinburgh", partnership: "university-wide" },
      { name: "University of Cambridge", city: "Cambridge", partnership: "faculty-level", faculties: ["CDE", "Law"] },
      { name: "University of Oxford", city: "Oxford", partnership: "faculty-level", faculties: ["CDE"] }
    ]
  },
  {
    id: "south-korea",
    name: "South Korea",
    region: "asia",
    focusLabel: "Seoul city campus path",
    latitude: 37.5665,
    longitude: 126.978,
    accent: "#ff8f70",
    template: "metropolis",
    summary: "A high-energy exchange route with dense transit, winter-aware packing, and strong university clusters.",
    logisticsAngle: "Rank dormitory access, subway commute, SIM/payment setup, winter layers, and weekend city plans.",
    universities: [
      { name: "Seoul National University", city: "Seoul", partnership: "university-wide" },
      { name: "Yonsei University", city: "Seoul", partnership: "university-wide" },
      { name: "Korea University", city: "Seoul", partnership: "university-wide" },
      { name: "KAIST", city: "Daejeon", partnership: "university-wide" },
      { name: "POSTECH", city: "Pohang", partnership: "university-wide" },
      { name: "Ewha Womans University", city: "Seoul", partnership: "faculty-level", faculties: ["FASS", "CDE"] },
      { name: "Hanyang University", city: "Seoul", partnership: "faculty-level", faculties: ["CDE"] }
    ]
  },
  {
    id: "japan",
    name: "Japan",
    region: "asia",
    focusLabel: "Tokyo/Kansai rail path",
    latitude: 35.6762,
    longitude: 139.6503,
    accent: "#f1c96b",
    template: "heritage",
    summary: "A rail-first destination with strong academic depth and very different city/campus rhythms.",
    logisticsAngle: "Separate Tokyo, Kyoto, Osaka, and regional campuses; plan commuter passes and seasonal packing.",
    universities: [
      { name: "University of Tokyo", city: "Tokyo", partnership: "university-wide" },
      { name: "Waseda University", city: "Tokyo", partnership: "university-wide" },
      { name: "Keio University", city: "Tokyo", partnership: "university-wide" },
      { name: "Kyoto University", city: "Kyoto", partnership: "university-wide" },
      { name: "University of Osaka", city: "Osaka", partnership: "university-wide" },
      { name: "Institute of Science Tokyo", city: "Tokyo", partnership: "university-wide" },
      { name: "Hitotsubashi University", city: "Tokyo", partnership: "faculty-level", faculties: ["Law"] }
    ]
  },
  {
    id: "china",
    name: "China",
    region: "asia",
    focusLabel: "Beijing/Shanghai academic corridor",
    latitude: 31.2304,
    longitude: 121.4737,
    accent: "#e05d4f",
    template: "metropolis",
    summary: "A broad mainland route where city selection changes housing, payment, language, and daily logistics.",
    logisticsAngle: "Split Beijing and Shanghai recommendations, highlight local payment setup, and keep source confidence visible.",
    universities: [
      { name: "Peking University", city: "Beijing", partnership: "university-wide" },
      { name: "Tsinghua University", city: "Beijing", partnership: "university-wide" },
      { name: "Fudan University", city: "Shanghai", partnership: "university-wide" },
      { name: "Shanghai Jiao Tong University", city: "Shanghai", partnership: "university-wide" },
      { name: "Zhejiang University", city: "Hangzhou", partnership: "university-wide" },
      { name: "Nanjing University", city: "Nanjing", partnership: "university-wide" }
    ]
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    region: "asia",
    focusLabel: "Compact high-density campus path",
    latitude: 22.3193,
    longitude: 114.1694,
    accent: "#8fd7ff",
    template: "coastal",
    summary: "A compact destination where accommodation scarcity and transit convenience matter immediately.",
    logisticsAngle: "Compare hall availability, MTR commute, compact packing, and food/grocery budget pressure.",
    universities: [
      { name: "University of Hong Kong", city: "Hong Kong", partnership: "university-wide" },
      { name: "Chinese University of Hong Kong", city: "Hong Kong", partnership: "university-wide" },
      { name: "City University of Hong Kong", city: "Hong Kong", partnership: "university-wide" },
      { name: "Hong Kong Polytechnic University", city: "Hong Kong", partnership: "university-wide" },
      { name: "Hong Kong University of Science and Technology", city: "Hong Kong", partnership: "faculty-level", faculties: ["BIZ", "CDE", "FoS", "SoC"] }
    ]
  },
  {
    id: "taiwan",
    name: "Taiwan",
    region: "asia",
    focusLabel: "Taipei/Tainan student route",
    latitude: 25.033,
    longitude: 121.5654,
    accent: "#77e0b5",
    template: "heritage",
    summary: "A Mandarin immersion path with strong campus networks and friendly city-scale logistics.",
    logisticsAngle: "Plan metro access, food affordability, typhoon-season packing, and campus-area accommodation.",
    universities: [
      { name: "National Taiwan University", city: "Taipei", partnership: "university-wide" },
      { name: "National Cheng Kung University", city: "Tainan", partnership: "university-wide" },
      { name: "National Tsing Hua University", city: "Hsinchu", partnership: "university-wide" },
      { name: "National Yang Ming Chiao Tung University", city: "Hsinchu", partnership: "university-wide" },
      { name: "National Chengchi University", city: "Taipei", partnership: "faculty-level", faculties: ["BIZ", "FASS"] }
    ]
  },
  {
    id: "australia",
    name: "Australia",
    region: "asia",
    focusLabel: "Oceania city-campus path",
    latitude: -33.8688,
    longitude: 151.2093,
    accent: "#f3a95f",
    template: "coastal",
    summary: "Large-city campuses where rent, commute distance, and term timing shape the exchange experience.",
    logisticsAngle: "Compare Sydney, Melbourne, Brisbane, Perth, and Adelaide with rent-first budgeting.",
    universities: [
      { name: "University of Sydney", city: "Sydney", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_sydney.pdf" },
      { name: "University of Melbourne", city: "Melbourne", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_melbourne.pdf" },
      { name: "Australian National University", city: "Canberra", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_anu.pdf" },
      { name: "Monash University", city: "Melbourne", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_monash.pdf" },
      { name: "University of New South Wales", city: "Sydney", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_unsw.pdf" },
      { name: "University of Queensland", city: "Brisbane", partnership: "university-wide", sourceUrl: "https://nus.edu.sg/gro/docs/default-source/prog/sep/pu/au/sep_australia_queensland.pdf" }
    ]
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    region: "asia",
    focusLabel: "Auckland/Otago outdoors path",
    latitude: -36.8509,
    longitude: 174.7645,
    accent: "#b9d77a",
    template: "mountain",
    summary: "A lower-density exchange path with weather, outdoor activities, and city-to-campus planning.",
    logisticsAngle: "Balance accommodation scarcity, outdoor gear, grocery costs, and intercity weekend plans.",
    universities: [
      { name: "University of Auckland", city: "Auckland", partnership: "university-wide" },
      { name: "University of Canterbury", city: "Christchurch", partnership: "university-wide" },
      { name: "University of Otago", city: "Dunedin", partnership: "university-wide" },
      { name: "Victoria University of Wellington", city: "Wellington", partnership: "university-wide" },
      { name: "University of Auckland", city: "Auckland", partnership: "faculty-level", faculties: ["BIZ"] }
    ]
  },
  {
    id: "switzerland",
    name: "Switzerland",
    region: "europe",
    focusLabel: "Alpine precision path",
    latitude: 46.2044,
    longitude: 6.1432,
    accent: "#c9f0ff",
    template: "mountain",
    summary: "High-cost, high-quality campus routes where budget transparency and winter planning matter.",
    logisticsAngle: "Make rent, rail passes, winter layers, and grocery tradeoffs visible before selection.",
    universities: [
      { name: "ETH Zurich", city: "Zurich", partnership: "university-wide" },
      { name: "EPFL", city: "Lausanne", partnership: "university-wide" },
      { name: "University of Zurich", city: "Zurich", partnership: "university-wide" },
      { name: "University of Geneva", city: "Geneva", partnership: "university-wide" },
      { name: "University of Lausanne", city: "Lausanne", partnership: "university-wide" },
      { name: "University of St Gallen", city: "St Gallen", partnership: "faculty-level", faculties: ["BIZ"] }
    ]
  },
  {
    id: "netherlands",
    name: "Netherlands",
    region: "europe",
    focusLabel: "Canal campus path",
    latitude: 52.3676,
    longitude: 4.9041,
    accent: "#ffb46a",
    template: "coastal",
    summary: "Bike-and-rail city campuses with intense housing competition and strong student networks.",
    logisticsAngle: "Surface housing lead times, bike/transit setup, rain gear, and city-specific rent pressure.",
    universities: [
      { name: "Delft University of Technology", city: "Delft", partnership: "university-wide" },
      { name: "Eindhoven University of Technology", city: "Eindhoven", partnership: "university-wide" },
      { name: "University of Amsterdam", city: "Amsterdam", partnership: "university-wide" },
      { name: "Utrecht University", city: "Utrecht", partnership: "university-wide" },
      { name: "Erasmus University Rotterdam", city: "Rotterdam", partnership: "faculty-level", faculties: ["BIZ", "FASS", "Law"] },
      { name: "Leiden University", city: "Leiden", partnership: "faculty-level", faculties: ["FASS", "FoS"] }
    ]
  },
  {
    id: "france",
    name: "France",
    region: "europe",
    focusLabel: "Paris/Lyon design path",
    latitude: 48.8566,
    longitude: 2.3522,
    accent: "#b8a7ff",
    template: "heritage",
    summary: "A heritage-and-design exchange route with dense city campuses and rail weekend possibilities.",
    logisticsAngle: "Separate Paris rent pressure from regional campuses and show rail-first weekend budgets.",
    universities: [
      { name: "Sciences Po", city: "Paris", partnership: "university-wide" },
      { name: "CentraleSupelec", city: "Paris", partnership: "university-wide" },
      { name: "Mines Paris", city: "Paris", partnership: "university-wide" },
      { name: "INSA Lyon", city: "Lyon", partnership: "university-wide" },
      { name: "HEC Paris", city: "Paris", partnership: "faculty-level", faculties: ["BIZ"] },
      { name: "ESSEC Business School", city: "Paris", partnership: "faculty-level", faculties: ["BIZ"] }
    ]
  },
  {
    id: "germany",
    name: "Germany",
    region: "europe",
    focusLabel: "Research city path",
    latitude: 52.52,
    longitude: 13.405,
    accent: "#d9e0e5",
    template: "campus",
    summary: "A distributed research route with many city choices and engineering-heavy pathways.",
    logisticsAngle: "Compare Berlin, Munich, Aachen, Mannheim, and Hamburg with rent, semester ticket, and winter gear.",
    universities: [
      { name: "Technical University of Munich", city: "Munich", partnership: "university-wide" },
      { name: "RWTH Aachen University", city: "Aachen", partnership: "university-wide" },
      { name: "Free University of Berlin", city: "Berlin", partnership: "university-wide" },
      { name: "Humboldt University of Berlin", city: "Berlin", partnership: "university-wide" },
      { name: "University of Mannheim", city: "Mannheim", partnership: "university-wide" },
      { name: "Karlsruhe Institute of Technology", city: "Karlsruhe", partnership: "university-wide" }
    ]
  },
  {
    id: "usa-east",
    name: "USA East Coast",
    region: "us",
    focusLabel: "East Coast campus corridor",
    latitude: 40.7128,
    longitude: -74.006,
    accent: "#8ec5ff",
    template: "campus",
    summary: "A dense corridor of city and college-town campuses where housing calendars and health cover matter.",
    logisticsAngle: "Split urban rent pressure from college-town housing, and keep visa/insurance deadlines prominent.",
    universities: [
      { name: "Princeton University", city: "Princeton", partnership: "university-wide" },
      { name: "University of Pennsylvania", city: "Philadelphia", partnership: "university-wide" },
      { name: "Cornell University", city: "Ithaca", partnership: "university-wide" },
      { name: "Boston University", city: "Boston", partnership: "university-wide" },
      { name: "Georgetown University", city: "Washington, DC", partnership: "university-wide" },
      { name: "New York University", city: "New York", partnership: "faculty-level", faculties: ["BIZ", "Law"] }
    ]
  },
  {
    id: "usa-west",
    name: "USA West Coast",
    region: "us",
    focusLabel: "Pacific campus path",
    latitude: 37.7749,
    longitude: -122.4194,
    accent: "#ffd27a",
    template: "pacific",
    summary: "Large campus ecosystems where distance, car/transit tradeoffs, and rent pressure shape the plan.",
    logisticsAngle: "Compare Bay Area, LA, Seattle, and campus-town options with transport and lease timing.",
    universities: [
      { name: "University of California System-Wide", city: "California", partnership: "university-wide" },
      { name: "University of Southern California", city: "Los Angeles", partnership: "university-wide" },
      { name: "University of Washington, Seattle", city: "Seattle", partnership: "university-wide" },
      { name: "University of Oregon", city: "Eugene", partnership: "university-wide" },
      { name: "Stanford University", city: "Stanford", partnership: "faculty-level", faculties: ["Law"] }
    ]
  },
  {
    id: "canada",
    name: "Canada",
    region: "us",
    focusLabel: "Canada city-campus path",
    latitude: 43.6532,
    longitude: -79.3832,
    accent: "#ff9f9f",
    template: "mountain",
    summary: "A broad North American option where winter, housing, and city choice change the daily plan.",
    logisticsAngle: "Compare Toronto, Vancouver, Montreal, Waterloo, and Calgary with winter-ready packing.",
    universities: [
      { name: "University of Toronto", city: "Toronto", partnership: "university-wide" },
      { name: "University of British Columbia", city: "Vancouver", partnership: "university-wide" },
      { name: "McGill University", city: "Montreal", partnership: "university-wide" },
      { name: "University of Waterloo", city: "Waterloo", partnership: "university-wide" },
      { name: "Queen's University, Kingston", city: "Kingston", partnership: "university-wide" },
      { name: "Western University", city: "London, Ontario", partnership: "university-wide" }
    ]
  },
  {
    id: "mexico",
    name: "Mexico",
    region: "us",
    focusLabel: "Mexico City/Monterrey path",
    latitude: 19.4326,
    longitude: -99.1332,
    accent: "#7ee0a3",
    template: "heritage",
    summary: "A focused Latin America option with Spanish immersion and campus-specific partner constraints.",
    logisticsAngle: "Keep faculty eligibility, neighborhood safety, and daily transport notes explicit.",
    universities: [
      { name: "Tecnologico de Monterrey", city: "Monterrey", partnership: "university-wide" },
      { name: "ITAM", city: "Mexico City", partnership: "faculty-level", faculties: ["BIZ"] }
    ]
  },
  {
    id: "brazil",
    name: "Brazil",
    region: "south-america",
    focusLabel: "Sao Paulo urban path",
    latitude: -23.5505,
    longitude: -46.6333,
    accent: "#8bdd6b",
    template: "metropolis",
    summary: "A high-energy South America route where language, commute, and neighborhood planning are central.",
    logisticsAngle: "Surface Portuguese preparation, transit safety, grocery costs, and urban accommodation tradeoffs.",
    universities: [
      { name: "FGV EAESP", city: "Sao Paulo", partnership: "faculty-level", faculties: ["BIZ"] },
      { name: "Universidade de Sao Paulo", city: "Sao Paulo", partnership: "faculty-level", faculties: ["CDE"] }
    ]
  }
];

export function getCountriesForRegion(region: DestinationRegion) {
  return exchangeCountries.filter((country) => country.region === region);
}

export function getDefaultCountryForRegion(region: DestinationRegion) {
  return getCountriesForRegion(region)[0] ?? exchangeCountries[0];
}

export function getUniversityCoordinates(
  university: ExchangeUniversity,
  country: ExchangeCountry,
  index = 0
) {
  const exact = universityCoordinates[university.name.toLowerCase()];

  if (exact) {
    return exact;
  }

  const base = cityCoordinates[university.city.toLowerCase()] ?? {
    latitude: country.latitude,
    longitude: country.longitude
  };
  const offset = ((index % 5) - 2) * 0.045;

  return {
    latitude: base.latitude + offset * 0.28,
    longitude: base.longitude + offset
  };
}

export function getAllUniversities(): SearchableExchangeUniversity[] {
  return exchangeCountries.flatMap((country) =>
    country.universities.map((university, index) => ({
      ...university,
      country,
      countryId: country.id,
      index
    }))
  );
}

export function getCampusIntelligence(
  country: ExchangeCountry,
  university: ExchangeUniversity
): CampusIntelligence {
  const index = country.universities.findIndex((item) => item.name === university.name);
  const coordinates = getUniversityCoordinates(university, country, Math.max(index, 0));
  const campusQuery = `${university.name} ${university.city} ${country.name}`;
  const encodedCampus = encodeURIComponent(campusQuery);

  return {
    university,
    country,
    coordinates,
    campusQuery,
    mapEmbedUrl: `https://maps.google.com/maps?q=${encodedCampus}&z=17&t=k&output=embed`,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodedCampus}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodedCampus}`,
    radiusUrl: `https://www.google.com/maps/search/${encodeURIComponent(`highly rated food groceries cafe near ${campusQuery}`)}`,
    places: buildCampusPlaces(country, university)
  };
}

function buildCampusPlaces(
  country: ExchangeCountry,
  university: ExchangeUniversity
): CampusPlace[] {
  const campusQuery = `${university.name} ${university.city} ${country.name}`;
  const seeds: Array<{
    category: CampusPlaceCategory;
    title: string;
    description: string;
    radiusMinutes: number;
    reviewSignal: string;
    query: string;
  }> = [
    {
      category: "groceries",
      title: "Groceries within a short walk",
      description: "Open live Maps results for supermarkets, convenience stores, and student-budget grocery runs.",
      radiusMinutes: 10,
      reviewSignal: "Use Maps ratings and opening hours before pinning",
      query: `best groceries near ${campusQuery}`
    },
    {
      category: "food",
      title: "Highly reviewed food nearby",
      description: "Check the closest food clusters with ratings, photos, opening hours, and current crowd signals.",
      radiusMinutes: 10,
      reviewSignal: "Live review check in Google Maps",
      query: `highly rated restaurants near ${campusQuery}`
    },
    {
      category: "study",
      title: "Cafe and study fallback",
      description: "Find cafes and quiet study spots for the first week before campus routines settle.",
      radiusMinutes: 10,
      reviewSignal: "Prioritize review volume and recent photos",
      query: `cafes study spots near ${campusQuery}`
    },
    {
      category: "transit",
      title: "Transit and arrival anchor",
      description: "Inspect nearby stations and arrival paths so housing choices stay commute-aware.",
      radiusMinutes: 12,
      reviewSignal: "Validate route timing in Maps",
      query: `public transport near ${campusQuery}`
    }
  ];

  return seeds.map((place) => ({
    ...place,
    id: `${slugify(campusQuery)}-${place.category}`,
    mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(place.query)}`
  }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
