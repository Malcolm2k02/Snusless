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
    "studying",
    "alcohol_context",
    "morning_craving",
    "sleeping",
    "commuting",
    "break_between_tasks",
    "friends_hangout"
]

CONTEXT_RISK = {
    "after_meal": 0.15,
    "studying": 0.10,
    "alcohol_context": 0.25,
    "morning_craving": 0.20,
    "sleeping": 0.18,
    "commuting": 0.12,
    "break_between_tasks": 0.14,
    "friends_hangout": 0.18
}

OBSERVABLE_SIGNALS = {
    "time_of_day": ["morning", "midday", "afternoon", "evening", "night"],
    "location_type": [
        "home",
        "university",
        "restaurant",
        "bar",
        "social_place",
        "transit",
        "unknown"
    ],
    "time_since_meal": ["0_30_min", "30_90_min", "90_plus_min"],
    "day_type": ["weekday", "weekend"],
    "movement_level": ["stationary", "walking", "commuting"],
    "phone_activity": ["low", "medium", "high"]
}

CONTEXT_SIGNAL_MODEL = {
    "after_meal": {
        "time_of_day": {
            "morning": 0.15,
            "midday": 0.35,
            "afternoon": 0.15,
            "evening": 0.30,
            "night": 0.05
        },
        "location_type": {
            "home": 0.42,
            "university": 0.04,
            "restaurant": 0.42,
            "bar": 0.02,
            "social_place": 0.03,
            "transit": 0.01,
            "unknown": 0.06
        },
        "time_since_meal": {
            "0_30_min": 0.75,
            "30_90_min": 0.20,
            "90_plus_min": 0.05
        },
        "day_type": {
            "weekday": 0.65,
            "weekend": 0.35
        },
        "movement_level": {
            "stationary": 0.75,
            "walking": 0.20,
            "commuting": 0.05
        },
        "phone_activity": {
            "low": 0.35,
            "medium": 0.45,
            "high": 0.20
        }
    },

    "studying": {
        "time_of_day": {
            "morning": 0.22,
            "midday": 0.30,
            "afternoon": 0.34,
            "evening": 0.10,
            "night": 0.04
        },
        "location_type": {
            "home": 0.25,
            "university": 0.65,
            "restaurant": 0.02,
            "bar": 0.01,
            "social_place": 0.02,
            "transit": 0.01,
            "unknown": 0.04
        },
        "time_since_meal": {
            "0_30_min": 0.12,
            "30_90_min": 0.34,
            "90_plus_min": 0.54
        },
        "day_type": {
            "weekday": 0.85,
            "weekend": 0.15
        },
        "movement_level": {
            "stationary": 0.85,
            "walking": 0.12,
            "commuting": 0.03
        },
        "phone_activity": {
            "low": 0.45,
            "medium": 0.40,
            "high": 0.15
        }
    },

    "alcohol_context": {
        "time_of_day": {
            "morning": 0.01,
            "midday": 0.03,
            "afternoon": 0.08,
            "evening": 0.50,
            "night": 0.38
        },
        "location_type": {
            "home": 0.08,
            "university": 0.01,
            "restaurant": 0.08,
            "bar": 0.58,
            "social_place": 0.20,
            "transit": 0.01,
            "unknown": 0.04
        },
        "time_since_meal": {
            "0_30_min": 0.18,
            "30_90_min": 0.35,
            "90_plus_min": 0.47
        },
        "day_type": {
            "weekday": 0.20,
            "weekend": 0.80
        },
        "movement_level": {
            "stationary": 0.55,
            "walking": 0.35,
            "commuting": 0.10
        },
        "phone_activity": {
            "low": 0.20,
            "medium": 0.40,
            "high": 0.40
        }
    },

    "morning_craving": {
        "time_of_day": {
            "morning": 0.78,
            "midday": 0.08,
            "afternoon": 0.04,
            "evening": 0.05,
            "night": 0.05
        },
        "location_type": {
            "home": 0.78,
            "university": 0.07,
            "restaurant": 0.02,
            "bar": 0.01,
            "social_place": 0.01,
            "transit": 0.02,
            "unknown": 0.09
        },
        "time_since_meal": {
            "0_30_min": 0.08,
            "30_90_min": 0.17,
            "90_plus_min": 0.75
        },
        "day_type": {
            "weekday": 0.65,
            "weekend": 0.35
        },
        "movement_level": {
            "stationary": 0.70,
            "walking": 0.20,
            "commuting": 0.10
        },
        "phone_activity": {
            "low": 0.50,
            "medium": 0.35,
            "high": 0.15
        }
    },

    "sleeping": {
        "time_of_day": {
            "morning": 0.08,
            "midday": 0.02,
            "afternoon": 0.03,
            "evening": 0.10,
            "night": 0.77
        },
        "location_type": {
            "home": 0.88,
            "university": 0.01,
            "restaurant": 0.01,
            "bar": 0.01,
            "social_place": 0.01,
            "transit": 0.01,
            "unknown": 0.07
        },
        "time_since_meal": {
            "0_30_min": 0.05,
            "30_90_min": 0.20,
            "90_plus_min": 0.75
        },
        "day_type": {
            "weekday": 0.55,
            "weekend": 0.45
        },
        "movement_level": {
            "stationary": 0.92,
            "walking": 0.06,
            "commuting": 0.02
        },
        "phone_activity": {
            "low": 0.80,
            "medium": 0.15,
            "high": 0.05
        }
    },

    "commuting": {
        "time_of_day": {
            "morning": 0.42,
            "midday": 0.08,
            "afternoon": 0.18,
            "evening": 0.25,
            "night": 0.07
        },
        "location_type": {
            "home": 0.05,
            "university": 0.05,
            "restaurant": 0.02,
            "bar": 0.01,
            "social_place": 0.02,
            "transit": 0.78,
            "unknown": 0.07
        },
        "time_since_meal": {
            "0_30_min": 0.20,
            "30_90_min": 0.35,
            "90_plus_min": 0.45
        },
        "day_type": {
            "weekday": 0.82,
            "weekend": 0.18
        },
        "movement_level": {
            "stationary": 0.15,
            "walking": 0.25,
            "commuting": 0.60
        },
        "phone_activity": {
            "low": 0.25,
            "medium": 0.45,
            "high": 0.30
        }
    },

    "break_between_tasks": {
        "time_of_day": {
            "morning": 0.18,
            "midday": 0.32,
            "afternoon": 0.36,
            "evening": 0.10,
            "night": 0.04
        },
        "location_type": {
            "home": 0.18,
            "university": 0.62,
            "restaurant": 0.03,
            "bar": 0.00,
            "social_place": 0.02,
            "transit": 0.03,
            "unknown": 0.12
        },
        "time_since_meal": {
            "0_30_min": 0.08,
            "30_90_min": 0.42,
            "90_plus_min": 0.50
        },
        "day_type": {
            "weekday": 0.92,
            "weekend": 0.08
        },
        "movement_level": {
            "stationary": 0.55,
            "walking": 0.40,
            "commuting": 0.05
        },
        "phone_activity": {
            "low": 0.10,
            "medium": 0.35,
            "high": 0.55
        }
    },

    "friends_hangout": {
        "time_of_day": {
            "morning": 0.02,
            "midday": 0.08,
            "afternoon": 0.18,
            "evening": 0.52,
            "night": 0.20
        },
        "location_type": {
            "home": 0.12,
            "university": 0.03,
            "restaurant": 0.12,
            "bar": 0.05,
            "social_place": 0.65,
            "transit": 0.01,
            "unknown": 0.02
        },
        "time_since_meal": {
            "0_30_min": 0.12,
            "30_90_min": 0.38,
            "90_plus_min": 0.50
        },
        "day_type": {
            "weekday": 0.20,
            "weekend": 0.80
        },
        "movement_level": {
            "stationary": 0.40,
            "walking": 0.55,
            "commuting": 0.05
        },
        "phone_activity": {
            "low": 0.18,
            "medium": 0.45,
            "high": 0.37
        }
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