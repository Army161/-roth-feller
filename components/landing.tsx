"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sampleTickets, venues, type SampleTicket } from "@/lib/samples";
import { sizeTicket, TicketError } from "@/lib/ticket";

function TicketCard({ t, hidden }: { t: SampleTicket; hidden: boolean }) {
  return (
    <article className="ticket" data-ui aria-hidden={hidden} aria-label={`Ticket ${t.id}, ${t.market}`}>
      <div className="t-head num">
        <span>{t.id}</span>
        <span>
          {t.venue} · {t.mode}
        </span>
      </div>
      <div className="t-market">{t.market}</div>
      <span>
        <span className="chip good">Risk PASS</span>
      </span>
      <ul className="t-evidence">
        {t.evidence.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <dl className="num">
        {t.rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="t-foot num">
        <span>Expires in 15 min</span>
        <strong>{t.approve}</strong>
      </div>
    </article>
  );
}

// Signature move: the lit ticket slowly crossfades through four markets.
export function HeroTickets() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const tick = () => {
      if (!document.hidden) setI((n) => (n + 1) % sampleTickets.length);
    };
    timer = window.setInterval(tick, 5600);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="hero-object">
      {sampleTickets.map((t, n) => (
        <TicketCard key={t.id} t={t} hidden={n !== i} />
      ))}
    </div>
  );
}

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// The live thing: type a trade, watch the Risk Manager size it.
export function TicketWriter() {
  const [equity, setEquity] = useState("10200");
  const [risk, setRisk] = useState("0.5");
  const [entry, setEntry] = useState("3000");
  const [stop, setStop] = useState("2900");

  const result = useMemo(() => {
    try {
      const t = sizeTicket({ equity: +equity, riskPct: +risk, entry: +entry, stop: +stop });
      return { t };
    } catch (e) {
      return { error: e instanceof TicketError ? e.message : "check the numbers" };
    }
  }, [equity, risk, entry, stop]);

  const field = (label: string, value: string, set: (v: string) => void, id: string) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <>
      <div className="call" data-ui>
        <div className="fields num">
          {field("Account ($)", equity, setEquity, "tw-equity")}
          {field("Risk (%)", risk, setRisk, "tw-risk")}
          {field("Entry", entry, setEntry, "tw-entry")}
          {field("Stop", stop, setStop, "tw-stop")}
        </div>
      </div>
      <div className="response" data-ui aria-live="polite">
        <p className="r-title">Risk Manager</p>
        {"t" in result && result.t ? (
          <pre className="num">
            {`${result.t.side === "buy" ? "Long" : "Short"} ${result.t.size.toFixed(4)} units, about ${money(result.t.notional)}
Risk ${money(result.t.riskUsd)}, sized on a stressed stop of ${result.t.stressedDistance.toFixed(2)}
(${result.t.drawnDistance.toFixed(2)} drawn + ${result.t.slip.toFixed(2)} slippage + ${result.t.feesPerUnit.toFixed(2)} fees)
Risk PASS. Ticket ready for your approval.`}
          </pre>
        ) : (
          <pre className="err">Risk REJECT: {result.error}.</pre>
        )}
      </div>
    </>
  );
}

export function VenueBoard() {
  const [open, setOpen] = useState(3);
  return (
    <div className="board-rows reveal-rows" data-ui>
      {venues.map((v, n) => (
        <button
          key={v.name}
          type="button"
          className="board-row"
          style={{ ["--i" as string]: n } as React.CSSProperties}
          aria-expanded={open === n}
          onClick={() => setOpen(n)}
        >
          <span>{v.name}</span>
          <span className="facts">{v.market}</span>
          <span className="facts">{v.connect}</span>
          <span className="facts">{v.practice}</span>
          <span className="status">{v.status}</span>
          {open === n && <span className="detail">{v.detail}</span>}
        </button>
      ))}
    </div>
  );
}

const commands = [
  { name: "Brief me on a market", keys: "B", say: "Price, funding, depth and news, each with its source and the time it was read." },
  { name: "Write a ticket", keys: "T", say: "Your idea becomes an exact, sized order with the stop already attached." },
  { name: "Backtest my idea", keys: "K", say: "Plain English becomes rules, then years of real history. Missing data stays visible, never filled in." },
  { name: "Approve from my phone", keys: "A", say: "Reply to your desk in Telegram, WhatsApp or iMessage. One word sends it, once." },
  { name: "Watch all my accounts", keys: "G", say: "Guardian holds the limits you wrote across every broker, manual trades included." },
  { name: "Compare the odds", keys: "O", say: "Odds Lens: what prediction markets say next to what options markets imply." },
  { name: "Publish my Passport", keys: "P", say: "A public record, checked against your broker's own statements, that you can share in one link." },
  { name: "Graduate a strategy", keys: "L", say: "Backtest, paper, shadow, then live with a capital ramp. No strategy skips a step." },
];

export function CommandList() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = commands.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const current = Math.min(sel, Math.max(shown.length - 1, 0));

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
  };

  return (
    <div className="commands" data-ui onKeyDown={onKey}>
      <label htmlFor="cmd" className="visually-hidden">Search what your desk can do</label>
      <input
        id="cmd"
        className="search"
        placeholder="Ask your desk"
        value={q}
        onChange={(e) => { setQ(e.target.value); setSel(0); }}
        role="combobox"
        aria-expanded="true"
        aria-controls="cmd-list"
      />
      <ul id="cmd-list" role="listbox" ref={listRef} aria-label="Desk commands">
        {shown.map((c, n) => (
          <li key={c.name}>
            <button
              type="button"
              role="option"
              aria-selected={n === current}
              onMouseEnter={() => setSel(n)}
              onFocus={() => setSel(n)}
              onClick={() => setSel(n)}
            >
              <span>{c.name}</span>
              <span className="keys" aria-hidden="true">
                <kbd>⌘</kbd>
                <kbd>{c.keys}</kbd>
              </span>
            </button>
            {n === current && <p className="say">{c.say}</p>}
          </li>
        ))}
        {shown.length === 0 && <li><p className="say">Nothing by that name yet. Try “ticket” or “odds”.</p></li>}
      </ul>
    </div>
  );
}

const plans = [
  { group: "Starting out", items: [
    { name: "Research", m: 0, y: 0, desc: "Market briefs, a paper desk and three backtests a month." },
    { name: "Basic", m: 29, y: 290, desc: "One live broker, the Desk Lead and Risk Manager, 25 backtests." },
    { name: "Advanced", m: 79, y: 790, desc: "Three brokers, the full seven-role desk, approve by text, Guardian." },
  ] },
  { group: "Serious capital", items: [
    { name: "Pro", m: 199, y: 1990, desc: "Every broker, Autopilot for graduated strategies, Odds Lens, API." },
    { name: "Max", m: 499, y: 4990, desc: "Several desks, a public Passport, selling strategies to followers." },
    { name: "Ultra", m: 1499, y: 14990, desc: "Seats for a team, audit exports, dedicated engines, a person to call." },
  ] },
];

export function PriceMenu() {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="lists">
      <div style={{ gridColumn: "1 / -1" }}>
        <div className="interval" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly, two months free</button>
        </div>
      </div>
      {plans.map((g) => (
        <div key={g.group} className="group" style={{ marginTop: 0 }}>
          <h3>{g.group} {annual ? "($ a year)" : "($ a month)"}</h3>
          {g.items.map((p) => (
            <div key={p.name} className="item">
              <div className="row num">
                <span>{p.name}</span>
                <span>{(annual ? p.y : p.m).toLocaleString("en-US")}</span>
              </div>
              <p className="desc">{p.desc}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Staggered entrances, once per section. Content is visible without script.
export function Reveal() {
  useEffect(() => {
    document.querySelector("main.no-js")?.classList.remove("no-js");
    const els = document.querySelectorAll(".reveal, .reveal-rows");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
