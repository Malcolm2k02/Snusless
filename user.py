"""Simulated behavior; policy and inference live in separate components."""
from config import CONTEXTS, CONTEXT_RISK, USER_TYPES

class User:
    """Behavioral state and response dynamics for one simulated user."""
    def __init__(self, user_type, rng, strategy="gradual_reduction"):
        """Initializes a User object with characteristics based on the specified user type,
          including baseline snus use, motivation, addiction level, stress, adherence,
            self-efficacy, and a hidden trigger profile."""
        self.rng = rng
        profile = USER_TYPES[user_type]

        self.user_type = user_type
        self.baseline_use = self.rng.randint(*profile["baseline_use"])
        self.motivation = self.rng.uniform(*profile["motivation"])
        self.addiction = self.rng.uniform(*profile["addiction"])
        self.stress = self.rng.uniform(*profile["stress"])
        self.adherence = self.rng.uniform(*profile["adherence"])
        self.self_efficacy = self.rng.uniform(*profile["self_efficacy"])

        self.craving = self.rng.uniform(0.3, 1.0)
        self.social_pressure = self.rng.uniform(0.0, 1.0)

        self.fatigue = 0.0
        self.active = True
        self.abstinent = False

        self.strategy = strategy

        self.current_day = 1
        self.success_streak = 0
        self.total_successes = 0

        weights = [self.rng.gammavariate(1, 1) for _ in CONTEXTS]
        self.trigger_profile = [w / sum(weights) for w in weights]
        self.abstinence_streak = 0


    def predict_risk(self, true_triggers):
        """Calculates the user's actual risk of using snus based on their characteristics and the true triggers they are experiencing."""
        trigger_risk = sum(CONTEXT_RISK[t] for t in true_triggers)

        risk = (
            0.25 * self.addiction +
            0.20 * self.stress +
            0.20 * self.craving +
            0.15 * self.fatigue +
            0.10 * self.social_pressure -
            0.20 * self.motivation -
            0.20 * self.self_efficacy +
            trigger_risk
        )

        # Cold turkey is harder early, but can become more effective later.
        if self.strategy == "cold_turkey":
            if self.current_day <= 10:
                risk += 0.08
                risk += self.rng.uniform(-0.08, 0.08)  # higher early variance
            else:
                risk -= min(0.08, self.total_successes * 0.003)

        # Gradual reduction is smoother and easier early, but improves more slowly.
        elif self.strategy == "gradual_reduction":
            if self.current_day <= 10:
                risk -= 0.04
            else:
                risk -= min(0.04, self.total_successes * 0.0015)

        return max(0.0, min(1.0, risk))


    def respond_to_nudge(self, actual_risk, nudge):
        """Determines the user's response to a nudge based on their actual risk and the type of nudge received,
          as well as their characteristics and current state."""
        if nudge == "no_intervention":
            use_probability = (0.30 + 0.35 * self.addiction + 0.25 * self.craving
                               + 0.15 * self.stress - 0.20 * self.self_efficacy)
            use_probability = max(0.05, min(0.95, use_probability))

            if self.rng.random() < use_probability:
                return "use"
            else:
                return "skip"

        engage_probability = self.adherence - self.fatigue
        engage_probability = max(0.05, min(0.95, engage_probability))

        if self.rng.random() > engage_probability:
            return "ignore"

        nudge_quality = {
            "economic reminder": 0.65,
            "snus_consumption_feedback": 0.70,
            "small_reduction_goal": 0.55,
            "no_intervention": 0.00
        }

        success_probability = (
            nudge_quality[nudge]
            * self.motivation
            * self.self_efficacy
            * (1 - self.addiction * 0.4)
        )

        if self.strategy == "cold_turkey":
            if self.current_day <= 10:
                success_probability -= 0.06
            else:
                success_probability += min(0.08, self.total_successes * 0.002)

        elif self.strategy == "gradual_reduction":
            if self.current_day <= 10:
                success_probability += 0.04
            else:
                success_probability += min(0.035, self.total_successes * 0.001)

        success_probability -= actual_risk * 0.15
        success_probability = max(0.05, min(0.75, success_probability))

        r = self.rng.random()

        if r < success_probability:
            return "skip"
        elif r < success_probability + 0.25:
            return "delay"
        else:
            return "use"


    def update_feedback_loops(self, response, nudge):
        """Updates the user's internal states such as motivation, 
            self-efficacy, craving, and fatigue based on their response 
            to a nudge and the type of nudge received."""
        if response in ["skip", "delay"]:
            self.success_streak += 1
            self.total_successes += 1
        else:
            self.success_streak = 0

        if response == "skip":
            self.motivation = min(1.0, self.motivation + 0.010)
            self.self_efficacy = min(1.0, self.self_efficacy + 0.010)
            self.craving = max(0.0, self.craving - 0.025)
            self.fatigue = max(0.0, self.fatigue - 0.008)

            if self.strategy == "cold_turkey":
                self.self_efficacy = min(1.0, self.self_efficacy + 0.006)
            elif self.strategy == "gradual_reduction":
                self.motivation = min(1.0, self.motivation + 0.003)

        elif response == "delay":
            self.motivation = min(1.0, self.motivation + 0.005)
            self.self_efficacy = min(1.0, self.self_efficacy + 0.006)
            self.craving = max(0.0, self.craving - 0.012)
            self.fatigue = max(0.0, self.fatigue - 0.004)

        elif response == "ignore":
            self.fatigue = min(1.0, self.fatigue + 0.035)
            self.motivation = max(0.0, self.motivation - 0.002)

        elif response == "use":
            self.motivation = max(0.0, self.motivation - 0.004)
            self.self_efficacy = max(0.0, self.self_efficacy - 0.006)
            self.craving = min(1.0, self.craving + 0.015)

            if self.strategy == "cold_turkey":
                self.self_efficacy = max(0.0, self.self_efficacy - 0.006)
                self.craving = min(1.0, self.craving + 0.006)
            elif self.strategy == "gradual_reduction":
                self.self_efficacy = max(0.0, self.self_efficacy - 0.002)

        if response in ["skip", "delay"]:
            if nudge == "economic reminder":
                self.motivation = min(1.0, self.motivation + 0.006)

            elif nudge == "snus_consumption_feedback":
                self.self_efficacy = min(1.0, self.self_efficacy + 0.006)
                self.craving = max(0.0, self.craving - 0.006)

            elif nudge == "small_reduction_goal":
                self.self_efficacy = min(1.0, self.self_efficacy + 0.008)
                self.motivation = min(1.0, self.motivation + 0.003)

    def check_dropout(self):
        """Determines whether the user drops out of the intervention based on their fatigue,
          motivation, and self-efficacy levels, as well as a base dropout probability."""
        dropout_probability = (
            0.002 +
            0.03 * self.fatigue +
            0.02 * (1 - self.motivation) +
            0.02 * (1 - self.self_efficacy)
        )

        dropout_probability = max(0.0, min(0.12, dropout_probability))

        if self.rng.random() < dropout_probability:
            self.active = False
    def check_abstinence(self, snus_used):
        """
        Users with low addiction, high motivation, and high self-efficacy
        have a chance to transition into complete abstinence.
        """

        if self.abstinent:
            return

        reduction_ratio = 1 - (snus_used / max(1, self.baseline_use))

        abstinence_probability = (
            0.02
            + 0.10 * self.motivation
            + 0.10 * self.self_efficacy
            - 0.12 * self.addiction
            - 0.06 * self.stress
            - 0.04 * self.fatigue
        )

        if reduction_ratio > 0.75:
            abstinence_probability += 0.08

        if snus_used <= 1:
            abstinence_probability += 0.08

        if self.user_type == "Low relapse risk / low intake":
            abstinence_probability += 0.10
        elif self.user_type == "Low relapse risk / high intake":
            abstinence_probability += 0.05
        elif self.user_type == "High relapse risk / high intake":
            abstinence_probability -= 0.04
        if self.addiction > 0.8 and snus_used <= 2 and reduction_ratio > 0.70:
            abstinence_probability += 0.02
        # Even high-addiction users have a small chance of reaching abstinence.
        # Low-risk users still have a much higher chance.
        abstinence_probability = max(0.003, min(0.30, abstinence_probability))

        if self.rng.random() < abstinence_probability:
            self.abstinent = True


    def check_relapse_from_abstinence(self):
        """
        Abstinent users can still relapse, especially if addiction and stress are high.
        """

        relapse_probability = (
            0.01
            + 0.05 * self.addiction
            + 0.03 * self.stress
            + 0.03 * self.craving
            - 0.04 * self.self_efficacy
        )

        relapse_probability = max(0.01, min(0.15, relapse_probability))

        if self.rng.random() < relapse_probability:
            self.abstinent = False
            return True

        return False