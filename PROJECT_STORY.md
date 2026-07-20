# Atlas Exchange

## Inspiration

Planning an exchange semester should feel exciting. In practice, it is often a fragmented research project: students move between partner-university lists, accommodation websites, Google Maps, visa pages, NUSMods, spreadsheets, and advice from seniors just to answer one question: *would this destination actually work for me?*

That gap inspired Atlas Exchange. A partner-university list tells a student where they are allowed to go, but it does not tell them what it would be like to live there for four or five months. Students still need to understand the campus, cost pressures, housing options, local transport, groceries, packing needs, deadlines, and academic context before they can make a confident choice.

We wanted to turn exchange planning from a collection of browser tabs into a journey that begins with possibility and ends with preparedness.

> An exchange is not just a university placement. It is a temporary life in another part of the world.

The planning challenge can be described as:

$$
\text{Exchange Readiness} =
\text{Academic Fit} +
\text{Financial Clarity} +
\text{Local Confidence} +
\text{Logistics Preparedness}
$$

Atlas Exchange is built to make these parts visible together.

## What it does

Atlas Exchange is an interactive exchange-planning web app for university students. It helps them explore partner universities, choose a destination, and build a practical plan around that specific university and city.

The experience starts with a cinematic world-to-campus journey. Students scroll from an Earth-scale view of exchange possibilities into university HUD cards, campus imagery, and a 3D orbit of partner-campus options. From there, they can search by university, city, country, or partnership route and select a campus to enter the planning experience.

Once a university is selected, Atlas Exchange keeps the selected university, city, country, and partnership route synchronized throughout the planner. The plan includes:

- **University discovery:** partner-campus imagery, destination browsing, faculty-route context, and searchable university cards.
- **Accommodation discovery:** university-housing and external search pathways that point students to current listings instead of pretending static prices are guaranteed.
- **Budget planning:** a clear way to frame monthly budget, stay length, housing preference, and trade-offs.
- **Local life:** destination-linked paths for food, groceries, cafes, study spaces, transit, essential services, and activities around a campus.
- **Academic preparation:** live NUSMods lookup support and partnership-route context.
- **Logistics:** packing, deadlines, visa guidance, and practical preparation prompts.
- **Questions and reports:** a source-aware Q&A flow and a downloadable PDF plan that students can keep or share with their families.

The app is intentionally careful about uncertainty. Accommodation availability, prices, visa outcomes, commute conditions, and deadlines can change. Atlas Exchange links students to the right live or official sources rather than displaying invented precision as fact.

## How we built it

We built Atlas Exchange as a full-stack **Next.js** application with **React** and **TypeScript**.

The visual experience uses **Three.js** and **WebGL** for the cinematic Earth environment, and **Framer Motion** for scroll-driven transitions, campus HUD cards, and the 3D partner-campus orbit. We used responsive CSS to ensure that the experience stays expansive on desktop while remaining readable and usable on mobile. **Remotion** supports our motion and demo-video workflow.

The visual journey is deliberate:

$$
\text{World} \rightarrow \text{Campus Options} \rightarrow \text{Selected University} \rightarrow \text{Exchange Plan}
$$

This follows a student's actual decision process: first imagine the possibility, then compare choices, then choose a destination, then prepare for departure.

Behind the interface, we built structured destination and university data. Each record carries information such as the university name, city, country, partnership route, campus image, and destination-specific planning context. This is important because a personalised plan becomes unhelpful immediately if its location is wrong.

We also built API routes for plan generation, NUSMods lookup, accommodation discovery, Q&A, PDF report export, and service-status checks. The app integrates Google Maps previews and destination-linked exploration paths to help students see where a campus sits in its city.

For reliability and security, we added:

- Zod validation for incoming data.
- Rate limiting to reduce API abuse.
- Caching for common requests.
- Bounded JSON request handling.
- Content Security Policy and strict origin protections.
- Safe fallback behaviour for unsupported questions.
- Validation before a PDF report is generated.

We treated trust as a feature, not a polish pass. When the system cannot verify something, it should say so or send the student to the right source.

## Challenges we ran into

### Keeping every selection accurate

The largest engineering challenge was state synchronization. A university selection affects the city, country, accommodation links, local-life searches, maps, planning copy, faculty route, and report output. Early prototype failure cases made the risk very clear: a Stanford selection could produce London-specific information, an Oxford selection could fall back to University College London, or an intake title could remain unchanged after the student selected another country.

We addressed this by making destination validation part of the core data model. The system rejects contradictory university-country selections instead of silently guessing, and we added regression tests around destination integrity.

### Working with live and changing information

Exchange planning depends on information that is not permanently stable. Housing listings disappear, prices change, visa requirements are individual, official deadlines move, and local recommendations can become stale. A visually impressive dashboard with hardcoded prices or commute times would be worse than no dashboard at all because it could cause students to make expensive decisions based on false confidence.

Our solution was to separate verified context from live discovery. Atlas Exchange can provide the selected destination, relevant search routes, official-source paths, and planning prompts, while leaving volatile information connected to the platforms that maintain it.

### Finding campus images that actually mean something

Generic travel photos do not communicate university identity. We wanted students to see the architecture, setting, student environment, and city context of the specific institution they were considering. This meant assembling and validating a local image set for the universities represented in the experience, while avoiding unrelated landmarks, brand assets, or similarly named institutions.

### Making the cinematic experience useful, not distracting

The project includes 3D visuals, scrolling motion, campus HUDs, and image-heavy cards. The challenge was not just making them look impressive. We had to ensure that the motion helped users understand the journey and did not interfere with readability, performance, or mobile use.

We refined the sequence so the animated campus options form a half-wheel orbit before the planning interface. The movement has a purpose: it communicates that students have a range of real exchange possibilities before they commit to one.

## Accomplishments that we're proud of

- We built an exchange experience that moves beyond a static university directory and gives students a way to picture their future day-to-day life abroad.
- We created a cinematic world-to-campus visual journey, including a responsive 3D partner-campus orbit with real campus imagery.
- We structured the platform around destination-specific planning rather than generic travel advice.
- We supported partner universities across multiple regions, including Asia, Europe, the United Kingdom, North America, Australia, and South America.
- We integrated live NUSMods lookup into the broader exchange-planning workflow.
- We built a downloadable PDF report so a plan can move beyond the browser and be used as a preparation artifact.
- We added source-aware Q&A behaviour, caching, rate limiting, validation, and security headers rather than treating a prototype as an excuse to ignore reliability.
- We wrote regression tests for the failure modes that matter most: incorrect destination fallbacks, contradictory selections, invented planning data, unsafe input handling, rate-limit behaviour, and asset validity.

We are especially proud that the project is not merely designed to look personalised. Its logic is designed to preserve the selected university and destination across the planning flow.

## What we learned

### Trust beats false precision

We learned that a planning app must earn trust. It is tempting to show precise-looking accommodation prices, commute times, deadlines, and recommendation scores because they make a dashboard look complete. However, if those values are stale, hardcoded, or unrelated to the selected campus, they create risk rather than clarity.

The important distinction is:

$$
\text{Useful guidance} \neq \text{confident-looking information}
$$

Useful guidance is contextual, source-aware, and honest about uncertainty.

### Personalisation is a systems problem

Personalisation is not just changing a heading from "London" to "Tokyo." It means every downstream component must respect the selected institution: university card, map, local-life exploration, accommodation pathway, planning copy, packing context, and exported report.

This taught us to treat data relationships and validation as central product work, not background implementation detail.

### Immersive design needs a clear job

We learned that 3D and motion are most effective when they answer a user question. In Atlas Exchange, the visuals are intended to answer:

- Where can I go?
- What are my real options?
- What does this campus feel like?
- What do I need to prepare before I leave?

If motion does not improve orientation, comparison, or confidence, it is decoration. We kept refining the visual system until it supported the actual planning workflow.

### Live integrations need graceful failure modes

Live APIs and external sources add value, but they can fail, rate-limit requests, or return incomplete data. We learned to plan for those realities through caching, validation, explicit fallback states, and clear links to the authoritative source.

## What's next for Atlas Exchange

Atlas Exchange is a strong prototype, but its next stage should deepen the practical planning layer without weakening its trust model.

The most valuable next steps are:

- Add more verified accommodation and university-housing integrations.
- Integrate official visa and university-deadline sources with clear freshness indicators.
- Add destination and semester-aware weather information for packing recommendations.
- Develop reviewed module-mapping workflows with academic coordinators rather than presenting speculative equivalencies as final.
- Let students save profiles, compare destinations, and return to an evolving plan.
- Expand map-based local life around each campus with source-linked places, ratings, and travel radius context.
- Add AI-assisted planning summaries only when they are grounded in selected destination data and official or traceable sources.
- Build collaboration features so students and parents can review the same plan together.

Our longer-term goal is to take a student from:

$$
\text{“Where should I go?”}
$$

to:

$$
\text{“I understand what life there could look like, what I need to prepare, and what I should do next.”}
$$

Atlas Exchange is not meant to replace university exchange offices, immigration authorities, or student judgment. It is meant to connect the fragmented research process into one clearer, more human planning experience.
