"""Metrics retain dropout-day observations and never impute unobserved consumption."""
import pandas as pd
from config import CONTEXTS


def summarize(df, name=None):
    observed = df[df["observed_today"]]
    first, last = df["day"].min(), df["day"].max()
    start = observed.loc[observed.day == first, "snus_used"].mean()
    end = observed.loc[observed.day == last, "snus_used"].mean()
    final = df[df.day == last]
    result = dict(first_day=int(first), final_day=int(last), first_day_use=start, final_day_use=end,
        reduction_percent=100 * (start - end) / start if start > 0 else float("nan"),
        dropout_rate=1 - final.active.mean(), observed_user_days=len(observed),
        mean_daily_use=observed.snus_used.mean(), mean_daily_nudges=observed.nudges_sent.mean(),
        total_observed_money_saved=observed.money_saved.sum(),
        mean_observed_money_saved_per_enrolled_user=observed.money_saved.sum() / df.user_id.nunique(),
        relapse_events=int(df.relapsed.sum()),
        final_sustained_abstinence_fraction=(final.abstinence_streak.fillna(0) >= 14).mean())
    if name:
        print(name)
        print(pd.Series(result).to_string())
    return result


def trigger_accuracy(events):
    return float((events.signal_trigger == events.inferred_trigger).mean()) if len(events) else float("nan")


def trigger_confusion(events):
    if events.empty:
        return pd.DataFrame(0.0, index=CONTEXTS, columns=CONTEXTS)
    return pd.crosstab(events.signal_trigger, events.inferred_trigger, normalize="index").reindex(
        index=CONTEXTS, columns=CONTEXTS, fill_value=0)


def aggregate_runs(metrics):
    """Mean and run-to-run SD; independent replicate is the uncertainty unit."""
    frame = pd.DataFrame(metrics)
    values = [c for c in frame.select_dtypes("number") if c != "seed"]
    return frame.groupby("condition")[values].agg(["mean", "std", "count"])
