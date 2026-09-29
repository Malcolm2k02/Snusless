# SnusLess web app

Swedish mobile-first MVP based on `../MVP_SPEC.md` and `../PRODUCT_BRIEF.md`. The Python research simulator remains separate and is not used to infer facts about app users.

## Run locally

Requires Node 22.13+ and npm on PATH.

```powershell
cd web
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_round_umar.sql
npm run dev
```

Apply the initial migration only once per local database. Later migrations must be applied in order. Open the exact URL printed by the development server (normally http://127.0.0.1:5173).

Development sign-in is a loopback-only test account supplied by the starter. It is labeled **Lokalt testkonto** in the app and persists in local D1. It is not a real public login service. Production uses Sites' dispatch-owned ChatGPT sign-in; the dispatcher, not the client, must supply the authenticated user headers. Do not expose the Worker directly to the internet behind an untrusted header-forwarding proxy.

## Implemented

- Quit/reduce/track onboarding with saved drafts between steps and optional baseline/cost inputs.
- Server-backed user-scoped records, optimistic revisions, idempotent operation IDs, and explicit failed-save retry.
- Quick portion logging, undo, editing time/count/context, deletion, historical review, and day confirmation/reopening.
- 7/30-day charts, coverage, cumulative confirmed snus-free days, versioned costs/baselines, and signed SEK estimates.
- Delay/breathing/distraction exercises with persisted timers and optional outcomes. Exercises never imply avoided consumption.
- Explainable context suggestions after three entries across two days; daily limit, seven-day dismissal, and pause controls.
- Goal history, support tone, quiet/gentle/reflection logging responses, timezone, JSON export, account-data deletion and sign-out.
- Keyboard-accessible component primitives, mobile layout, reduced-motion support, and a feature-detected WebMCP action to open craving support.

## Architecture

`app/snus-app.tsx` owns request/retry state. `forms.tsx`, `progress-view.tsx`, and `craving-support.tsx` implement the main surfaces. `lib/journal.ts` contains validated commands, calendar calculations, immutable transitions, and suggestion rules. `app/api/state/route.ts` enforces identity and same-origin mutations. D1 stores one bounded JSON document per user with an atomic revision check; records within it have stable IDs. This favors small pilot workloads over large-scale querying. The document limit is 1.5 MB; production scaling would require normalized tables, pagination, and operation-retention policy.

The API never accepts a user ID as an authorization source. Every query is scoped to the trusted signed-in ID. GET responses are no-store. No usage records are emitted to diagnostic logs. Exports omit internal idempotency keys but include goal/cost history, entries, sessions, preferences, completion dates and timezones (`snusless-export-v1`). Deletion removes the active SnusLess document, not the ChatGPT identity or provider backups.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm run test:api
```

API tests execute the built Worker in Miniflare with an isolated, disposable D1 database and synthetic trusted identity headers. They check anonymous rejection, origin checks, actual persisted reads/writes, idempotency, cross-account isolation, revision conflicts, and deletion isolation. No deployed data is used. The direct harness also avoids a local Wrangler preview-proxy restart error seen during POST testing on this Windows host.

Domain tests cover the specification's savings fixture, negative differences, missing/zero days, retries, edits across dates, cost history, pattern eligibility/dismissal/pause, timers, timezone retention, and invalid inputs.

## Hosting and release status

The Site was registered privately as `appgprj_6abbba238d908191a0202bebaf405d97`; its identity is retained in `.openai/hosting.json`. No version has been published. The Sites plugin and publishing scripts were removed from this machine during implementation. Restore the plugin to resume its normal source-sync/build/publish workflow using this existing identity; do not create a replacement Site.

Before inviting users: confirm the pilot audience, review the final Swedish exercise content with the project owner, set a concrete backup-retention/privacy policy, verify deployed sign-in and data isolation, and run the planned usability sessions. The proposed 18-25 pilot has not been silently broadened or recruited. ChatGPT sign-in is the current supported identity path; external consumer authentication would be a separate implementation decision.

Push notifications are deliberately absent, as allowed by the MVP delivery gate. There is no live RL, passive sensing, medical risk scoring, or claim of clinically demonstrated effectiveness.
