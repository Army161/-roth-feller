import Link from "next/link";
import { CommandList, HeroTickets, PriceMenu, Reveal, TicketWriter, VenueBoard } from "@/components/landing";

const faqs = [
  ["Do you ever hold my money?", "No. Your money stays at your own broker or in your own wallet. Roth-Feller connects with trade-only access: it can place an order you approved, and it can never withdraw."],
  ["Can it trade without me?", "Not by default. Every live trade waits for your approval and expires if you don't answer. Autopilot exists only for strategies that have graduated from paper and shadow trading, and only inside limits you write."], // taste-skill-ignore: "shadow trading" is a product stage, not a CSS shadow
  ["Is this financial advice?", "No. Roth-Feller is software you direct. It researches, sizes and records the trades you choose, and it shows its working, but the decision and the account are always yours."],
  ["What if the AI is wrong?", "The Risk Manager can refuse a ticket, every entry leaves with its stop, and Guardian enforces your daily loss limit across all accounts. The Trade Reviewer grades the process and the outcome separately so mistakes get fixed."],
  ["Which markets can I trade?", "Crypto spot and perpetuals, DeFi swaps, US stocks and options, futures, and prediction markets such as Kalshi and Polymarket, through the brokers and exchanges listed above."],
  ["Can I cancel at any time?", "Yes, in two clicks from billing settings. Your desk drops to the free Research plan and keeps its history."],
];

export default function Home() {
  return (
    <main className="no-js">
      <Reveal />
      <header className="nav">
        <Link href="/" className="mark" >Roth-Feller</Link>
        <nav className="links" aria-label="Main">
          <a className="link" href="#how">How it works</a>
          <a className="link" href="#pricing">Pricing</a>
          <Link className="link" href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="hero" aria-labelledby="title">
        <HeroTickets />
        <h1 id="title">
          <span className="wordmark">Roth-Feller</span>
          <span className="lede">A private trading firm, staffed by AI.</span>
        </h1>
        <div className="hero-row">
          <span>Seven desk roles</span>
          <Link className="btn" href="/login?mode=signup">Start free — $0</Link>
          <span>You approve every trade</span>
        </div>
      </section>

      <section className="section" id="how" aria-labelledby="how-title">
        <div className="steps">
          <div className="steps-col">
            <h2 id="how-title">How a trade happens</h2>
            <div className="exchange reveal">
              <p>First, tell your desk the trade.</p>
              <TicketWriter />
            </div>
            <div className="exchange reveal">
              <p>Then approve it, wherever you are.</p>
              <div className="call" data-ui>
                <label htmlFor="tg">Telegram · your desk</label>
                <input id="tg" readOnly value="approve RF-20261104-01" />
              </div>
              <div className="response num" data-ui>
                <p className="r-title">Execution Trader</p>
                <pre>{`Sent once: buy 0.4827 ETH limit 3,000.00 with stop 2,900.00.
Filled 0.4827 @ 3,000.00. Stop resting. Reconciled with the exchange.`}</pre>
              </div>
            </div>
          </div>
          <div className="exchange reveal">
            <p>Finally, it goes on your record.</p>
            <div className="response wide" data-ui>
              <p className="r-title">Trade Reviewer · Passport, sample desk</p>
              <div className="passport num">
                <div><b>A</b><span>Process grade</span></div>
                <div><b>+1.8R</b><span>Outcome</span></div>
                <div><b>42</b><span>Trades reconciled</span></div>
                <div><b>0</b><span>Sent without approval</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="board" aria-labelledby="board-title">
        <h2 id="board-title">Where your desk trades</h2>
        <VenueBoard />
      </section>

      <section className="section reveal" aria-labelledby="cmd-title">
        <h2 id="cmd-title" className="visually-hidden">What your desk can do</h2>
        <CommandList />
      </section>

      <section className="section statement grid reveal" aria-labelledby="facts-title">
        <h2 id="facts-title" className="visually-hidden">The desk in numbers</h2>
        <p>
          <strong>Seven</strong>&nbsp;roles check every trade across <strong>20+</strong>&nbsp;venues, reply in{" "}
          <strong>21</strong>&nbsp;chat apps, and send <strong>0</strong>&nbsp;orders you did not approve.
        </p>
      </section>

      <section className="section grid menu reveal" id="pricing" aria-labelledby="pricing-title">
        <h2 id="pricing-title">Membership</h2>
        <PriceMenu />
        <p className="note">Cards, Apple Pay and Google Pay. Change plan or cancel whenever you like.</p>
      </section>

      <section className="section faq-field" aria-labelledby="faq-title">
        <div className="faq-row">
          <h2 id="faq-title">Fair questions</h2>
        </div>
        {faqs.map(([q, a]) => (
          <div className="faq-row reveal" key={q}>
            <h3>{q}</h3>
            <p>{a}</p>
          </div>
        ))}
      </section>

      <section className="cta reveal" aria-labelledby="cta-title">
        <h2 id="cta-title" className="visually-hidden">Start</h2>
        <p>Meet your desk today. It starts on paper, with no keys and no card.</p>
        <Link className="btn" href="/login?mode=signup">Start free</Link>
      </section>

      <footer>
        <div className="foot">
          <span>Roth-Feller, a private AI trading firm</span>
          <nav aria-label="Footer">
            <a href="#pricing">Pricing</a>
            <Link href="/docs">Docs</Link>
            <Link href="/security">Security</Link>
            <Link href="/risk">Risk disclosure</Link>
          </nav>
          <span className="right">© 2026 · <Link href="/privacy">Privacy</Link></span>
        </div>
        <p className="disclosure">
          Trading involves risk of loss, including more than your deposit on leveraged products. Roth-Feller is software, not a
          broker or investment adviser, and never holds client funds. Sample tickets and the sample Passport on this page are
          illustrations, not results.
        </p>
      </footer>
    </main>
  );
}
