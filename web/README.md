# SnusLess web app

Swedish mobile-first MVP based on `../MVP_SPEC.md` and `../PRODUCT_BRIEF.md`. The Python research simulator remains separate and is not used to infer facts about app users.

## Run on this Windows computer

Double-click **Start SnusLess.cmd** in the repository's top-level folder. Keep its terminal window open while using the website. Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) and choose **Fortsätt utan konto**. Press **Ctrl+C** to stop the server.

You can also use PowerShell:

```powershell
cd C:\Users\malco\OneDrive\Dokument\GitHub\Snusless\web
npm.cmd run dev -- --hostname 127.0.0.1
```

Guest mode needs no authentication provider or database setup. Its journal is saved in this browser, separately for each hostname and port. Use the same address each time and export your data before clearing browser storage.

Email/password and Google sign-in require the configuration in [AUTH_SETUP.md](AUTH_SETUP.md), plus the local database migration below. Legacy ChatGPT sign-in requires a trusted Sites dispatcher and is not provided by this standalone local server.

### First-time dependency setup

Requires Node.js with npm (Node 24 LTS recommended). The launcher installs missing dependencies automatically. To install them manually:

```powershell
cd C:\path\to\Snusless\web
npm.cmd run install:ci
npm.cmd run dev -- --hostname 127.0.0.1
```

### Supabase database for Google/email accounts

Run `supabase/001_journals.sql` in your Supabase project's SQL Editor before using account mode. This enables private account journals and optimistic revision checks. If `.sites-runtime/supabase-import.sql` is present, run it after the schema to import the existing local account journals without overwriting cloud data.

Google/email logs are now stored in your hosted Supabase project, including during local development. Guest logs remain browser-local. Legacy trusted-dispatcher records remain in D1; preserve `.wrangler/state` if you need them.

### If it does not start

- If Node or npm is missing, install Node.js 24 LTS and reopen the terminal.
- If dependencies are missing, run `npm.cmd run install:ci` in `web`.
- If the port is occupied, use the Local URL printed by the server, or stop the previous server with Ctrl+C.
- Keep the terminal open and use its exact Local URL. This website runs locally while the server is running.

## Account and guest access

See [AUTH_SETUP.md](AUTH_SETUP.md) for Supabase email/password and Google configuration, guest-storage behavior, and verification. Guest mode is available without a provider project; account buttons remain disabled until configured. No passwords are stored in journal tables.

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

`app/snus-app.tsx` owns request/retry state. `forms.tsx`, `progress-view.tsx`, and `craving-support.tsx` implement the main surfaces. `lib/journal.ts` contains validated commands, calendar calculations, immutable transitions, and suggestion rules. `app/api/state/route.ts` enforces identity and same-origin mutations. Supabase stores one bounded JSON document per Google/email user with RLS and an atomic revision check; records within it have stable IDs. This favors small pilot workloads over large-scale querying. The document limit is 1.5 MB; production scaling would require normalized tables, pagination, and operation-retention policy.

The API never accepts a user ID as an authorization source. Every query is scoped to the trusted signed-in ID. GET responses are no-store. No usage records are emitted to diagnostic logs. Exports omit internal idempotency keys but include goal/cost history, entries, sessions, preferences, completion dates and timezones (`snusless-export-v1`). Deletion removes the active SnusLess document, not the ChatGPT identity or provider backups.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm run test:api
```

API tests execute the built Worker in Miniflare with an isolated, disposable D1 database and synthetic trusted identity headers. They check anonymous rejection, origin checks, actual persisted reads/writes, idempotency, cross-account isolation, revision conflicts, and deletion isolation. Supabase REST is mocked in these tests; real PostgreSQL RLS must be checked in the configured project. No deployed data is used. The direct harness also avoids a local Wrangler preview-proxy restart error seen during POST testing on this Windows host.

Domain tests cover the specification's savings fixture, negative differences, missing/zero days, retries, edits across dates, cost history, pattern eligibility/dismissal/pause, timers, timezone retention, and invalid inputs.

## Hosting and release status

The Site was registered privately as `appgprj_6abbba238d908191a0202bebaf405d97`; its identity is retained in `.openai/hosting.json`. No version has been published. The Sites plugin and publishing scripts were removed from this machine during implementation. Restore the plugin to resume its normal source-sync/build/publish workflow using this existing identity; do not create a replacement Site.

Before inviting users: confirm the pilot audience, review the final Swedish exercise content with the project owner, set a concrete backup-retention/privacy policy, verify deployed sign-in and data isolation, and run the planned usability sessions. The proposed 18-25 pilot has not been silently broadened or recruited. Email/password and Google integration is implemented but requires a Supabase project and provider configuration before live verification. The legacy ChatGPT identity path is retained for existing records.

Push notifications are deliberately absent, as allowed by the MVP delivery gate. There is no live RL, passive sensing, medical risk scoring, or claim of clinically demonstrated effectiveness.
