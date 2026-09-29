# Psychology-Informed Reinforcement Learning for Adaptive Behavior Change

An exploratory simulation of personalized snus-reduction interventions using tabular Q-learning, noisy context signals, and a behavioral user model. Parameters are hand-designed assumptions, not clinically estimated effects. Results describe this simulator, not treatment effectiveness.

## Install and run

Python 3.11 or later is recommended. From the project directory on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py --train-users 3000 --users 1000 --days 30 --seeds 123 124 125 --plots
```

On macOS/Linux, use `.venv/bin/python` in place of `.\.venv\Scripts\python.exe`.

A quick smoke run:

```powershell
.\.venv\Scripts\python.exe main.py --train-users 30 --users 20 --days 16 --seeds 123 124 --plots
```

Options include `--strategy mixed|gradual_reduction|cold_turkey`, `--output results`, and `--plots` to save PNGs. Mixed assignment samples the two strategies with equal probability. Training starts at epsilon 0.60 and decreases to 0.05; evaluation uses zero exploration. Importing `main` does not run an experiment.

Run regression tests:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Experiment design

Each seed trains a fresh policy on a separate population (training seed = evaluation seed + 1,000,000). Every evaluation condition starts with identical user profiles for that seed:

- Tracking-only: always requests no intervention.
- Adaptive: frozen learned Q-values.
- Random: uniformly selects an action, including no intervention.
- Three fixed-action policies: one for each intervention.

All conditions share behavioral responses, psychological feedback, abstinence, relapse, and dropout rules. A common burden gate may replace an intervention with no intervention as the daily nudge count grows; fixed-action policies therefore mean fixed *requested* action, subject to that gate. Its minimum probability is 0.2, not a hard daily cap.

Population, context, signals, behavior, and policy use explicit random streams. Event streams are keyed by seed, user, day and event, so extra policy draws do not shift another user's environment. Trajectories can still diverge because actions change future behavior, event counts and retention. Reproducibility assumes the same Python/dependency versions and configuration.

`metadata.json` records run arguments, configuration, Python and dependency versions. `metrics.csv` contains one row per condition and seed. `summary.csv` reports the mean, sample standard deviation and valid count across independent runs. Standard deviation is run-to-run variability, not a confidence interval. A single seed cannot estimate variability. Daily and event CSVs, and optional plots, describe the **first evaluation seed only**; filenames identify this. No generated results are tracked in Git.

## Components

| File | Responsibility |
| --- | --- |
| `config.py` | Actions, rewards, signal distributions and user profiles |
| `user.py` | Behavioral state, responses, feedback, abstinence and dropout |
| `inference.py` | Event posterior and separately learned trigger prior |
| `policy.py` | Fixed, random and Q-learning policies |
| `simulation.py` | Shared environment, random streams, transitions and records |
| `evaluation.py` | Structured metrics and replicated summaries |
| `plots.py` | Figure-returning plotting functions |
| `main.py` | Command-line experiment orchestration and exports |
| `utils.py` | Sampling and discretization |
| `tests/` | Experimental-design and learning regression tests |
| `prior_adaptations/` | Historical, standalone prototypes |

## Observation and learning sequence

1. Sample one or two hidden triggers from the user's fixed trigger profile.
2. Choose one of those triggers to generate noisy context signals; record its identity for evaluation only.
3. Infer the current trigger from the current signals and a learned prior.
4. Estimate risk and construct the decision state.
5. Complete the previous learning transition using this actual next decision state.
6. Select and deliver an action, then simulate response and update psychological state and fatigue.
7. At day end, update abstinence, observed zero-use streak and dropout.
8. Close pending transitions at dropout or the simulation horizon, without bootstrapping terminal value.

The estimator keeps positive pseudo-counts over signal-generating triggers. Each event has a fresh posterior; a zero likelihood on one event cannot permanently erase a context. Posterior probabilities are added to the prior counts as an approximate online profile estimator. Responses do not heuristically reinforce whichever trigger was guessed. This is not a full POMDP solver or an exact Bayesian mixture-model posterior.

The policy state contains user type, most likely current trigger, discretized estimated risk and fatigue, quitting strategy, daily nudge count capped at five, and an early/late phase flag. Q-values belong to a policy instance. Evaluation does not create or update table entries, and ties are broken randomly using the explicit policy stream.

Pending transitions span abstinent days until the next decision or termination. Discount time advances once per craving event and once per abstinent day without a decision. This mixed time scale is an approximation. Reward includes response rewards, the existing no-intervention adjustment and ignore/fatigue penalty, plus explicit zero-use abstinent-day reward (+1) and dropout penalty (-3). These long-term weights live in `config.py` and require sensitivity analysis.

## Outcomes and missing data

`observed_today` means behavior was observed that day; `active` means the user remained engaged at day end. A dropout-day observation is retained. Later consumption, fatigue and other psychological outcomes are missing rather than frozen or treated as zero.

- Consumption and fatigue averages use observed user-days, including dropout days. Changing survivor composition can affect these averages; they are not full-cohort causal effects.
- Retention uses every enrolled user and end-of-day activity.
- Savings are signed differences from each user's initial daily consumption, not estimated causal savings versus the tracking-only arm. Increased consumption can produce negative savings. Aggregate totals cover observed days only. The cumulative savings plot divides accumulated observed savings by the fixed enrolled population; it does not estimate post-dropout savings.
- Abstinence status is a simulated latent state. An observed zero-use streak is recorded separately; entering that state at day end does not erase consumption earlier that day.
- Sustained abstinence requires 14 consecutive observed zero-use days. Its denominator is all enrolled users; unobserved days are counted as unsuccessful, an explicit conservative missing-data convention.
- Relapse records a transition out of the simulated abstinent state, not necessarily observed consumption at that moment.
- Trigger accuracy compares the current prediction with the trigger that generated the current signals. The confusion matrix always includes all configured classes; absent rows are zero.

Plots use raw daily aggregates without smoothing or carried-forward imputation. Functions return figures; the CLI saves and closes them. Summaries use the actual final simulation day and return missing values for undefined reductions or unobserved final-day consumption.

## Modeling limitations

Motivation, self-efficacy, craving and fatigue evolve. Addiction, stress, adherence, social pressure and the true trigger profile currently remain fixed. Risk estimation assumes the psychological variables are observable; only triggers are hidden. Estimated trigger risk describes one signal-generating trigger, while actual risk may sum two triggers. The no-intervention response retains its original consumption formula, which does not directly use contextual risk.

Delays count as one consumed portion and receive a distinct reward and feedback effect; there is no clock-time delay model. Action quality and response rewards are assumptions shared across users, not empirical estimates. State discretization loses information and the state is not fully Markov. The model can favor an intervention because of its reward design, so compare behavioral outcomes as well as rewards. Larger training runs and sensitivity analyses are needed before drawing conclusions from a smoke run.

## Historical material

`README_old.md` and `prior_adaptations/` document earlier designs. Their parameters, results and standalone scripts do not define the current implementation. See the current README and configuration for supported behavior.

## Citation and license

Malcolm SÃ¶yring HelasterÃ¤, KTH Royal Institute of Technology, 2026.

MIT License; see [LICENSE](LICENSE).
