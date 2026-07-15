import { z } from "zod";

export type CulturalGuidance = {
  destinationCity: string;
  destinationCountry: string;
  reviewStatus: "reviewed" | "needs-review";
  etiquetteTips: string[];
  foodNotes: string[];
  transportNotes: string[];
  paymentNotes: string[];
  source?: {
    title: string;
    url: string;
  };
  notices: string[];
};

type ReviewedGuidance = Omit<
  CulturalGuidance,
  "destinationCity" | "destinationCountry" | "reviewStatus" | "notices"
>;

const destinationSchema = z.object({
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(2).max(120)
});

const reviewedGuidance: Readonly<Record<string, ReviewedGuidance>> = Object.freeze({
  "united kingdom|london": {
    etiquetteTips: [
      "Queue in arrival order and keep escalator standing lanes clear.",
      "Keep conversation volume restrained on public transport."
    ],
    foodNotes: ["Check dietary labels and ask venues directly when allergen handling matters."],
    transportNotes: ["Check current fares and service changes with Transport for London."],
    paymentNotes: ["Contactless payment is common, but keep a backup payment method."],
    source: {
      title: "Visit London traveller information",
      url: "https://www.visitlondon.com/traveller-information"
    }
  },
  "france|paris": {
    etiquetteTips: [
      "Begin service interactions with a greeting before making a request.",
      "Keep voices moderate in residential buildings and on public transport."
    ],
    foodNotes: ["Confirm opening hours because meal service windows vary by venue."],
    transportNotes: ["Check current routes and ticket rules before relying on a saved itinerary."],
    paymentNotes: ["Cards are common, but carry a small backup payment option."],
    source: {
      title: "Paris je t'aime practical information",
      url: "https://parisjetaime.com/eng/practical-paris"
    }
  },
  "france|lyon": {
    etiquetteTips: ["Use a greeting before asking for help in shops, offices, or restaurants."],
    foodNotes: ["Review menus and allergen information directly with each venue."],
    transportNotes: ["Check TCL for current metro, tram, bus, and ticket information."],
    paymentNotes: ["Keep a second payment method for small venues or service disruption."],
    source: {
      title: "ONLYLYON practical information",
      url: "https://en.visiterlyon.com/practical-lyon"
    }
  },
  "japan|tokyo": {
    etiquetteTips: [
      "Queue at marked platform positions and allow passengers to exit first.",
      "Keep phone calls off crowded trains and follow venue-specific rules."
    ],
    foodNotes: ["Ask directly about ingredients when dietary restrictions are safety-critical."],
    transportNotes: ["Check the operator and last-train time for each route."],
    paymentNotes: ["Carry a backup payment method because acceptance varies by venue."],
    source: {
      title: "GO TOKYO planning guide",
      url: "https://www.gotokyo.org/en/plan/"
    }
  },
  "south korea|seoul": {
    etiquetteTips: [
      "Follow local queueing and priority-seat signage on public transport.",
      "Use respectful forms of address until invited to be informal."
    ],
    foodNotes: ["Confirm ingredients directly when allergies or dietary rules are strict."],
    transportNotes: ["Check Seoul's current public-transport guidance and late-night options."],
    paymentNotes: ["Keep a backup card or cash option for payment-system gaps."],
    source: {
      title: "Seoul Metropolitan Government living information",
      url: "https://english.seoul.go.kr/service/living/"
    }
  },
  "australia|sydney": {
    etiquetteTips: [
      "Follow signed shared-space, beach, and public-transport rules.",
      "Respect queues and accessibility priority areas."
    ],
    foodNotes: ["Ask venues about allergen procedures rather than relying on menu shorthand."],
    transportNotes: ["Check Transport for NSW for current fares, disruptions, and tap rules."],
    paymentNotes: ["Contactless payment is common; keep a fallback for outages."],
    source: {
      title: "City of Sydney guides",
      url: "https://www.cityofsydney.nsw.gov.au/guides"
    }
  }
});

export function getCulturalGuidance(input: unknown): CulturalGuidance {
  const destination = destinationSchema.parse(input);
  const key = `${normalize(destination.country)}|${normalize(destination.city)}`;
  const reviewed = reviewedGuidance[key];

  if (!reviewed) {
    return {
      destinationCity: destination.city,
      destinationCountry: destination.country,
      reviewStatus: "needs-review",
      etiquetteTips: [],
      foodNotes: [],
      transportNotes: [],
      paymentNotes: [],
      notices: [
        `Cultural guidance for ${destination.city}, ${destination.country} has not been reviewed.`,
        "Do not substitute guidance from another destination."
      ]
    };
  }

  return {
    destinationCity: destination.city,
    destinationCountry: destination.country,
    reviewStatus: "reviewed",
    ...reviewed,
    notices: ["Review current local and university guidance before departure."]
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
