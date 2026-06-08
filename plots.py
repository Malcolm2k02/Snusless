import matplotlib.pyplot as plt
import pandas as pd

"""File for generating plots to visualize the results of the snus cessation intervention simulation, including comparisons between the adaptive recommender and baseline conditions, as well as analyses by user type and inferred triggers."""

def make_all_plots(baseline, adaptive, adaptive_events):
    """
    Generates publication-style plots for the snus cessation simulation.
    """
    plt.rcParams.update({
        "figure.figsize": (10, 5.8),
        "axes.grid": True,
        "grid.alpha": 0.25,
        "grid.linestyle": "--",
        "font.size": 11,
        "axes.titlesize": 14,
        "axes.labelsize": 12,
        "legend.fontsize": 9,
        "legend.title_fontsize": 10,
        "axes.spines.top": False,
        "axes.spines.right": False
    })

    def clean_label(label):
        return str(label).replace("_", " ").replace("/", " / ").title()

    def finish_plot(title, xlabel, ylabel, legend_title=None, ylim=None):
        plt.title(title, fontweight="bold", pad=12)
        plt.xlabel(xlabel)
        plt.ylabel(ylabel)

        if ylim is not None:
            plt.ylim(*ylim)

        if legend_title is not None:
            plt.legend(title=legend_title, frameon=True)
        else:
            plt.legend(frameon=True)

        plt.tight_layout()
        plt.show()

    def smooth_series(df, value_col, group_col=None, window=3):
        df = df.copy()

        if group_col is None:
            df[f"{value_col}_smoothed"] = (
                df[value_col]
                .rolling(window=window, min_periods=1)
                .mean()
            )
        else:
            df[f"{value_col}_smoothed"] = (
                df
                .groupby(group_col)[value_col]
                .transform(lambda x: x.rolling(window=window, min_periods=1).mean())
            )

        return df

    baseline_active = baseline[baseline["active"] == True].copy()
    adaptive_active = adaptive[adaptive["active"] == True].copy()

    # ------------------------------------------------------------
    # Plot 1: Baseline vs adaptive recommender
    # ------------------------------------------------------------

    baseline_daily = (
        baseline_active
        .groupby("day")["snus_used"]
        .mean()
        .reset_index()
    )

    adaptive_daily = (
        adaptive_active
        .groupby("day")["snus_used"]
        .mean()
        .reset_index()
    )

    baseline_daily = smooth_series(baseline_daily, "snus_used")
    adaptive_daily = smooth_series(adaptive_daily, "snus_used")

    plt.figure()
    plt.plot(
        baseline_daily["day"],
        baseline_daily["snus_used_smoothed"],
        linewidth=2.8,
        label="Tracking-only baseline"
    )
    plt.plot(
        adaptive_daily["day"],
        adaptive_daily["snus_used_smoothed"],
        linewidth=2.8,
        label="Adaptive recommender"
    )

    finish_plot(
        title="Average Daily Snus Use Over Time",
        xlabel="Simulation day",
        ylabel="Average snus portions per active user",
        legend_title="Condition"
    )

        # ------------------------------------------------------------
    # Plot 2: Adaptive effect by user type, last observation carried forward
    # ------------------------------------------------------------

    adaptive_loccf = adaptive.copy()

    adaptive_loccf["snus_used_filled"] = (
        adaptive_loccf
        .sort_values(["user_id", "day"])
        .groupby("user_id")["snus_used"]
        .ffill()
    )

    adaptive_by_type = (
        adaptive_loccf
        .groupby(["day", "user_type"])["snus_used_filled"]
        .mean()
        .reset_index()
    )

    adaptive_by_type = smooth_series(
        adaptive_by_type,
        value_col="snus_used_filled",
        group_col="user_type"
    )

    plt.figure(figsize=(11, 6))

    for user_type in adaptive_by_type["user_type"].unique():
        subset = adaptive_by_type[adaptive_by_type["user_type"] == user_type]

        plt.plot(
            subset["day"],
            subset["snus_used_filled_smoothed"],
            linewidth=2.4,
            label=clean_label(user_type)
        )

    finish_plot(
        title="Adaptive Recommender Effect by User Type",
        xlabel="Simulation day",
        ylabel="Average daily snus portions per user",
        legend_title="User type"
    )
    # ------------------------------------------------------------
    # Plot 3: Retention by user type
    # ------------------------------------------------------------

    retention_by_type = (
        adaptive
        .groupby(["day", "user_type"])["active"]
        .mean()
        .reset_index()
    )

    retention_by_type = smooth_series(
        retention_by_type,
        value_col="active",
        group_col="user_type"
    )

    plt.figure(figsize=(11, 6))
    for user_type in retention_by_type["user_type"].unique():
        subset = retention_by_type[retention_by_type["user_type"] == user_type]

        plt.plot(
            subset["day"],
            subset["active_smoothed"],
            linewidth=2.4,
            label=clean_label(user_type)
        )

    finish_plot(
        title="User Retention Over Time by User Type",
        xlabel="Simulation day",
        ylabel="Proportion of users still active",
        legend_title="User type",
        ylim=(0, 1.05)
    )

    # ------------------------------------------------------------
    # Plot 4: Retention by quitting strategy
    # ------------------------------------------------------------

    retention_by_strategy = (
        adaptive
        .groupby(["day", "strategy"])["active"]
        .mean()
        .reset_index()
    )

    retention_by_strategy = smooth_series(
        retention_by_strategy,
        value_col="active",
        group_col="strategy"
    )

    plt.figure()
    for strategy in retention_by_strategy["strategy"].unique():
        subset = retention_by_strategy[retention_by_strategy["strategy"] == strategy]

        plt.plot(
            subset["day"],
            subset["active_smoothed"],
            linewidth=2.8,
            label=clean_label(strategy)
        )

    finish_plot(
        title="Retention by Quitting Strategy",
        xlabel="Simulation day",
        ylabel="Proportion of users still active",
        legend_title="Strategy",
        ylim=(0, 1.05)
    )

    # ------------------------------------------------------------
    # Plot 5: Intervention fatigue by user type
    # ------------------------------------------------------------

    fatigue_by_type = (
        adaptive
        .groupby(["day", "user_type"])["fatigue"]
        .mean()
        .reset_index()
    )

    fatigue_by_type = smooth_series(
        fatigue_by_type,
        value_col="fatigue",
        group_col="user_type"
    )

    plt.figure(figsize=(11, 6))
    for user_type in fatigue_by_type["user_type"].unique():
        subset = fatigue_by_type[fatigue_by_type["user_type"] == user_type]

        plt.plot(
            subset["day"],
            subset["fatigue_smoothed"],
            linewidth=2.4,
            label=clean_label(user_type)
        )

    finish_plot(
        title="Intervention Fatigue by User Type",
        xlabel="Simulation day",
        ylabel="Average fatigue",
        legend_title="User type",
        ylim=(0, 1.05)
    )

    # ------------------------------------------------------------
    # Plot 6: Cumulative money saved by user type
    # ------------------------------------------------------------

    money_daily_by_type = (
        adaptive_active
        .groupby(["day", "user_type"])["money_saved"]
        .mean()
        .reset_index()
    )

    money_daily_by_type["cumulative_money_saved"] = (
        money_daily_by_type
        .groupby("user_type")["money_saved"]
        .cumsum()
    )

    plt.figure(figsize=(11, 6))
    for user_type in money_daily_by_type["user_type"].unique():
        subset = money_daily_by_type[money_daily_by_type["user_type"] == user_type]

        plt.plot(
            subset["day"],
            subset["cumulative_money_saved"],
            linewidth=2.4,
            label=clean_label(user_type)
        )

    finish_plot(
        title="Cumulative Estimated Money Saved by User Type",
        xlabel="Simulation day",
        ylabel="Cumulative average money saved per active user (€)",
        legend_title="User type"
    )

    # ------------------------------------------------------------
    # Plot 7: Distribution of inferred triggers
    # ------------------------------------------------------------

    trigger_counts = (
        adaptive_active["inferred_trigger"]
        .value_counts()
        .sort_values(ascending=True)
    )

    plt.figure(figsize=(10, 5.8))
    plt.barh(
        [clean_label(trigger) for trigger in trigger_counts.index],
        trigger_counts.values
    )

    plt.title("Distribution of Inferred Triggers", fontweight="bold", pad=12)
    plt.xlabel("Number of active user-day observations")
    plt.ylabel("Inferred trigger")
    plt.tight_layout()
    plt.show()

    # ------------------------------------------------------------
    # Plot 8: Adaptive effect by inferred trigger
    # ------------------------------------------------------------

    trigger_effect = (
        adaptive_active
        .groupby(["day", "inferred_trigger"])["snus_used"]
        .mean()
        .reset_index()
    )

    trigger_effect = smooth_series(
        trigger_effect,
        value_col="snus_used",
        group_col="inferred_trigger"
    )

    plt.figure(figsize=(11, 6))
    for trigger in trigger_effect["inferred_trigger"].unique():
        subset = trigger_effect[trigger_effect["inferred_trigger"] == trigger]

        plt.plot(
            subset["day"],
            subset["snus_used_smoothed"],
            linewidth=2.2,
            label=clean_label(trigger)
        )

    finish_plot(
        title="Adaptive Recommender Effect by Inferred Trigger",
        xlabel="Simulation day",
        ylabel="Average snus portions per active user",
        legend_title="Inferred trigger"
    )

    # ------------------------------------------------------------
    # Plot 9: Trigger inference confusion matrix
    # ------------------------------------------------------------

    confusion = pd.crosstab(
        adaptive_events["actual_primary_trigger"],
        adaptive_events["inferred_trigger"],
        normalize="index"
    )

    plt.figure(figsize=(9.5, 7))
    image = plt.imshow(confusion, aspect="auto")

    plt.xticks(
        range(len(confusion.columns)),
        [clean_label(col) for col in confusion.columns],
        rotation=45,
        ha="right"
    )

    plt.yticks(
        range(len(confusion.index)),
        [clean_label(row) for row in confusion.index]
    )

    plt.title("Event-Level Trigger Inference Accuracy", fontweight="bold", pad=12)
    plt.xlabel("Inferred trigger at craving moment")
    plt.ylabel("Actual primary trigger")

    cbar = plt.colorbar(image)
    cbar.set_label("Proportion")

    for i in range(len(confusion.index)):
        for j in range(len(confusion.columns)):
            value = confusion.iloc[i, j]
            plt.text(
                j,
                i,
                f"{value:.2f}",
                ha="center",
                va="center",
                fontsize=8
            )

    plt.tight_layout()
    plt.show()

        # ------------------------------------------------------------
    # Plot: Sustained abstinence by user type
    # ------------------------------------------------------------

    quit_threshold = 14

    abstinence_df = adaptive.copy()

    abstinence_df["zero_use"] = (
        (abstinence_df["active"] == True) &
        (abstinence_df["snus_used"] == 0)
    )

    abstinence_df["sustained_quit"] = (
        abstinence_df
        .groupby("user_id")["zero_use"]
        .transform(
            lambda x:
            x.rolling(
                window=quit_threshold,
                min_periods=quit_threshold
            ).sum() >= quit_threshold
        )
    )

    sustained_by_type = (
        abstinence_df
        .groupby(["day", "user_type"])["sustained_quit"]
        .mean()
        .reset_index()
    )

    plt.figure(figsize=(11, 6))

    for user_type in sustained_by_type["user_type"].unique():

        subset = sustained_by_type[
            sustained_by_type["user_type"] == user_type
        ].copy()

        subset["sustained_quit_smoothed"] = (
            subset["sustained_quit"]
            .rolling(window=3, min_periods=1)
            .mean()
        )

        plt.plot(
            subset["day"],
            subset["sustained_quit_smoothed"] * 100,
            linewidth=2.5,
            label=user_type
        )

    plt.xlabel("Simulation day")
    plt.ylabel("Users achieving sustained abstinence (%)")
    plt.title(
        f"Sustained Abstinence ({quit_threshold} Consecutive Days Without Snus)"
    )

    plt.legend(title="User type")
    plt.ylim(0, 100)
    plt.tight_layout()
    plt.show()