// One source of truth for membership tiers. Stripe prices are found by lookup key
// (`rf_<plan>_<interval>`), so price IDs never live in code.
export type PlanId = "free" | "basic" | "advanced" | "pro" | "max" | "ultra";
export type Interval = "month" | "year";

export type Plan = { id: PlanId; name: string; m: number; y: number; desc: string };

export const planGroups: { group: string; items: Plan[] }[] = [
  { group: "Starting out", items: [
    { id: "free", name: "Research", m: 0, y: 0, desc: "Market briefs, a paper desk and three backtests a month." },
    { id: "basic", name: "Basic", m: 29, y: 290, desc: "One live broker, the Desk Lead and Risk Manager, 25 backtests." },
    { id: "advanced", name: "Advanced", m: 79, y: 790, desc: "Three brokers, the full seven-role desk, approve by text, Guardian." },
  ] },
  { group: "Serious capital", items: [
    { id: "pro", name: "Pro", m: 199, y: 1990, desc: "Every broker, Autopilot for graduated strategies, Odds Lens, API." },
    { id: "max", name: "Max", m: 499, y: 4990, desc: "Several desks, a public Passport, selling strategies to followers." },
    { id: "ultra", name: "Ultra", m: 1499, y: 14990, desc: "Seats for a team, audit exports, dedicated engines, a person to call." },
  ] },
];

export const paidPlans = planGroups.flatMap((g) => g.items).filter((p) => p.m > 0);

export const lookupKey = (plan: PlanId, interval: Interval) => `rf_${plan}_${interval}`;

export function parseLookupKey(key: string | null | undefined): { plan: PlanId; interval: Interval } | null {
  const m = /^rf_(basic|advanced|pro|max|ultra)_(month|year)$/.exec(key ?? "");
  return m ? { plan: m[1] as PlanId, interval: m[2] as Interval } : null;
}
