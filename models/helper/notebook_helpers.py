"""Notebook-focused plotting and evaluation helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import cross_val_score


def save_and_show(fig, out_path: Path, dpi: int = 140) -> None:
    fig.tight_layout()
    fig.savefig(out_path, dpi=dpi, bbox_inches="tight")
    plt.show()


def plot_per_column_distribution(
    frame: pd.DataFrame,
    save_path: Path,
    skew_threshold: float,
    color: str = "#3498db",
) -> list[str]:
    numeric_cols = frame.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return []
    n = len(numeric_cols)
    ncols = 3
    nrows = int(np.ceil(n / ncols))
    fig, axes = plt.subplots(nrows=nrows, ncols=ncols, figsize=(6 * ncols, 4 * nrows))
    axes = np.array(axes).reshape(-1)

    skew_flags: list[str] = []
    for i, col in enumerate(numeric_cols):
        ax = axes[i]
        series = pd.to_numeric(frame[col], errors="coerce").dropna()
        sns.histplot(series, kde=True, ax=ax, color=color)
        skew = float(series.skew()) if len(series) > 2 else 0.0
        ax.set_title(f"Distribution: {col}")
        ax.set_xlabel(col)
        ax.set_ylabel("Count")
        ax.text(0.02, 0.95, f"skew={skew:.2f}", transform=ax.transAxes, va="top")
        if abs(skew) > skew_threshold:
            skew_flags.append(col)

    for j in range(i + 1, len(axes)):
        axes[j].axis("off")

    plt.tight_layout()
    plt.savefig(save_path, dpi=140, bbox_inches="tight")
    plt.show()
    return skew_flags


def plot_correlation_matrix(frame: pd.DataFrame, cols: list[str], title: str, save_path: Path):
    corr = frame[cols].corr(numeric_only=True)
    mask = np.triu(np.ones_like(corr, dtype=bool))
    plt.figure(figsize=(12, 9))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", mask=mask)
    plt.title(title)
    plt.xlabel("Features")
    plt.ylabel("Features")
    plt.tight_layout()
    plt.savefig(save_path, dpi=140, bbox_inches="tight")
    plt.show()
    return corr


def plot_scatter_matrix(frame: pd.DataFrame, target_col: str, top_k: int, save_path: Path) -> list[str]:
    numeric_cols = [c for c in frame.select_dtypes(include=[np.number]).columns if c != target_col]
    var_ranked = frame[numeric_cols].var().sort_values(ascending=False)
    top_cols = var_ranked.head(top_k).index.tolist()
    pp = sns.pairplot(frame[top_cols + [target_col]].dropna(), hue=target_col, diag_kind="kde")
    pp.fig.suptitle("Pairplot (Top variance features)", y=1.02)
    pp.savefig(save_path, dpi=140)
    plt.show()
    return top_cols


def fit_iqr_bounds(frame: pd.DataFrame, cols: list[str], factor: float = 3.0) -> dict[str, tuple[float, float]]:
    bounds: dict[str, tuple[float, float]] = {}
    for col in cols:
        s = pd.to_numeric(frame[col], errors="coerce").dropna()
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        bounds[col] = (float(q1 - factor * iqr), float(q3 + factor * iqr))
    return bounds


def apply_bounds(frame: pd.DataFrame, bounds: dict[str, tuple[float, float]]) -> pd.DataFrame:
    out = frame.copy()
    for col, (lo, hi) in bounds.items():
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce").clip(lo, hi)
    return out


def build_feature_weight_series(columns: list[str], key_terms: list[str]) -> pd.Series:
    w = pd.Series(1.0, index=columns)
    for c in columns:
        if any(k in c.lower() for k in key_terms):
            w.loc[c] = 0.5
    return w


def log_shape(name: str, value: Any) -> None:
    print(f"{name}: {getattr(value, 'shape', None)}")


def evaluate_split(name: str, model, X_tr, y_tr_e, X_te, y_te_e, label_encoder, cv):
    cv_scores = cross_val_score(model, X_tr, y_tr_e, cv=cv, scoring="f1_macro", n_jobs=-1)
    y_pred = model.predict(X_te)
    acc = accuracy_score(y_te_e, y_pred)
    f1m = f1_score(y_te_e, y_pred, average="macro")
    print("=" * 72)
    print(name)
    print("5-fold CV macro F1 (train):", np.round(cv_scores, 4), "mean:", round(cv_scores.mean(), 4))
    print("Hold-out accuracy:", round(acc, 4), "| macro F1:", round(f1m, 4))
    print(classification_report(y_te_e, y_pred, target_names=label_encoder.classes_))
    cm = confusion_matrix(y_te_e, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=label_encoder.classes_,
        yticklabels=label_encoder.classes_,
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title(f"{name} - confusion matrix (test)")
    plt.tight_layout()
    plt.show()
    return {"cv_f1_macro_mean": cv_scores.mean(), "accuracy": acc, "f1_macro": f1m}
