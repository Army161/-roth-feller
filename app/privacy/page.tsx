import { DocPage } from "@/components/doc-page";
export const metadata = { title: "Privacy — Roth-Feller" };
export default function Page() {
  return <DocPage title="Privacy" lede="What we collect, why, and what you control. Draft for legal review before launch." sections={[
    ["What we collect", ["Your account details (name, email, sign-in provider), your desk settings and risk limits, your tickets and their audit log, and the connections you add. Payments are handled by Stripe; we never see your full card number."]],
    ["What we do not do", ["We do not sell your data. We do not use your trades to trade for ourselves."]],
    ["AI processing", ["To brief you and size tickets, your desk sends the relevant market data and your instructions to our AI provider. Broker keys and passwords are never sent."]],
    ["Your controls", ["You can export your history or delete your account from settings. Deleting your account removes your desks, tickets and stored keys."]],
  ]} />;
}
