"""Unsmooth observed-data plots; each function returns a Figure."""
import matplotlib.pyplot as plt
from evaluation import trigger_confusion


def consumption_plot(conditions):
    fig, ax = plt.subplots(figsize=(10, 6))
    for name, df in conditions.items():
        daily = df[df.observed_today].groupby("day").snus_used.mean()
        ax.plot(daily.index, daily.values, label=name)
    ax.set(xlabel="Simulation day", ylabel="Portions per observed user-day",
           title="Daily consumption (observed data; no imputation or smoothing)")
    ax.legend()
    fig.tight_layout()
    return fig


def grouped_plot(df, value, group, title, ylabel, observed_only=True):
    source = df[df.observed_today] if observed_only else df
    series = source.groupby(["day", group])[value].mean().unstack(group)
    fig, ax = plt.subplots(figsize=(10, 6))
    series.plot(ax=ax)
    ax.set(title=title, xlabel="Simulation day", ylabel=ylabel)
    fig.tight_layout()
    return fig



def cumulative_savings_plot(df):
    # Sum observed contributions over time, with a fixed enrolled denominator.
    enrolled = df.groupby("user_type").user_id.nunique()
    daily_totals = df.groupby(["day", "user_type"]).money_saved.sum().unstack("user_type")
    cumulative = daily_totals.cumsum().divide(enrolled, axis="columns")
    fig, ax = plt.subplots(figsize=(10, 6))
    cumulative.plot(ax=ax)
    ax.set(xlabel="Simulation day", ylabel="Observed euros per enrolled user",
           title="Cumulative observed savings (post-dropout savings unknown)")
    fig.tight_layout()
    return fig


def confusion_plot(events):
    matrix = trigger_confusion(events)
    fig, ax = plt.subplots(figsize=(10, 8))
    image = ax.imshow(matrix, vmin=0, vmax=1)
    ax.set_xticks(range(len(matrix.columns)), matrix.columns, rotation=45, ha="right")
    ax.set_yticks(range(len(matrix.index)), matrix.index)
    ax.set(xlabel="Inferred trigger", ylabel="Signal-generating trigger", title="Event inference (absent classes shown as zero)")
    fig.colorbar(image, ax=ax, label="Row proportion")
    fig.tight_layout()
    return fig


def make_all_plots(baseline, adaptive, adaptive_events):
    sustained = adaptive.copy()
    sustained["sustained"] = sustained.abstinence_streak.fillna(0) >= 14
    return {
        "consumption": consumption_plot({"Tracking-only": baseline, "Adaptive": adaptive}),
        "consumption_by_type": grouped_plot(adaptive, "snus_used", "user_type", "Observed consumption by user type", "Portions per observed user-day"),
        "retention": grouped_plot(adaptive, "active", "user_type", "End-of-day retention", "Fraction of enrolled users", False),
        "strategy_retention": grouped_plot(adaptive, "active", "strategy", "Retention by assigned strategy", "Fraction of enrolled users", False),
        "fatigue": grouped_plot(adaptive, "fatigue", "user_type", "Fatigue among observed users", "Mean fatigue"),
        "daily_savings": grouped_plot(adaptive, "money_saved", "user_type", "Observed daily savings relative to initial use", "Euros per observed user-day"),
        "cumulative_savings": cumulative_savings_plot(adaptive),
        "inference": confusion_plot(adaptive_events),
        "abstinence": grouped_plot(sustained, "sustained", "user_type", "14 consecutive observed zero-use days (missing counted as unsuccessful)", "Fraction of enrolled users", False),
    }
