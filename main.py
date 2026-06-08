from simulation import simulate
from evaluation import summarize, print_random_q_values, trigger_accuracy
from plots import make_all_plots
from config import Q_TABLE
import numpy as np
import random

"""Main file to run the snus cessation intervention simulation, including training the Q-learning algorithm, evaluating results, and generating plots."""

Q_TABLE.clear()

training, training_events = simulate(
    n_users=3000,
    days=30,
    algorithm=True,
    training_mode=True
)

random.seed(123)
np.random.seed(123)

adaptive, adaptive_events = simulate(
    n_users=1000,
    days=30,
    algorithm=True,
    training_mode=False
)

random.seed(123)
np.random.seed(123)

baseline, baseline_events = simulate(
    n_users=1000,
    days=30,
    algorithm=False,
    training_mode=False
)

summarize(baseline, "Tracking-only baseline")
summarize(adaptive, "Psychology-informed adaptive recommender")

print_random_q_values()
trigger_accuracy(adaptive_events)

make_all_plots(baseline, adaptive, adaptive_events)