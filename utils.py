"""Sampling and discretization helpers."""
from config import CONTEXTS, CONTEXT_SIGNAL_MODEL


def discretize(value, low=0.33, high=0.66):
    return "low" if value < low else "medium" if value < high else "high"


def sample_true_triggers_for_user(user, rng):
    count = 1 if rng.random() < 0.75 else 2
    candidates, weights = list(CONTEXTS), list(user.trigger_profile)
    chosen = []
    for _ in range(count):
        trigger = rng.choices(candidates, weights=weights)[0]
        index = candidates.index(trigger)
        chosen.append(candidates.pop(index))
        weights.pop(index)
    return chosen


def observe_context_signals(triggers, rng):
    source = rng.choice(triggers)
    signals = {name: rng.choices(list(values), weights=list(values.values()))[0]
               for name, values in CONTEXT_SIGNAL_MODEL[source].items()}
    return source, signals
