# Design System: Atlas Exchange

## 1. Visual Theme & Atmosphere

Atlas Exchange is a cinematic exchange-planning product for students preparing for high-stakes international departure. The interface should feel like a premium travel editorial fused with a practical command center: immersive first, useful immediately after. Density is Daily App Balanced, variance is Offset Asymmetric, and motion is Cinematic Choreography used only for storytelling and state transitions.

Design read: premium travel-planning web app for exchange students, with a destination-first visual language, leaning toward native CSS, Next.js, Three.js, Motion, and GSAP.

Dial settings:
- DESIGN_VARIANCE: 8
- MOTION_INTENSITY: 7
- VISUAL_DENSITY: 5

## 2. Color Palette & Roles

- Deep Ink (#081111) - Primary dark canvas and hero wash
- Charcoal Glass (#101A1B) - Elevated panels and destination overlays
- Mist White (#F4F7F5) - Primary light text on dark surfaces
- Silver Blue (#AFC7D1) - Secondary text and metadata
- Cloud Line (rgba(244, 247, 245, 0.18)) - Hairlines and panel borders
- Atlas Cyan (#37B7C8) - Single accent for active states, CTAs, progress, and focus rings

Rules:
- No pure black.
- No purple or blue neon gradient aesthetic.
- One accent only: Atlas Cyan.
- Dark theme is the primary product theme for the demo.

## 3. Typography Rules

- Display: Geist Sans or Satoshi-style sans, tight tracking, high confidence, no Inter default.
- Body: Geist Sans, relaxed leading, 65ch maximum line length.
- Mono: Geist Mono for costs, dates, source timestamps, and API/debug states.
- Hero headline must fit within two lines on desktop.
- Do not use generic serif fonts.

## 4. Component Stylings

- Navigation: one-line glass bar, 64-72px tall, no decorative status dots.
- Buttons: pill buttons with strong contrast, tactile active state, no glow.
- Cards: 8px to 16px radius depending on surface type. Listing cards use restrained 12px corners.
- Inputs: visible labels above fields, clear focus state in Atlas Cyan, inline helper/error text.
- Listing cards: source badge, last fetched time, fit score, cost, commute, and direct external link.
- Agent panel: structured recommendations first, chat-like follow-up second.
- Loading states: skeleton rows shaped like final content, no circular spinners.
- Empty states: explain what input is missing and how to recover.
- Error states: name the failed provider and keep cached/seeded fallback visible.

## 5. Layout Principles

- First viewport: cinematic London hero with university signal visible immediately.
- Second chapter: region map/globe leading into partner university selection.
- Dashboard: tabs for Overview, Accommodation, Budget, Packing, Deadlines, Local Life.
- No three equal feature-card rows.
- Use CSS Grid for dashboard and bento layouts.
- Mobile collapses to one column below 768px.
- All fixed-format controls use stable dimensions to prevent layout shift.

## 6. Motion & Interaction

- 3D globe/region scene uses Three.js in a client-only island.
- GSAP is reserved for scroll chapters and pinned destination reveals.
- Motion is used for lighter component transitions and hover feedback.
- Reduced motion collapses 3D and scroll choreography into static sections.
- No `window.addEventListener("scroll")` for animation. Use GSAP ScrollTrigger, Motion hooks, or IntersectionObserver.

## 7. Content Voice

Atlas Exchange speaks like a calm, competent travel operator. It does not overpromise. It names uncertainty, cites sources, and gives the student a next action.

Preferred phrases:
- "Ranked by budget, commute, and deadline risk"
- "Live source checked"
- "Fallback estimate"
- "Ready for departure"

Banned phrases:
- Seamless
- Unleash
- Next-gen
- Revolutionize
- AI-powered journey

## 8. Product Rules

- London is the golden demo path.
- Other regions appear as credible expansion paths, not equally deep flows yet.
- Live search results are accepted as external links with citations. Full scraping is not required for hackathon readiness.
- Mockable LLM output is required until API credits are available.
- Every live result must carry source, URL, fetched timestamp, and confidence.
- Every recommendation must explain why it was ranked.

## 9. Anti-Patterns

- No emojis anywhere.
- No em dashes in visible product copy.
- No fake perfect metrics.
- No decorative dots.
- No section-number labels.
- No fake Airbnb or Agoda cards pretending to be live.
- No hidden agent retries that rewrite outputs without surfacing source/fallback state.
- No chatbot-only first screen.
- No pure text landing page.
