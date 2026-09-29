# SnusLess: research-informed first version

Reviewed 2026-09-29. Source: `C:/Users/Malcolm/Documents/Snusless/SnusLess-Final.pdf`, all 30 pages. The user asked that its core ideas, audience, and studies guide the small first version. This brief separates reported findings from proposed implementation choices; it does not authorize every feature described in the presentation.

## Purpose and audience

The presentation targets ages 15-25: students, young workers, people beginning snus use, and social/cultural users (pp. 2-4). Support quitting, cutting back, or tracking first, with goals that can change or pause. Preserve autonomy, dignity, privacy, motivation, well-being, and optional social belonging (pp. 5-10).

The actual focus group comprised five Swedish users aged 18-25, reported as two occasional and three daily users. The approximately 60-minute session used a Figma demo and discussions of onboarding, adaptation, and relapse (pp. 17-23). This is qualitative evidence about perceived usefulness, trust, and autonomy, not evidence of cessation effectiveness. The broader 15-25 audience includes ages not represented in this study. A Swedish-language, 18-25 initial pilot is a proposed scope, not a user-approved audience change.

## Findings and implications

| Reported theme | First-version implication |
| --- | --- |
| Personalization: real circumstances, cumulative/monthly savings, contextual timing (pp. 24-25) | Personal cost inputs, cumulative progress, optional reason/context tags, contextual support when requested. |
| Control: explanation, manual override, resistance to unsolicited changes (pp. 23-26) | Explain why a suggestion appears; allow dismissal and preference changes; ask before increasing reminder frequency. |
| Different motivation preferences (p. 27) | Let users choose support style and frequency, including none. Do not infer preferred intensity solely from consumption. |
| Progress over punishment (p. 28) | Preserve accumulated achievements after setbacks. Distinguish total snus-free days from consecutive streaks accurately. |
| Credibility: polished design, realistic data, short onboarding (p. 29) | Keep onboarding brief, calculations inspectable, language realistic, and the mobile interface consistent. Do not invent testimonials or outcome claims. |

The participant who preferred no attention after a setback (p. 23) supports a quiet logging option. One participant's objection to more than four daily notifications (p. 27) is not a universal validated cap. The preference for angry messages reported on that page does not override the project's non-shaming design values.

## Proposed minimum experience

1. Short onboarding: quit/reduce/track goal, baseline use, editable personal cost inputs in SEK, optional support preference. Ask additional questions when useful rather than requiring a long survey.
2. Today: quick use logging with undo/edit and optional context tags such as studying, after meals, commuting, or social situations. Separate a craving from actual consumption. Missing logs are not zero use.
3. Help now: an easily reached craving-support entry point with a small choice of reviewed breathing, distraction, or delay exercises (p. 8). A timer completing does not prove a portion was avoided.
4. Progress: weekly/monthly consumption, estimated savings relative to the user's baseline, cumulative achievements, and explicitly confirmed snus-free days. Explain estimates and incomplete data.
5. My support: editable goals, reminder frequency and quiet times, pause/off controls, preferred tone, clear data controls, and explanations for suggestions.
6. Setback flow: ordinary logging, optional reflection/support, preserved history, and no automatic escalation of reminders. Avoid framing a lapse as a moral failure.

Start personalization from stated preferences and logged observations. Example: offer an after-lunch reminder when the user has reported that pattern; explain the observed basis and let them accept or decline. Keep general tips distinct from personally observed patterns when data is sparse.

## Research system versus product

Pages 11-16 describe Bayesian trigger inference and tabular Q-learning with economic reminders, consumption feedback, small reduction goals, and no intervention. The reported training/evaluation populations of 3,000/1,000 are simulated. They are separate from the five real focus-group participants.

Retain the Python simulation as a research component. Do not use its latent psychological variables or synthetic effects as measured facts about real users. A first website should use explicit inputs rather than promise passive access to location, phone activity, or movement. Passive sensing, live learning, and peer/community features are deferred proposals. The context-aware, explainable, user-controlled experience remains central even before those capabilities exist.

## Source ambiguities to preserve

- Page 20 reverses the daily/occasional greater-than/less-than 6.5 definitions given on page 17. Verify the underlying participant records before using that split. Treat 6.5 as a study grouping, not a clinical cutoff or production classification.
- Page 22's scenario retains a streak after use and increases reminders. The later feedback supports cumulative progress and rejects unsolicited notification changes; the scenario is a discussion stimulus, not an accepted requirement. Preserve progress without falsifying a consecutive abstinence streak.
- Page 12 describes psychological variables as all evolving; the current README states several remain fixed. Use current code/README for implementation facts.
- Page 16 combines a six-week overview with 30-day detailed plots. The overview's vertical measure is not explicitly labeled. Do not reuse it as a quantitative effectiveness claim; regenerate research figures with clear provenance if needed.
- Page 30's limitation about simulated users applies to behavioral outcome evaluation; the presentation also reports a real focus group. Do not erase either evidence source or conflate them.

## Next evaluation

Test the implemented onboarding, adaptation, and setback flows, building on the existing study rather than restarting discovery. Assess perceived usefulness, trust, control, logging burden, reminder annoyance, comprehension of savings, and willingness to return. Include differing use intensities and preferences. A small usability pilot cannot establish causal cessation effectiveness.
