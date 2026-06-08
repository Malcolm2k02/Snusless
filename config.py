# Configuration parameters for the Q-learning simulation of snus cessation interventions. 

NUDGES = [
    "no_intervention",
    "economic reminder",
    "snus_consumption_feedback",
    "small_reduction_goal"
]

REWARD = {
    "skip": 3,
    "delay": 1.5,
    "use": -0.5,
    "ignore": -1
}

COST_PER_PORTION = 0.23 # Average cost of a snus portion in euros

ALPHA = 0.1 # Learning rate for Q-learning updates
GAMMA = 0.9 # Discount factor for future rewards in Q-learning updates

EPSILON_START = 0.60
EPSILON_END = 0.05

Q_TABLE = {}


# -----------------------------
# 2. Contexts / hidden triggers
# -----------------------------

CONTEXTS = [
    "after_meal",
    "social_setting",
    "studying",
    "alcohol_context",
    "morning_craving",
    "sleeping"
]

CONTEXT_RISK = {
    "after_meal": 0.15,
    "social_setting": 0.20,
    "studying": 0.10,
    "alcohol_context": 0.25,
    "morning_craving": 0.20,
    "sleeping": 0.18
}

OBSERVABLE_SIGNALS = {
    "time_of_day": ["morning", "midday", "afternoon", "evening", "night"],
    "location_type": ["home", "university", "restaurant", "bar", "social_place", "unknown"],
    "time_since_meal": ["0_30_min", "30_90_min", "90_plus_min"]
}

CONTEXT_SIGNAL_MODEL = {
    "after_meal": {
        "time_of_day": {"morning": 0.15, "midday": 0.35, "afternoon": 0.15, "evening": 0.30, "night": 0.05},
        "location_type": {"home": 0.45, "restaurant": 0.40, "university": 0.05, "bar": 0.02, "social_place": 0.03, "unknown": 0.05},
        "time_since_meal": {"0_30_min": 0.70, "30_90_min": 0.20, "90_plus_min": 0.10}
    },

    "social_setting": {
        "time_of_day": {"morning": 0.05, "midday": 0.15, "afternoon": 0.25, "evening": 0.40, "night": 0.15},
        "location_type": {"home": 0.15, "restaurant": 0.15, "university": 0.10, "bar": 0.15, "social_place": 0.40, "unknown": 0.05},
        "time_since_meal": {"0_30_min": 0.25, "30_90_min": 0.35, "90_plus_min": 0.40}
    },

    "studying": {
        "time_of_day": {"morning": 0.20, "midday": 0.30, "afternoon": 0.35, "evening": 0.10, "night": 0.05},
        "location_type": {"home": 0.25, "restaurant": 0.02, "university": 0.65, "bar": 0.01, "social_place": 0.02, "unknown": 0.05},
        "time_since_meal": {"0_30_min": 0.15, "30_90_min": 0.35, "90_plus_min": 0.50}
    },

    "alcohol_context": {
        "time_of_day": {"morning": 0.01, "midday": 0.03, "afternoon": 0.10, "evening": 0.50, "night": 0.36},
        "location_type": {"home": 0.10, "restaurant": 0.10, "university": 0.01, "bar": 0.55, "social_place": 0.20, "unknown": 0.04},
        "time_since_meal": {"0_30_min": 0.20, "30_90_min": 0.35, "90_plus_min": 0.45}
    },

    "morning_craving": {
        "time_of_day": {"morning": 0.75, "midday": 0.10, "afternoon": 0.05, "evening": 0.05, "night": 0.05},
        "location_type": {"home": 0.75, "restaurant": 0.02, "university": 0.10, "bar": 0.01, "social_place": 0.02, "unknown": 0.10},
        "time_since_meal": {"0_30_min": 0.10, "30_90_min": 0.20, "90_plus_min": 0.70}
    },

    "sleeping": {
        "time_of_day": {"morning": 0.10, "midday": 0.02, "afternoon": 0.03, "evening": 0.10, "night": 0.75},
        "location_type": {"home": 0.85, "restaurant": 0.01, "university": 0.02, "bar": 0.01, "social_place": 0.01, "unknown": 0.10},
        "time_since_meal": {"0_30_min": 0.05, "30_90_min": 0.20, "90_plus_min": 0.75}
    }
}

# -----------------------------
# 3. Psychology-informed user groups
# -----------------------------

USER_TYPES = {
    "High relapse risk / high intake": {
        "baseline_use": (10, 16),
        "motivation": (0.3, 0.6),
        "addiction": (0.8, 1.0),
        "stress": (0.6, 1.0),
        "adherence": (0.3, 0.6),
        "self_efficacy": (0.2, 0.5)
    },
    "High relapse risk / low intake": {
        "baseline_use": (3, 7),
        "motivation": (0.3, 0.7),
        "addiction": (0.6, 0.9),
        "stress": (0.7, 1.0),
        "adherence": (0.4, 0.7),
        "self_efficacy": (0.2, 0.6)
    },
    "Low relapse risk / high intake": {
        "baseline_use": (8, 13),
        "motivation": (0.7, 1.0),
        "addiction": (0.5, 0.8),
        "stress": (0.2, 0.6),
        "adherence": (0.6, 0.9),
        "self_efficacy": (0.6, 0.9)
    },
    "Low relapse risk / low intake": {
        "baseline_use": (2, 6),
        "motivation": (0.7, 1.0),
        "addiction": (0.2, 0.5),
        "stress": (0.2, 0.5),
        "adherence": (0.7, 1.0),
        "self_efficacy": (0.6, 1.0)
    }
}