"""Event inference with a separate learned prior over signal-generating triggers."""
from config import CONTEXTS, CONTEXT_RISK, CONTEXT_SIGNAL_MODEL
from utils import discretize


class BeliefEstimator:
    def __init__(self):
        self.counts = dict.fromkeys(CONTEXTS, 1.0)
        self.posterior = dict.fromkeys(CONTEXTS, 1 / len(CONTEXTS))

    def observe(self, signals):
        weights = {}
        for context in CONTEXTS:
            likelihood = 1.0
            for name, value in signals.items():
                likelihood *= CONTEXT_SIGNAL_MODEL[context][name].get(value, 0.0)
            weights[context] = self.counts[context] * likelihood
        total = sum(weights.values())
        if total == 0:
            total = sum(self.counts.values())
            self.posterior = {c: self.counts[c] / total for c in CONTEXTS}
        else:
            self.posterior = {c: w / total for c, w in weights.items()}
        for context in CONTEXTS:
            self.counts[context] += self.posterior[context]
        return self.posterior

    def most_likely(self):
        return max(self.posterior, key=self.posterior.get)

    def estimate_risk(self, user):
        expected = sum(self.posterior[c] * CONTEXT_RISK[c] for c in CONTEXTS)
        risk = (0.25 * user.addiction + 0.20 * user.stress + 0.20 * user.craving
                + 0.15 * user.fatigue + 0.10 * user.social_pressure
                - 0.20 * user.motivation - 0.20 * user.self_efficacy + expected)
        if user.strategy == "cold_turkey":
            risk += 0.06 if user.current_day <= 10 else -min(0.06, user.total_successes * 0.0025)
        else:
            risk -= 0.03 if user.current_day <= 10 else min(0.035, user.total_successes * 0.0012)
        return max(0, min(1, risk))

    def state(self, user, nudges_sent):
        return (user.user_type, self.most_likely(), discretize(self.estimate_risk(user)),
                discretize(user.fatigue), user.strategy, min(nudges_sent, 5),
                user.current_day <= 10)
