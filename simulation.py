"""Shared environment for every policy, with explicit observation and episode boundaries."""
import random
import pandas as pd
from config import (USER_TYPES, EPSILON_START, EPSILON_END, COST_PER_PORTION,
                    ABSTINENCE_DAY_REWARD, DROPOUT_PENALTY)
from user import User
from inference import BeliefEstimator
from policy import FixedPolicy, QLearningPolicy, reward_for
from utils import sample_true_triggers_for_user, observe_context_signals

STRATEGIES = ("gradual_reduction", "cold_turkey")
EVENT_COLUMNS = ["day", "event", "user_id", "user_type", "strategy", "actual_triggers",
                 "signal_trigger", "inferred_trigger", "trigger_confidence", "nudge", "response",
                 "actual_risk", "estimated_risk", "fatigue_before", "fatigue_after", "observed_signals"]


class SimulationEnvironment:
    def __init__(self, n_users, days, seed=123, strategy="mixed"):
        if n_users < 1 or days < 1:
            raise ValueError("n_users and days must be positive")
        if strategy not in (*STRATEGIES, "mixed"):
            raise ValueError("Unknown quitting strategy")
        self.days = days
        self.seed = seed
        population_rng = random.Random(f"{seed}:population")
        self.users = []
        for i in range(n_users):
            kind = population_rng.choice(list(USER_TYPES))
            quitting = population_rng.choice(STRATEGIES) if strategy == "mixed" else strategy
            user = User(kind, population_rng, quitting)
            self.users.append(user)
        self.beliefs = [BeliefEstimator() for _ in self.users]

    def run(self, policy, training=False):
        if training and not isinstance(policy, QLearningPolicy):
            raise ValueError("Only QLearningPolicy supports training")
        rows, events = [], []
        pending = [None] * len(self.users)
        ticks = [0] * len(self.users)

        def learn(uid, next_state=None, terminal=False):
            transition = pending[uid]
            if training and transition is not None:
                state, action, reward, tick = transition
                policy.update(state, action, reward, next_state, terminal,
                              elapsed=max(1, ticks[uid] - tick))
            pending[uid] = None

        for day in range(1, self.days + 1):
            epsilon = EPSILON_START + (day - 1) / max(1, self.days - 1) * (EPSILON_END - EPSILON_START) if training else 0
            for uid, user in enumerate(self.users):
                belief = self.beliefs[uid]
                user.current_day = day
                observed = user.active
                counts = dict(snus_used=0, nudges_sent=0, skips=0, delays=0, ignores=0)
                relapsed = False
                entered_abstinence = False
                if observed:
                    # Independently keyed streams keep policy draws out of environmental noise.
                    user.rng = random.Random(f"{self.seed}:{uid}:{day}:relapse")
                    relapsed = user.abstinent and user.check_relapse_from_abstinence()
                    if not user.abstinent:
                        cravings = max(1, min(int(user.baseline_use *
                            (0.7 + user.stress * 0.25 + user.addiction * 0.25 + user.craving * 0.20)),
                            int(user.baseline_use * 1.25)))
                        for event in range(cravings):
                            ticks[uid] += 1
                            context_rng = random.Random(f"{self.seed}:{uid}:{day}:{event}:context")
                            signal_rng = random.Random(f"{self.seed}:{uid}:{day}:{event}:signal")
                            policy_rng = random.Random(f"{self.seed}:{uid}:{day}:{event}:policy")
                            user.rng = random.Random(f"{self.seed}:{uid}:{day}:{event}:behavior")
                            triggers = sample_true_triggers_for_user(user, context_rng)
                            source, signals = observe_context_signals(triggers, signal_rng)
                            belief.observe(signals)
                            state = belief.state(user, counts["nudges_sent"])
                            learn(uid, state)
                            estimated_risk = belief.estimate_risk(user)
                            actual_risk = user.predict_risk(triggers)
                            # Same burden gate for every policy; no-intervention always remains possible.
                            gate = max(0.2, 1 - counts["nudges_sent"] * 0.20)
                            action = policy.choose(state, policy_rng, epsilon) if policy_rng.random() < gate else "no_intervention"
                            fatigue_before = user.fatigue
                            counts["nudges_sent"] += action != "no_intervention"
                            response = user.respond_to_nudge(actual_risk, action)
                            user.update_feedback_loops(response, action)
                            if action != "no_intervention" and counts["nudges_sent"] > 4:
                                user.fatigue = min(1.0, user.fatigue + 0.005)
                            counts["snus_used"] += response != "skip"
                            for outcome, key in [("skip", "skips"), ("delay", "delays"), ("ignore", "ignores")]:
                                counts[key] += response == outcome
                            pending[uid] = (state, action, reward_for(response, action, user.fatigue), ticks[uid])
                            events.append(dict(day=day, event=event, user_id=uid, user_type=user.user_type,
                                strategy=user.strategy, actual_triggers=tuple(triggers), signal_trigger=source,
                                inferred_trigger=belief.most_likely(), trigger_confidence=max(belief.posterior.values()),
                                nudge=action, response=response, actual_risk=actual_risk, estimated_risk=estimated_risk,
                                fatigue_before=fatigue_before, fatigue_after=user.fatigue, observed_signals=signals))
                        user.rng = random.Random(f"{self.seed}:{uid}:{day}:abstinence")
                        user.check_abstinence(counts["snus_used"])
                        entered_abstinence = user.abstinent
                    else:
                        ticks[uid] += 1  # an abstinent day without a decision is one waiting step
                    user.abstinence_streak = user.abstinence_streak + 1 if counts["snus_used"] == 0 else 0
                    user.rng = random.Random(f"{self.seed}:{uid}:{day}:dropout")
                    user.check_dropout()
                    if training and pending[uid] is not None:
                        state, action, reward, tick = pending[uid]
                        day_reward = ABSTINENCE_DAY_REWARD if user.abstinent and counts["snus_used"] == 0 else 0
                        if not user.active:
                            day_reward += DROPOUT_PENALTY
                        reward += policy.gamma ** (ticks[uid] - tick) * day_reward
                        pending[uid] = (state, action, reward, tick)
                if not user.active or day == self.days:
                    learn(uid, terminal=True)
                rows.append(dict(day=day, user_id=uid, user_type=user.user_type, strategy=user.strategy,
                    observed_today=observed, active=user.active, baseline_use=user.baseline_use,
                    **{key: value if observed else float("nan") for key, value in counts.items()},
                    money_saved=(user.baseline_use - counts["snus_used"]) * COST_PER_PORTION if observed else float("nan"),
                    fatigue=user.fatigue if observed else float("nan"),
                    motivation=user.motivation if observed else float("nan"),
                    self_efficacy=user.self_efficacy if observed else float("nan"),
                    abstinent=user.abstinent if observed else None,
                    entered_abstinence=entered_abstinence, relapsed=bool(relapsed),
                    abstinence_streak=user.abstinence_streak if observed else float("nan")))
        return pd.DataFrame(rows), pd.DataFrame(events, columns=EVENT_COLUMNS)


def simulate(n_users=300, days=30, algorithm=True, training_mode=False, *, policy=None, seed=123, strategy="mixed"):
    """Pass an explicit policy for training or evaluation; default is tracking-only."""
    if policy is None:
        if training_mode:
            raise ValueError("Pass a QLearningPolicy explicitly to retain trained values")
        policy = FixedPolicy()
    if not algorithm:
        policy = FixedPolicy()
    return SimulationEnvironment(n_users, days, seed, strategy).run(policy, training_mode)
