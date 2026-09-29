"""Command-line training and independent replicated evaluation."""
import argparse
import json
import platform
import importlib.metadata
import config
from pathlib import Path
import pandas as pd
from config import NUDGES
from simulation import simulate, STRATEGIES
from policy import QLearningPolicy, FixedPolicy, RandomPolicy
from evaluation import summarize, trigger_accuracy, aggregate_runs


def run_experiment(train_users=3000, users=1000, days=30, seeds=(123, 124, 125), strategy="mixed"):
    metrics, example = [], None
    for seed in seeds:
        policy = QLearningPolicy()
        simulate(train_users, days, training_mode=True, policy=policy, seed=seed + 1000000, strategy=strategy)
        policies = {"tracking_only": FixedPolicy(), "adaptive": policy, "random": RandomPolicy()}
        policies.update({f"fixed_{action}": FixedPolicy(action) for action in NUDGES if action != "no_intervention"})
        runs = {}
        for condition, candidate in policies.items():
            daily, events = simulate(users, days, policy=candidate, seed=seed, strategy=strategy)
            metrics.append(dict(seed=seed, condition=condition, **summarize(daily), trigger_accuracy=trigger_accuracy(events)))
            runs[condition] = (daily, events)
        if example is None:
            example = runs
    return pd.DataFrame(metrics), example


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-users", type=int, default=3000)
    parser.add_argument("--users", type=int, default=1000)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--seeds", type=int, nargs="+", default=[123, 124, 125])
    parser.add_argument("--strategy", choices=["mixed", *STRATEGIES], default="mixed")
    parser.add_argument("--output", type=Path, default=Path("results"))
    parser.add_argument("--plots", action="store_true")
    args = parser.parse_args(argv)
    if min(args.train_users, args.users, args.days) < 1:
        parser.error("user counts and days must be positive")
    if len(set(args.seeds)) != len(args.seeds):
        parser.error("seeds must be distinct")
    metrics, runs = run_experiment(args.train_users, args.users, args.days, args.seeds, args.strategy)
    args.output.mkdir(parents=True, exist_ok=True)
    metadata = {
        "python": platform.python_version(),
        "dependencies": {name: importlib.metadata.version(name) for name in ("numpy", "pandas", "matplotlib")},
        "arguments": {key: str(value) if isinstance(value, Path) else value for key, value in vars(args).items()},
        "configuration": {key: value for key, value in vars(config).items() if key.isupper()},
    }
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    metrics.to_csv(args.output / "metrics.csv", index=False)
    summary = aggregate_runs(metrics)
    summary.to_csv(args.output / "summary.csv")
    print(summary[["final_day_use", "dropout_rate", "mean_daily_nudges"]].to_string())
    for name, (daily, events) in runs.items():
        daily.to_csv(args.output / f"{name}_first_seed_daily.csv", index=False)
        events.to_csv(args.output / f"{name}_first_seed_events.csv", index=False)
    if args.plots:
        import matplotlib.pyplot as plt
        from plots import make_all_plots
        figures = make_all_plots(runs["tracking_only"][0], *runs["adaptive"])
        for name, figure in figures.items():
            figure.savefig(args.output / f"{name}.png", dpi=150)
            plt.close(figure)


if __name__ == "__main__":
    main()
