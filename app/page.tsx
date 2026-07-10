import { AtlasShell } from "@/components/AtlasShell";
import { buildLondonPlanResponse } from "@/lib/plan-engine";

export default function Home() {
  const initialResponse = buildLondonPlanResponse({
    monthlyBudgetSgd: 2300,
    stayLengthMonths: 4,
    housingPreference: "shared",
    travelStyle: "balanced",
    plannedActivities: ["museums", "football", "weekend rail trips"],
    dietaryNeeds: []
  });

  return (
    <AtlasShell
      initialPlan={initialResponse.plan}
      initialProviderStatus={initialResponse.providerStatus}
    />
  );
}
