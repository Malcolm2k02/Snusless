"""Policies own learned values; evaluation never changes the table."""
from config import ALPHA, GAMMA, NUDGES, REWARD


def reward_for(response, action, fatigue):
    reward = REWARD[response]
    if action == "no_intervention":
        reward = 0.5 if response == "skip" else -1.5
    return reward - (fatigue * 0.3 if response == "ignore" else 0)


class FixedPolicy:
    def __init__(self, action="no_intervention"):
        if action not in NUDGES:
            raise ValueError(f"Unknown action: {action}")
        self.action = action

    def choose(self, state, rng, epsilon=0):
        return self.action


class RandomPolicy:
    def choose(self, state, rng, epsilon=0):
        return rng.choice(NUDGES)


class QLearningPolicy:
    def __init__(self, alpha=ALPHA, gamma=GAMMA):
        self.q_table = {}
        self.alpha = alpha
        self.gamma = gamma

    def choose(self, state, rng, epsilon=0):
        values = self.q_table.get(state, dict.fromkeys(NUDGES, 0.0))
        if rng.random() < epsilon:
            return rng.choice(NUDGES)
        best = max(values.values())
        return rng.choice([a for a in NUDGES if values[a] == best])

    def update(self, state, action, reward, next_state=None, terminal=False, elapsed=1):
        values = self.q_table.setdefault(state, dict.fromkeys(NUDGES, 0.0))
        future = 0 if terminal else max(self.q_table.get(next_state, dict.fromkeys(NUDGES, 0.0)).values())
        values[action] += self.alpha * (reward + self.gamma ** elapsed * future - values[action])
