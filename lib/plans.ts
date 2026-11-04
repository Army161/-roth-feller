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

// Stripe Payment Links (test mode, Jeremy Gephart sandbox). Public URLs, safe in code.
// The site appends client_reference_id=<user id> so the webhook can match the buyer.
export const paymentLinks: Record<string, string> = {
  rf_basic_month: "https://buy.stripe.com/test_5kQaEYdrD2Ob0vSdh65Vu00",
  rf_basic_year: "https://buy.stripe.com/test_aFa14o5ZbewT92o90Q5Vu01",
  rf_advanced_month: "https://buy.stripe.com/test_3cI5kEfzL88vfqMdh65Vu02",
  rf_advanced_year: "https://buy.stripe.com/test_aFa3cwcnzewT4M82Cs5Vu03",
  rf_pro_month: "https://buy.stripe.com/test_14A14o0ER74rbawela5Vu04",
  rf_pro_year: "https://buy.stripe.com/test_7sY00kevHewT92o2Cs5Vu05",
  rf_max_month: "https://buy.stripe.com/test_00w5kEfzLbkH7Yka4U5Vu06",
  rf_max_year: "https://buy.stripe.com/test_6oU14ocnzbkH92o4KA5Vu07",
  rf_ultra_month: "https://buy.stripe.com/test_9B67sMevH74r1zWdh65Vu08",
  rf_ultra_year: "https://buy.stripe.com/test_cNi6oI2MZcoL1zW5OE5Vu09",
};

// Stripe-hosted customer portal: change plan, update card, cancel.
export const billingPortalUrl = "https://billing.stripe.com/p/login/test_5kQaEYdrD2Ob0vSdh65Vu00";
