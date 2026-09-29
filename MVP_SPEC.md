# SnusLess MVP specification

Status: proposed implementation specification, 2026-09-29.
Basis: [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md), which records the presentation and focus-group evidence. Research findings motivate these requirements; numerical defaults and technical choices below are product proposals, not study conclusions.

## 1. Outcome and scope

Build a mobile-first website that helps a person understand their snus use, pursue a self-selected goal, and access support during a craving. The first release must demonstrate a useful daily experience and understandable personalization.

Core loop: choose a goal -> log use or a craving -> receive optional relevant support -> review cumulative progress -> adjust preferences.

The intended project audience remains ages 15-25. Proposed first private pilot: Swedish-speaking users aged 18-25, matching the ages represented in the study. Confirm the pilot age range before recruitment; this proposal does not resolve requirements for a later under-18 launch. Design for students, workers, and social users without assigning clinical risk labels.

Launch copy is Swedish; currency is SEK. The English wording in this specification describes behavior and is not final interface copy. Goals, frequency, tone, and data sharing remain under user control.

### Required for the first private beta

- Account access and persistent private records.
- Short onboarding with quit, reduce, and track-first modes.
- Fast logging, correction, optional context tags, and explicit daily completion.
- On-demand craving support with a delay timer and brief reviewed exercises.
- Weekly/monthly progress and transparent personal savings estimates.
- Simple, explainable suggestions grounded in recorded data.
- Support preferences, quiet logging after setbacks, export, and deletion.
- User-scheduled reminders only if browser delivery passes the release checks below. Otherwise ship the beta explicitly as an in-app-support version with scheduling hidden; notification delivery is a separate milestone, not a nonfunctional control.

### Deferred

Live reinforcement learning, passive context sensing, automated reduction plans, medical risk scores, free-form AI chat, social feeds, leaderboards, subscriptions, and native mobile apps. Keep the Python simulator separate from production records. A rule-based implementation must not be marketed as a trained personal AI.

## 2. Navigation and screens

After onboarding, use three primary destinations: **Today**, **Progress**, and **My support**. Keep **Help with a craving** accessible from each. Account/data settings are reached from My support.

| Screen | Contents and main action | Important states |
| --- | --- | --- |
| Welcome / account | Brief promise, sign in, create account, concise explanation of stored data | Loading, failed authentication, retry, expired session |
| Onboarding | Goal; usual daily portions; optional personal price and portions per can; optional support style | Track-first path, skipped optional fields, invalid numbers, saved draft |
| Today | Date, logged portions, goal if applicable, Add portion, Help with a craving, recent editable entries, Complete today's log | No entries is unknown, open day, complete day, save pending/failed |
| Log details | Quantity, timestamp, optional context; edit/delete | Default quantity 1 and current time; invalid/future time; historical correction |
| Craving support | Choose short delay, breathing, or distraction; optional context and follow-up | Running timer, cancelled, completed, no response |
| Progress | 7/30-day view, daily use with gaps, coverage count, estimated savings, cumulative confirmed snus-free days | No completed days, partial coverage, absent price inputs, corrected history |
| Suggestion details | Observation, why it led to this suggestion, accept/dismiss, relevant preference | Insufficient data, dismissed, accepted, underlying records edited |
| My support | Goal/target, style, setback response, pause support, optional reminder schedule and quiet hours | Tracking-only mode, paused, reminders unavailable or denied |
| Account / data | Export records, delete account, sign out; brief explanation of data use | Export failed, deletion confirmation, deletion pending/completed |

Do not require onboarding questions about inferred addiction, relapse risk, or psychological scores. Baseline may be skipped with “I don't know”; show observed usage without savings/reduction comparisons until supplied. Reduction target is chosen by the user and is optional; the app does not prescribe a taper.

## 3. Main user flows and acceptance criteria

### A. First visit

Welcome -> account -> choose quit/reduce/track -> baseline -> optional costs/support preferences -> Today.

- A1: Every goal reaches Today without enabling notifications or entering optional data.
- A2: Target onboarding completion is under two minutes in the usability pilot; this is a design target, not a measured result.
- A3: Reduce allows an editable daily portion target; quit shows the user's aim without inventing a quit date; track shows no imposed consumption target.
- A4: Invalid or negative inputs produce an adjacent explanation. Price must be positive when provided; portions per can must be a positive integer; baseline may be zero or a positive decimal estimate.
- A5: Back navigation preserves entries. Refresh resumes a saved onboarding draft after sign-in.
- A6: Support defaults to quiet, in-app suggestions. No browser permission prompt appears during onboarding.

### B. Log use and correct it

Today -> Add portion -> persisted entry plus Undo -> optional details.

- B1: From Today, one tap saves one portion with the current timestamp; optional context is never a prerequisite.
- B2: Each deliberate tap represents a portion. Network retries reuse the same operation ID and cannot duplicate an entry.
- B3: The interface distinguishes saving, saved, and failed; a failure retains the draft and offers retry. It never reports an unsaved entry as saved.
- B4: Undo, edit quantity/time/context, and delete update the day's total and derived progress. Quantities are positive integers; future timestamps are rejected.
- B5: Context choices include after a meal, studying/work, commuting, social situation, stress, other, and prefer not to say. Context is self-reported, not inferred as fact.
- B6: An offline connection failure has a clear state. Offline synchronization is outside this release; the app must not imply cloud persistence while offline.

### C. Complete a day

Today or historical day -> review total -> confirm the day is complete.

- C1: A day with no entries remains “not completed,” not zero consumption.
- C2: Users can explicitly confirm zero use. A completed day with zero portions counts as a confirmed snus-free day.
- C3: Confirming today's log explains that later use can still be added. Any consumption addition/edit/deletion affecting a completed day reopens that day until reconfirmed; moving an entry can reopen both affected days.
- C4: Progress distinguishes incomplete days visually and reports completed-day coverage, such as “5 of 7 days completed.”
- C5: Logging dates use the user's stored reporting timezone, initially Europe/Stockholm for this pilot. Historical day assignments are retained if that setting changes; new entries use the new timezone.

### D. Get help during a craving

Help with a craving -> choose exercise -> complete/cancel -> optional “How did it go?” -> return.

- D1: Support can be opened without logging consumption or choosing a trigger.
- D2: Offer a user-started five-minute delay, a brief breathing exercise, and a brief distraction activity. Content must be reviewed before release; these options make no guaranteed effectiveness claim.
- D3: The timer derives remaining time from its start/end timestamps so switching tabs does not reset elapsed time. Cancelling is always possible.
- D4: Finishing a timer or exercise records completion only. It does not create avoided portions, abstinence, or savings.
- D5: Follow-up choices include “Used snus,” “Didn't use now,” and “Skip.” “Used snus” offers a consumption entry for confirmation; it does not silently duplicate one. “Didn't use now” is not a confirmed zero-use day.

### E. See relevant, understandable support

Logged pattern -> optional suggestion on Today -> Why this? -> accept/dismiss.

- E1: Initial rule: at least three user-tagged use/craving events with the same context across at least two distinct days in the preceding seven days can trigger one context suggestion. This threshold is provisional.
- E2: Show exact supporting counts and dates, with wording such as “You tagged 3 entries as after meals this week.” Do not call this a proven trigger or a predicted craving.
- E3: Suggest an on-demand exercise for that context. If reminders are supported, offer a user-chosen time; a context tag alone does not provide meal timing.
- E4: At most one proactive in-app suggestion is shown per reporting day. Dismissing a context suggestion suppresses that context for seven days. Pausing support suppresses all proactive suggestions while retaining user-requested exercises.
- E5: “Why this?” identifies the relevant logged pattern and rule in plain language, with an option to change preferences. It does not expose internal model jargon.
- E6: Too little data yields either no suggestion or clearly labeled general support. Consumption intensity never automatically selects a forceful tone or higher reminder frequency.
- E7: Corrections to source entries recompute eligibility; a stale observation must not remain visible as current evidence.

### F. Record a setback

Log use -> ordinary saved confirmation -> optional reflection/support if enabled.

- F1: Default is quiet logging. Users may choose a gentle acknowledgment or an optional reflection prompt in My support.
- F2: Use after confirmed snus-free days never deletes earlier achievements, history, or confirmed zero-use days.
- F3: No reminder increase, goal change, or disclosure occurs automatically.
- F4: No mandatory confession, red failure screen, punishment, or shaming language. The MVP emphasizes cumulative snus-free days rather than a streak counter.

### G. Change goals or pause

My support -> change goal/target/style or pause -> save -> Today reflects choice.

- G1: Switching between quit, reduce, and track preserves all records and achievements.
- G2: Pausing disables proactive support and scheduled reminders; logging and on-demand support remain usable. Resuming requires an explicit action.
- G3: Support styles are quiet or gentle/direct wording, all nonjudgmental. A direct style never permits insults or threats.
- G4: A goal change takes effect from its recorded time and does not rewrite historical goals.

### H. Optional scheduled reminders: separate delivery gate

My support -> enable reminders -> explain purpose -> request browser permission -> select time(s) and quiet hours -> save.

- H1: Default is off. The user selects up to two scheduled reminders per day for this initial implementation; this is a scope choice, not a research-derived optimal frequency.
- H2: Permission denial/unsupported delivery produces a clear unavailable state while all core features remain usable.
- H3: Quiet hours suppress matching sends, including intervals spanning midnight; missed sends are not queued for a later burst. Pause/off cancels future sends.
- H4: Notifications use discreet generic wording. No lock-screen consumption, savings, or setback details by default.
- H5: Delivery capability is verified on the actual pilot devices, including background/closed-app behavior and any installation requirements. Do not promise exact delivery time.
- H6: Enabling, editing, or increasing frequency requires explicit user action. Retried delivery jobs do not send the same scheduled reminder twice.

## 4. Progress and calculation contract

Use actual portion counts, never an assumed nicotine dose. Scope savings to estimated expenditure relative to the user's stated baseline; do not describe it as verified cash saved or treatment impact.

- Per-portion cost = entered can price / entered portions per can.
- For each completed day, estimated cost difference = (baseline daily portions - logged portions) * per-portion cost.
- Period estimate = sum of eligible completed-day differences. Incomplete days are excluded and coverage is displayed. Missing baseline/cost inputs make that day's estimate unavailable, not zero.
- Negative differences remain negative, presented neutrally as estimated extra spending versus baseline; never clamp them to zero.
- Personal cost/baseline edits apply from the selected effective day, default today. Retain earlier versions; retroactive corrections require an explicit effective date. Goal edits do not change the comparison baseline.
- Round displayed SEK amounts to two decimals after calculation, not each intermediate portion cost.
- Daily charts can show incomplete logged totals, clearly marked partial; period averages and comparisons use completed days and state that denominator.
- Total confirmed snus-free days counts completed zero-use days. Unlogged days never count. Do not show a percentage reduction when baseline is zero or unknown.

Calculation acceptance fixture: baseline 10 portions/day, price 50 SEK, 20 portions/can. A completed 6-portion day yields 10 SEK; a completed 12-portion day yields -5 SEK. Together the estimate is 5 SEK. Adding an incomplete day changes coverage, not this estimate. Correcting a completed day reopens it and temporarily removes it from that sum until reconfirmed.

## 5. Minimum records and data behavior

| Record | Essential fields |
| --- | --- |
| Profile | Account ID, locale, reporting timezone, onboarding state |
| Goal history | Account ID, mode, optional target, effective timestamp |
| Baseline/cost history | Account ID, baseline portions, optional can price/portion count, effective day |
| Consumption | ID, account ID, quantity, timestamp, reporting day/timezone, optional context, idempotency key |
| Craving session | ID, account ID, timestamp/day, optional context, exercise, completion/cancellation, optional outcome |
| Daily completion | Account ID, reporting day, completion state/time |
| Support preferences | Tone, setback response, paused flag; reminder settings if supported |
| Suggestion interaction | Account ID, rule/context, shown/dismissed/accepted timestamps, suppression expiry |

Store only what serves these experiences. Do not add passive location, contacts, device activity, inferred risk classes, or free-text journals to this release. Keep research simulation exports out of production user data.

- Account isolation is enforced server-side for every read/write, export, and deletion. A direct request for another account's record must fail, not merely be hidden in the interface.
- Export includes the user's inputs, history, and preferences in a documented machine-readable format with timezone fields.
- Account deletion requires a clear confirmation, removes active application records and reminder subscriptions, and signs the user out. Specify any backup retention in the deployed data policy; do not claim instantaneous removal from every backup.
- Application diagnostics must not contain raw usage histories, contexts, authentication tokens, or email addresses. Product analytics are not required for this beta; usability feedback can be collected separately.

## 6. Interface quality and release checks

- Primary actions work at 360px width without horizontal scrolling; usable on desktop as well.
- Interactive touch targets are at least 44 by 44 CSS pixels; labels, focus indicators, keyboard access, and screen-reader names are present.
- Color is not the sole indicator of progress, missing data, errors, or success. Respect reduced-motion preferences.
- Every network operation has a recoverable error state. No fabricated sample data appears as a user's real history.
- Savings show their basis; suggestions show their reason; optional questions and controls clearly indicate that they can be skipped.
- Review Swedish copy for neutral, age-appropriate language. Avoid unsupported claims of clinically proven quitting outcomes.

Release checks must cover: all three onboarding paths; unknown/zero baseline; logging/retry/undo; historical edits and reopening days; incomplete versus zero days; the calculation fixture; context suggestion thresholds and suppression; quiet setback flow; pause/resume; account isolation; export and deletion; keyboard/mobile usability. If reminder delivery is included, also test denial, quiet hours, timezone handling, retries, pause, and target-device delivery.

## 7. Implementation order and definition of done

1. Build the mobile screen structure and short onboarding using clearly marked test data.
2. Add account access, records, fast logging, corrections, and completed-day semantics.
3. Add progress calculations and user-controlled goals/preferences.
4. Add craving support and explainable context suggestions; review exercise content and Swedish copy.
5. Complete data controls, failure states, accessibility, and meaningful acceptance tests.
6. Evaluate scheduled reminder delivery separately; either pass its gate or omit its controls from the first beta.
7. Run the existing study's three scenarios with the implemented product: first use, adaptation, and setback. Check whether participants can explain savings and suggestions, override support, and log a setback without feeling pressured.

Ready for private beta means the required core flows persist across sessions, calculation and isolation checks pass, no blocking usability issue remains in those flows, and the pilot audience and content are confirmed. Measure perceived usefulness, trust, control, logging effort, annoyance, and willingness to return. Do not interpret a small usability pilot as evidence of cessation effectiveness.
