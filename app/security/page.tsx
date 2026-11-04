import { DocPage } from "@/components/doc-page";
export const metadata = { title: "Security — Roth-Feller" };
export default function Page() {
  return <DocPage title="Security" lede="How Roth-Feller keeps your accounts and your data safe." sections={[
    ["We never hold your money", ["Your funds stay at your broker, exchange or wallet. Roth-Feller cannot withdraw or transfer them."]],
    ["Trade-only access", ["Brokers that offer OAuth sign-in are connected that way, so we never see your password. Where a broker needs an API key, we ask for a key with trading enabled and withdrawals disabled, and store it encrypted. Only the service that sends your approved ticket can read it."]],
    ["One approval, one send", ["Every live order needs an approved, unexpired ticket. Approval is recorded once, and the order is sent once. Every change of a ticket's status is written to an audit log that cannot be edited."]],
    ["Your data is yours", ["Every row in our database is tied to its owner and protected by row-level security, so one customer can never read another's desk, tickets or connections."]],
    ["Report a problem", ["If you find a security issue, email security@roth-feller.com. We reply within two business days."]],
  ]} />;
}
