"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Provider = "google" | "apple" | "github";
const providers: { id: Provider; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "apple", label: "Continue with Apple" },
  { id: "github", label: "Continue with GitHub" },
];

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(params.get("error") ? "That sign-in link has expired. Try again." : null);

  const next = params.get("next") ?? "/desk";
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function oauth(provider: Provider) {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) { setMessage(error.message); setBusy(false); }
  }

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const sb = supabaseBrowser();
    const { data, error } = signup
      ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
      : await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (signup && !data.session) return setMessage(`Check ${email} for a link to confirm your account.`);
    router.push(next);
    router.refresh();
  }

  async function magicLink() {
    if (!email) return setMessage("Type your email first, then ask for a link.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    setMessage(error ? error.message : `A sign-in link is on its way to ${email}.`);
  }

  return (
    <div className="auth-form">
      <h1 id="auth-title">{signup ? "Meet your desk" : "Welcome back"}</h1>
      <p className="auth-sub">
        {signup ? "It starts on paper. No broker keys and no card." : "Sign in to your desk."}
      </p>
      <div className="auth-providers">
        {providers.map((p) => (
          <button key={p.id} type="button" className="btn btn-quiet" disabled={busy} onClick={() => oauth(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <form onSubmit={withPassword} className="auth-email">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          required
          minLength={8}
          aria-describedby="pw-rule"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span id="pw-rule" className="auth-hint">At least 8 characters.</span>
        <button className="btn" type="submit" disabled={busy}>{signup ? "Create my desk" : "Sign in"}</button>
        <button className="link auth-alt" type="button" onClick={magicLink} disabled={busy}>Email me a sign-in link instead</button>
      </form>
      <p className="auth-switch">
        {signup ? "Already have a desk? " : "New to Roth-Feller? "}
        <button type="button" className="link auth-alt" onClick={() => setSignup(!signup)}>
          {signup ? "Sign in" : "Create one free"}
        </button>
      </p>
      <p className="auth-msg" role="status">{message}</p>
    </div>
  );
}
