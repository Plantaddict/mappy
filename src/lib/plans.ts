export type PlanId = "starter" | "pro" | "business";

export const PLANS: Record<PlanId, { name: string; priceMonthly: number; approvalsPerMonth: number | null; features: string[] }> = {
  starter: {
    name: "Starter",
    priceMonthly: 29,
    approvalsPerMonth: 50,
    features: ["Branded designer page", "3 product types", "50 approved designs / month", "Email + dashboard delivery", "Map packs at list price"],
  },
  pro: {
    name: "Pro",
    priceMonthly: 79,
    approvalsPerMonth: 300,
    features: ["Everything in Starter", "All product types and themes", "300 approved designs / month", "Webhooks + print-on-demand push", "Mockup generator", "Custom domain"],
  },
  business: {
    name: "Business",
    priceMonthly: 199,
    approvalsPerMonth: null,
    features: ["Everything in Pro", "Unlimited approvals", "API access", "All map packs included", "Team seats", "Priority support"],
  },
};

export function planFor(id: string) {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "starter"];
}
