# SnusLess web app

Swedish mobile-first MVP based on `../MVP_SPEC.md` and `../PRODUCT_BRIEF.md`. The Python research simulator remains separate and is not used to infer facts about app users.

## Start it again on Malcolm's Windows computer

The dependencies and local database are already set up on this computer. Open **PowerShell**, paste these commands, and press Enter:

```powershell
cd C:\Users\Malcolm\Documents\GitHub\Snusless\web

$env:PATH = "$PWD\.sites-runtime\tools;C:\Users\Malcolm\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"

npm run dev
```

Open the **Local** URL printed in the terminal, normally [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

- Keep the terminal open while using the app. To stop it, press **Ctrl+C**.
- To run it another day or after restarting the computer, repeat the commands above. No database setup is needed again.
- Choose **Fortsätt utan konto** to start immediately with browser-local storage. Email/password and Google options require the one-time setup in [AUTH_SETUP.md](AUTH_SETUP.md). Existing local test records remain available under **Tidigare testkonto** → **Öppna befintlig ChatGPT-logg**, labeled **Lokalt testkonto**.
- Your local test records survive server restarts in `web/.wrangler/state`. Do not delete that folder if you want to keep them. Use the app's export button to save a readable copy of your records.
- This address works on this computer while the server is running; it is not a published website.

The PATH line uses the Node/npm runtimes prepared during development and only affects the current PowerShell window. If you already have Node and npm installed normally, you can omit it. These machine-specific runtime paths are not included when cloning the repository onto another computer.

### If it does not start

- **`npm` or `node` is not recognized:** run the PATH line above in the same terminal. If those runtime folders no longer exist, install Node.js with npm (Node 22.13 or later), reopen PowerShell, and use the setup below if dependencies are missing.
- **A server is already running:** open its existing Local URL, or stop it with Ctrl+C in its terminal before starting another.
- **The page cannot connect:** check that the terminal is still running and use the exact Local URL it printed. The port may differ from 5173.
- **Dependencies are missing:** run `npm ci` from the `web` folder, then `npm run dev`. Keep the existing database; do not rerun the initial migration against it.

## First-time setup on a new computer

Requires Node 22.13+ and npm on PATH.

```powershell
cd C:\path\to\Snusless\web
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_round_umar.sql
npm run dev
```

Replace the example folder with your actual checkout path. Apply the initial migration only once per local database; it has already been applied on Malcolm's computer. Later migrations must be applied in order. Open the exact URL printed by the development server (normally http://127.0.0.1:5173).

Development sign-in is a loopback-only test account supplied by the starter. It is labeled **Lokalt testkonto** in the app and persists in local D1. It is not a real public login service. The legacy ChatGPT path uses Sites' dispatch-owned sign-in; the dispatcher, not the client, must supply the authenticated user headers. Do not expose the Worker directly to the internet behind an untrusted header-forwarding proxy.

## Account and guest access

See [AUTH_SETUP.md](AUTH_SETUP.md) for Supabase email/password and Google configuration, guest-storage behavior, and verification. Guest mode is available without a provider project; account buttons remain disabled until configured. No passwords are stored in D1.

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

Before inviting users: confirm the pilot audience, review the final Swedish exercise content with the project owner, set a concrete backup-retention/privacy policy, verify deployed sign-in and data isolation, and run the planned usability sessions. The proposed 18-25 pilot has not been silently broadened or recruited. Email/password and Google integration is implemented but requires a Supabase project and provider configuration before live verification. The legacy ChatGPT identity path is retained for existing records.

Push notifications are deliberately absent, as allowed by the MVP delivery gate. There is no live RL, passive sensing, medical risk scoring, or claim of clinically demonstrated effectiveness.
