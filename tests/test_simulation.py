"""Regression checks for the experimental design, inference and learning boundaries."""
import copy
import importlib
import random
import unittest
from unittest.mock import patch
import pandas as pd
from pandas.testing import assert_frame_equal
from config import CONTEXTS, CONTEXT_SIGNAL_MODEL, OBSERVABLE_SIGNALS, NUDGES
from inference import BeliefEstimator
from policy import FixedPolicy, QLearningPolicy, RandomPolicy
from simulation import simulate
from user import User
from evaluation import summarize, trigger_accuracy, trigger_confusion
from utils import observe_context_signals


class SimulationTests(unittest.TestCase):
    def test_baseline_is_exactly_no_intervention(self):
        baseline = simulate(20, 8, algorithm=False, seed=4)
        fixed = simulate(20, 8, policy=FixedPolicy(), seed=4)
        for left, right in zip(baseline, fixed):
            assert_frame_equal(left, right)
        self.assertGreater(baseline[0].groupby("user_id").motivation.nunique().max(), 1)

    def test_training_reproducibility_and_frozen_evaluation(self):
        policies = [QLearningPolicy(), QLearningPolicy()]
        for policy in policies:
            simulate(15, 5, policy=policy, training_mode=True, seed=12)
        self.assertEqual(policies[0].q_table, policies[1].q_table)
        before = copy.deepcopy(policies[0].q_table)
        simulate(20, 6, policy=policies[0], seed=99)
        self.assertEqual(before, policies[0].q_table)
        random.seed(982)
        first = simulate(8, 4, policy=RandomPolicy(), seed=8)
        random.seed(101)
        second = simulate(8, 4, policy=RandomPolicy(), seed=8)
        assert_frame_equal(first[0], second[0])
        assert_frame_equal(first[1], second[1])

    def test_terminal_target_does_not_bootstrap(self):
        policy = QLearningPolicy(alpha=1, gamma=0.9)
        policy.q_table["next"] = dict.fromkeys(NUDGES, 100)
        policy.update("current", "no_intervention", -2, "next", terminal=True)
        self.assertEqual(policy.q_table["current"]["no_intervention"], -2)

    def test_dropout_and_horizon_end_learning_episodes(self):
        policy = QLearningPolicy()
        with patch.object(User, "check_dropout", lambda user: setattr(user, "active", False)), patch.object(policy, "update", wraps=policy.update) as update:
            daily, _ = simulate(1, 3, policy=policy, training_mode=True)
        self.assertTrue(update.call_args.args[4])
        self.assertLess(update.call_args.args[2], 0)
        self.assertTrue(daily.iloc[0].observed_today)
        self.assertFalse(daily.iloc[0].active)
        self.assertTrue(pd.isna(daily.iloc[1].fatigue))
        self.assertEqual(summarize(daily)["observed_user_days"], 1)
        policy = QLearningPolicy()
        with patch.object(policy, "update", wraps=policy.update) as update:
            simulate(1, 1, policy=policy, training_mode=True)
        self.assertTrue(update.call_args.args[4])

    def test_next_state_uses_next_observation(self):
        policy = QLearningPolicy()
        with patch.object(policy, "update", wraps=policy.update) as update:
            _, events = simulate(1, 1, policy=policy, training_mode=True)
        self.assertEqual(len(update.call_args_list), len(events))
        for call, event in zip(update.call_args_list[:-1], events.iloc[1:].itertuples()):
            self.assertEqual(call.args[3][1], event.inferred_trigger)

    def test_current_observation_is_used_before_policy(self):
        class RecordingPolicy:
            def choose(self, state, rng, epsilon=0):
                self.state = state
                return "no_intervention"
        policy = RecordingPolicy()
        signals = {"location_type": "bar", "time_of_day": "night"}
        expected = BeliefEstimator()
        expected.observe(signals)
        with patch("simulation.observe_context_signals", return_value=("alcohol_context", signals)):
            _, events = simulate(1, 1, policy=policy)
        self.assertEqual(events.iloc[0].inferred_trigger, expected.most_likely())
        self.assertEqual(events.iloc[0].signal_trigger, "alcohol_context")

    def test_zero_likelihood_does_not_destroy_future_prior(self):
        belief = BeliefEstimator()
        belief.observe({"location_type": "bar"})
        self.assertEqual(belief.posterior["break_between_tasks"], 0)
        belief.observe({"location_type": "university", "phone_activity": "high"})
        self.assertGreater(belief.posterior["break_between_tasks"], 0)
        self.assertAlmostEqual(sum(belief.posterior.values()), 1)

    def test_signal_target_matches_generating_trigger(self):
        triggers = ["after_meal", "studying"]
        rng = random.Random(1)
        observed_sources = set()
        for _ in range(50):
            source, signals = observe_context_signals(triggers, rng)
            observed_sources.add(source)
            self.assertIn(source, triggers)
            for name, value in signals.items():
                self.assertGreater(CONTEXT_SIGNAL_MODEL[source][name][value], 0)
        self.assertEqual(observed_sources, set(triggers))
        events = pd.DataFrame({"signal_trigger": ["studying"], "inferred_trigger": ["studying"]})
        self.assertEqual(trigger_accuracy(events), 1)
        self.assertEqual(trigger_confusion(events).shape, (len(CONTEXTS), len(CONTEXTS)))

    def test_strategy_and_accounting(self):
        daily, events = simulate(30, 6, policy=RandomPolicy(), strategy="cold_turkey")
        self.assertEqual(set(daily.strategy), {"cold_turkey"})
        observed = daily[daily.observed_today]
        event_use = events.assign(use=events.response != "skip").groupby(["user_id", "day"]).use.sum()
        for row in observed.itertuples():
            self.assertEqual(row.snus_used, event_use.get((row.user_id, row.day), 0))
        self.assertEqual(summarize(daily)["final_day"], 6)

    def test_abstinence_and_relapse_are_recorded(self):
        with patch.object(User, "check_abstinence", lambda user, used: setattr(user, "abstinent", True)), patch.object(User, "check_dropout", lambda user: None), patch.object(User, "check_relapse_from_abstinence", return_value=False):
            daily, _ = simulate(1, 16)
        self.assertTrue(daily.iloc[0].entered_abstinence)
        self.assertEqual(daily.iloc[-1].abstinence_streak, 15)
        self.assertEqual(summarize(daily)["final_sustained_abstinence_fraction"], 1)
        def relapse(user):
            user.abstinent = False
            return True
        with patch.object(User, "check_abstinence", lambda user, used: setattr(user, "abstinent", True)), patch.object(User, "check_dropout", lambda user: None), patch.object(User, "check_relapse_from_abstinence", relapse):
            daily, _ = simulate(1, 3)
        self.assertEqual(daily.relapsed.sum(), 2)

    def test_observation_model_is_valid(self):
        for model in CONTEXT_SIGNAL_MODEL.values():
            self.assertEqual(set(model), set(OBSERVABLE_SIGNALS))
            for name, probabilities in model.items():
                self.assertEqual(set(probabilities), set(OBSERVABLE_SIGNALS[name]))
                self.assertAlmostEqual(sum(probabilities.values()), 1)
                self.assertTrue(all(p >= 0 for p in probabilities.values()))

    def test_empty_events_and_unobserved_final_day(self):
        events = pd.DataFrame(columns=["signal_trigger", "inferred_trigger"])
        self.assertTrue(pd.isna(trigger_accuracy(events)))
        self.assertEqual(trigger_confusion(events).to_numpy().sum(), 0)
        with self.assertRaises(ValueError):
            simulate(0, 1)

    def test_waiting_days_discount_future_values(self):
        policy = QLearningPolicy(alpha=1, gamma=0.5)
        policy.q_table["next"] = dict.fromkeys(NUDGES, 8)
        policy.update("current", "no_intervention", 2, "next", elapsed=3)
        self.assertEqual(policy.q_table["current"]["no_intervention"], 3)

    def test_abstinent_days_add_discounted_reward(self):
        policy = QLearningPolicy(gamma=0.5)
        with patch.object(User, "respond_to_nudge", return_value="skip"), patch.object(User, "check_abstinence", lambda user, used: setattr(user, "abstinent", True)), patch.object(User, "check_dropout", lambda user: None), patch.object(User, "check_relapse_from_abstinence", return_value=False), patch.object(policy, "update", wraps=policy.update) as update:
            simulate(1, 3, policy=policy, training_mode=True)
        # Terminal transition includes day-one bonus plus discounted waiting days.
        reward = update.call_args.args[2]
        self.assertIn(reward, (0.5 + 1 + 0.5 + 0.25, 3 + 1 + 0.5 + 0.25))
        self.assertTrue(update.call_args.args[4])

    def test_import_main_does_not_run_experiment(self):
        with patch("simulation.simulate", side_effect=AssertionError("Import ran simulation")):
            import main
            importlib.reload(main)
        importlib.reload(main)


if __name__ == "__main__":
    unittest.main()
