# Roth-Feller

A private trading firm, staffed by AI. Next.js on Vercel, Supabase for auth and data, Stripe for billing.

## Run it

```bash
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm install
npm test                     # ticket sizing tests
npm run dev
```

## Layout

- `app/` landing page, `/login` (Google, Apple, GitHub, email + password, magic link), `/desk`.
- `lib/ticket.ts` Risk Manager sizing on the stressed stop (ported from hypergrok, see notices).
- `supabase/migrations/` schema with row-level security. Owners can only read their rows and
  approve their own unexpired ticket through `approve_ticket()`; engines own every other transition.
- `.taste-skill/direction.json` the art direction this design follows.

## Supabase auth setup

Email sign-in works out of the box. Google, Apple and GitHub need their client IDs entered in
Supabase → Authentication → Providers, and the site URL plus `/auth/callback` added to the
redirect allow list.
