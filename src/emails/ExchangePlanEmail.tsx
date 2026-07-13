import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text
} from "react-email";
import type { ExchangePlan } from "@/lib/schema";

export function ExchangePlanEmail({ plan }: { plan: ExchangePlan }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{plan.partnerUniversity.name} exchange plan</Preview>
      <Body style={{ backgroundColor: "#f2f6f5", fontFamily: "Arial, sans-serif", padding: "28px 12px" }}>
        <Container style={{ backgroundColor: "#ffffff", border: "1px solid #d9e3e2", padding: "28px", maxWidth: "620px" }}>
          <Text style={{ color: "#14899a", fontSize: "12px", fontWeight: 700 }}>ATLAS EXCHANGE</Text>
          <Heading style={{ color: "#142021", fontSize: "28px", margin: "8px 0" }}>
            {plan.partnerUniversity.name}
          </Heading>
          <Text style={{ color: "#536567", lineHeight: "1.5" }}>
            Your exchange report for {plan.profile.destinationCity}, {plan.profile.destinationCountry} is attached as a PDF.
          </Text>
          <Section style={{ backgroundColor: "#eef8f8", padding: "16px", margin: "20px 0" }}>
            <Text style={{ margin: 0, color: "#142021" }}>
              Monthly budget: SGD {plan.profile.monthlyBudgetSgd.toLocaleString()}
            </Text>
            <Text style={{ margin: "8px 0 0", color: "#536567" }}>
              {plan.budget.notes[0]}
            </Text>
          </Section>
          <Button href={plan.accommodation.rankedOptions[0]?.url ?? "https://www.google.com/maps"} style={{ backgroundColor: "#16899a", color: "#ffffff", padding: "12px 18px", textDecoration: "none" }}>
            Check accommodation source
          </Button>
          <Hr style={{ borderColor: "#d9e3e2", margin: "24px 0" }} />
          <Text style={{ color: "#6c7d7f", fontSize: "12px", lineHeight: "1.5" }}>
            Verify live prices, availability, visa rules, and official deadlines before booking or departure.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
