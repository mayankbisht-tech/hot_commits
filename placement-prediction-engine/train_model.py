"""Stage 2: Advanced XGBoost tuning, probability calibration, threshold optimization, and SHAP explainability."""

import json
import logging
from typing import Any, Dict, List, Tuple
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from xgboost import XGBClassifier
import config

logger = logging.getLogger(__name__)

EXCLUDED_COLUMNS: List[str] = [
    "student_id",
    "jd_id",
    "company_name",
    "role_title",
    config.TARGET_COLUMN,
    "placement_probability_ground_truth",
    "split",
]


def prepare_matrices(
    train_df: pd.DataFrame, 
    val_df: pd.DataFrame, 
    test_df: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, List[str]]:
    """Extracts feature matrices and target vectors."""
    feature_cols = [c for c in train_df.columns if c not in EXCLUDED_COLUMNS]

    X_train, y_train = train_df[feature_cols], train_df[config.TARGET_COLUMN]
    X_val, y_val = val_df[feature_cols], val_df[config.TARGET_COLUMN]
    X_test, y_test = test_df[feature_cols], test_df[config.TARGET_COLUMN]

    return X_train, y_train, X_val, y_val, X_test, y_test, feature_cols


def find_optimal_threshold(y_val_true: np.ndarray, y_val_probs: np.ndarray) -> float:
    """Finds decision threshold maximizing validation F1-score."""
    precisions, recalls, thresholds = precision_recall_curve(y_val_true, y_val_probs)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
    best_idx = int(np.argmax(f1_scores))
    best_threshold = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.50
    # Keep threshold bounded within realistic decision range
    return float(np.clip(best_threshold, 0.20, 0.65))


def train_and_tune_model(X_train: pd.DataFrame, y_train: pd.Series) -> XGBClassifier:
    """Performs comprehensive RandomizedSearchCV on XGBClassifier for optimal generalization."""
    logger.info("Executing comprehensive hyperparameter optimization for XGBoost...")

    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    natural_scale_pos_weight = float(neg_count / max(pos_count, 1))

    base_model = XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        enable_categorical=True,
        random_state=config.RANDOM_SEED,
        tree_method="hist",
    )

    param_distributions = {
        "n_estimators": [200, 300, 450, 600],
        "max_depth": [3, 4, 5, 6, 7],
        "learning_rate": [0.015, 0.03, 0.05, 0.08, 0.12],
        "subsample": [0.70, 0.80, 0.90, 1.0],
        "colsample_bytree": [0.65, 0.75, 0.85, 0.95],
        "min_child_weight": [1, 2, 3, 5],
        "gamma": [0.0, 0.1, 0.2, 0.5],
        "reg_alpha": [0.0, 0.1, 0.5, 1.5],
        "reg_lambda": [1.0, 2.0, 4.0, 7.0],
        "scale_pos_weight": [1.0, 1.5, natural_scale_pos_weight * 0.8, natural_scale_pos_weight],
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_SEED)

    search = RandomizedSearchCV(
        estimator=base_model,
        param_distributions=param_distributions,
        n_iter=60,
        scoring="roc_auc",
        cv=cv,
        verbose=1,
        random_state=config.RANDOM_SEED,
        n_jobs=-1,
    )

    search.fit(X_train, y_train)
    logger.info("Best CV ROC-AUC: %.4f", search.best_score_)
    logger.info("Best Hyperparameters: %s", search.best_params_)

    return search.best_estimator_


def calibrate_and_tune_threshold(
    model: XGBClassifier, 
    X_val: pd.DataFrame, 
    y_val: pd.Series
) -> Tuple[CalibratedClassifierCV, float]:
    """Fits probability calibrator on validation split and determines optimal decision threshold."""
    logger.info("Fitting probability calibration on validation split...")
    calibrator = CalibratedClassifierCV(estimator=model, method="sigmoid", cv="prefit")
    calibrator.fit(X_val, y_val)

    val_probs = calibrator.predict_proba(X_val)[:, 1]
    optimal_threshold = find_optimal_threshold(y_val.to_numpy(), val_probs)
    logger.info("Optimal F1 classification threshold: %.4f", optimal_threshold)

    return calibrator, optimal_threshold


def evaluate_pipeline(
    calibrator: CalibratedClassifierCV, 
    X_test: pd.DataFrame, 
    y_test: pd.Series,
    decision_threshold: float
) -> Dict[str, Any]:
    """Evaluates performance using calibrated probabilities and the optimized decision threshold."""
    logger.info("Evaluating calibrated pipeline with optimal threshold %.4f on test set...", decision_threshold)
    y_pred_proba = calibrator.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= decision_threshold).astype(int)

    roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    acc = float(accuracy_score(y_test, y_pred))
    brier = float(brier_score_loss(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    prob_true, prob_pred = calibration_curve(y_test, y_pred_proba, n_bins=10)

    report = {
        "roc_auc": round(roc_auc, 4),
        "f1_score": round(f1, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "accuracy": round(acc, 4),
        "brier_score": round(brier, 4),
        "optimal_threshold": round(decision_threshold, 4),
        "confusion_matrix": cm,
        "calibration_curve": {
            "prob_true": [round(float(x), 4) for x in prob_true],
            "prob_pred": [round(float(x), 4) for x in prob_pred],
        },
    }

    logger.info(
        "Fine-Tuned Metrics -> ROC-AUC: %.4f | F1: %.4f | Precision: %.4f | Recall: %.4f | Accuracy: %.4f",
        roc_auc, f1, precision, recall, acc
    )
    return report


def generate_shap_artifacts(
    model: XGBClassifier, 
    X_test: pd.DataFrame
) -> shap.TreeExplainer:
    """Generates SHAP summary and importance plots."""
    logger.info("Generating SHAP feature attributions...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_test)

    # Summary Plot
    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_test, show=False)
    plt.tight_layout()
    plt.savefig(config.SHAP_SUMMARY_PLOT_PATH, dpi=300)
    plt.close()

    # Bar Plot
    plt.figure(figsize=(10, 8))
    shap.plots.bar(shap_values, show=False)
    plt.tight_layout()
    plt.savefig(config.SHAP_BAR_PLOT_PATH, dpi=300)
    plt.close()

    logger.info("SHAP plots saved to %s and %s", config.SHAP_SUMMARY_PLOT_PATH, config.SHAP_BAR_PLOT_PATH)
    return explainer


def run_training_pipeline(
    train_df: pd.DataFrame, 
    val_df: pd.DataFrame, 
    test_df: pd.DataFrame
) -> None:
    """Executes the full model training, calibration, evaluation, and serialization workflow."""
    X_train, y_train, X_val, y_val, X_test, y_test, feature_cols = prepare_matrices(
        train_df, val_df, test_df
    )

    base_model = train_and_tune_model(X_train, y_train)
    calibrator, optimal_thresh = calibrate_and_tune_threshold(base_model, X_val, y_val)
    report = evaluate_pipeline(calibrator, X_test, y_test, optimal_thresh)
    explainer = generate_shap_artifacts(base_model, X_test)

    try:
        model_payload = {
            "model": base_model,
            "feature_names": feature_cols,
            "optimal_threshold": optimal_thresh
        }
        joblib.dump(model_payload, config.MODEL_PATH)
        joblib.dump(calibrator, config.CALIBRATOR_PATH)
        joblib.dump(explainer, config.EXPLAINER_PATH)

        # Save native XGBoost JSON model for cross-version compatibility
        json_model_path = config.ARTIFACTS_DIR / "placement_model.json"
        base_model.save_model(str(json_model_path))

        metadata_path = config.ARTIFACTS_DIR / "model_metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump({
                "feature_names": feature_cols,
                "optimal_threshold": optimal_thresh
            }, f, indent=2)

        with open(config.TRAINING_REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        logger.info("Model artifacts and training report successfully saved.")
    except Exception as e:
        logger.error("Failed saving model artifacts: %s", e)
        raise
