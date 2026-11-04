import { DocPage } from "@/components/doc-page";
export const metadata = { title: "Risk disclosure — Roth-Feller" };
export default function Page() {
  return <DocPage title="Risk disclosure" lede="Please read this before you trade with real money." sections={[
    ["Trading can lose money", ["Stocks, options, futures, crypto assets and event contracts can fall in value quickly. Leveraged products such as futures and perpetuals can lose more than you deposit. Only trade money you can afford to lose."]],
    ["Software, not advice", ["Roth-Feller is software you direct. It is not a broker, an investment adviser or a commodity trading adviser, and nothing it shows is a recommendation to buy or sell. You decide every strategy and approve every live trade."]],
    ["Past results are not promises", ["Backtests, paper trades and Passport records describe the past. They do not guarantee future results. Backtests can miss costs, gaps and liquidity that real markets impose."]],
    ["Stops are not guarantees", ["A stop becomes a market order when it triggers. In fast or thin markets it can fill well beyond its price. Roth-Feller sizes trades on a stressed stop to allow for this, but losses can still exceed the plan."]],
    ["Availability", ["Some markets and brokers are not available in every country or state. Prediction markets in particular are restricted in many places. You are responsible for following the rules where you live."]],
  ]} />;
}
