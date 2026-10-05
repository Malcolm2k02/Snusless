# Email, Google, and guest access

The start screen now offers email/password signup and login, Google sign-in, and **Fortsätt utan konto**. Guest mode works immediately. Account options stay disabled until an authentication project is configured; no fake account is created.

## 1. Create a Supabase project

Create a project in [Supabase](https://supabase.com/dashboard). In its API settings, copy the project URL and **publishable** key (`sb_publishable_…`). This app deliberately rejects secret and legacy service-role keys. Never put a secret key in browser configuration.

For local development, create `web/.dev.vars` with:

```dotenv
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_YOUR_PUBLIC_KEY"
GOOGLE_AUTH_ENABLED="false"
```

`.dev.vars` is ignored by Git. Restart `npm run dev` after editing it. On a deployment, supply the same named Worker runtime bindings through the host's configuration. Google/email account journals use Supabase Postgres. Before using account mode, run `supabase/001_journals.sql` in the project SQL Editor. This creates the journal table, RLS ownership policies, and revision validation. The app uses the signed-in user token and public key; no service-role key is needed.

## 2. Enable email/password

In Supabase Authentication:

- Enable the Email provider and email/password signup.
- Keep email confirmation enabled and set the minimum password length to 12, matching the form. The server/provider must enforce this too.
- Set the Site URL to the actual application origin.
- Add exact allowed redirect URLs for each origin you use. Locally these are `http://127.0.0.1:5173/` and `http://127.0.0.1:5173/?recovery=1`. Add the corresponding HTTPS URLs when deployed.
- Configure production SMTP/email delivery before inviting beta users; the default email service has restrictions. Review the provider's signup and email rate limits.

The app supports confirmation messages, login, forgotten-password email, and a new-password form. PKCE confirmation/recovery links must be opened in the same browser where the request started. A failed or cancelled callback shows an error and permits retry.

References: [Password authentication](https://supabase.com/docs/guides/auth/passwords), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Enable Google (optional)

Create a Web OAuth client in Google Cloud and configure its consent screen. Use the callback URL shown in Supabase's Google provider settings (normally `https://YOUR_PROJECT.supabase.co/auth/v1/callback`) as Google's authorized redirect URI. Add your application's origins where required, and add test users if your Google consent app is still in testing.

Put the Google client ID and secret in **Supabase's Google provider settings**, enable that provider, then set `GOOGLE_AUTH_ENABLED="true"` in the app's runtime configuration and restart. Never put the Google client secret in this repository or in browser code.

Reference: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Guest and account data

- Guests use IndexedDB on this browser and origin. Guest journals never call `/api/state` and are not linked to an email, Google identity, or ChatGPT identity.
- Guests can onboard, log, edit, review progress, use exercises, export, and delete local data. Writes use IndexedDB transactions and revision checks across tabs.
- Clearing site data, private browsing cleanup, or browser eviction can remove the guest journal. A different browser, device, hostname, or port has separate data. The UI explains local storage and export.
- Guest data is **not automatically migrated** into a later account. Signing into an account preserves the separate guest journal. Choose guest mode again to access it on the original browser/origin.
- Supabase handles passwords and session refresh. Its browser SDK persists session tokens in browser storage. Passwords do not go through the app's journal API.
- Every account API request validates its access token with Supabase's user endpoint. Only the verified provider user ID determines ownership, prefixed with `supabase:`. Invalid bearer credentials never fall back to a ChatGPT session.
- Existing ChatGPT records remain reachable under **Tidigare testkonto**. These legacy records still use D1 and require a trusted dispatcher; Google/email journals use Supabase.
- **Radera mina SnusLess-uppgifter** deletes the journal/settings, not the authentication-provider identity. The confirmation states this explicitly. Full provider-account deletion is not implemented.
- Guest mode is local storage, not an installable/offline-cached app; loading the website still requires the server to be available.

## Verification

Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:api` from `web/`. Unit tests cover guest transactions, retries, conflicts, deletion, storage failures, and token verification. Worker integration tests use a mocked authentication issuer and disposable D1 database to verify identity isolation and forged-token rejection; they never create real accounts or send emails.

Once configured, manually verify signup and confirmation, wrong passwords, login after reload, logout, password recovery, Google approval/cancellation, and isolation between two real test accounts. Live provider flows cannot be verified without a project and its configuration.

## Move existing local Google/email journals

The prepared private file `.sites-runtime/supabase-import.sql`, if present, imports local account journals after the schema file has been run. Open it locally and run its contents in the same Supabase SQL Editor. It does not overwrite existing cloud journals, and the original local database is preserved. This file contains private journal data and is ignored by Git. Guest logs remain browser-local.

After running both files, restart the dev server, sign in, log a portion, and refresh. Account records appear in Supabase Table Editor under `public.journals`. Keep RLS enabled. Account data now goes to the hosted project even while the website runs locally.

## Verify real database isolation before release

Run the entire `supabase/002_verify_isolation.sql` file in Supabase SQL Editor as the project administrator. It creates two temporary test identities in a transaction, assumes authenticated and anonymous roles, and verifies own-row access, cross-account read/update/delete/insert denial, revision validation, and anonymous denial. A successful run returns `PASS` and rolls back all fixtures. Existing journals are never selected as fixtures or modified. Any error means release should wait until it is diagnosed.

The API integration suite separately tests token authentication and account scoping using mocked Supabase REST. It does not verify deployed PostgreSQL policies or Google OAuth; those require the real project and browser sign-in.
