"""Merges student profiles, JDs, and placement labels into a ML-ready parquet dataset."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple
import pandas as pd
from sklearn.model_selection import train_test_split
import config
from feature_engineering import flatten_jd_features, flatten_student_features
from jd_matching import check_eligibility, compute_jd_match_features

logger = logging.getLogger(__name__)


def build_candidate_jd_interaction_features(
    flat_stu: Dict[str, Any], 
    flat_jd: Dict[str, Any], 
    match_feats: Dict[str, Any],
    is_eligible: bool
) -> Dict[str, Any]:
    """Generates cross-entity interaction features between student profile and job description."""
    stu_cgpa = float(flat_stu.get("cgpa", 0.0))
    min_cgpa = float(flat_jd.get("min_cgpa", 6.0))
    avg_hired_cgpa = float(flat_jd.get("avg_hired_cgpa", 7.5))
    
    hire_rate = float(flat_jd.get("historical_hire_rate", 0.20))
    req_match_pct = float(match_feats.get("required_skill_match_percentage", 0.0))
    sim_score = float(match_feats.get("jd_overall_similarity_score", 0.0))

    cgpa_margin_over_cutoff = max(0.0, stu_cgpa - min_cgpa) if is_eligible else (stu_cgpa - min_cgpa)
    cgpa_to_avg_hired_ratio = round(stu_cgpa / max(avg_hired_cgpa, 1.0), 4)

    stu_intern_months = int(flat_stu.get("total_internship_months", 0))
    pref_intern_months = int(flat_jd.get("min_internship_months_preferred", 0))
    internship_months_margin = stu_intern_months - pref_intern_months

    # Candidate overall fit interaction
    candidate_fit_index = round(
        (req_match_pct / 100.0 * 0.40) +
        (sim_score * 0.25) +
        (min(cgpa_to_avg_hired_ratio, 1.2) * 0.20) +
        (hire_rate * 0.15),
        4
    ) if is_eligible else 0.0

    return {
        "cgpa_margin_over_cutoff": round(float(cgpa_margin_over_cutoff), 3),
        "cgpa_to_avg_hired_ratio": float(cgpa_to_avg_hired_ratio),
        "internship_months_margin": int(internship_months_margin),
        "candidate_fit_index": float(candidate_fit_index),
    }


def build_training_dataset(
    students: List[Dict[str, Any]], 
    jds: List[Dict[str, Any]], 
    labels: List[Dict[str, Any]]
) -> pd.DataFrame:
    """Builds a flat tabular dataset with Stage 1 match features, interaction features, and target labels.

    Encodes categorical features as pandas 'category' dtype for native XGBoost support.

    Args:
        students: List of student profile JSON objects.
        jds: List of JD JSON objects.
        labels: List of label objects (student_id, jd_id, placed, etc.).

    Returns:
        Structured pandas DataFrame.
    """
    logger.info("Constructing training dataset from %d labels...", len(labels))
    student_map = {s["student_id"]: s for s in students if "student_id" in s}
    jd_map = {j.get("jd_id") or j.get("company_id"): j for j in jds}

    rows: List[Dict[str, Any]] = []

    for lbl in labels:
        stu_id = lbl.get("student_id")
        jd_id = lbl.get("jd_id")

        if stu_id not in student_map or jd_id not in jd_map:
            logger.warning("Skipping pair (%s, %s): Missing student or JD record.", stu_id, jd_id)
            continue

        student_data = student_map[stu_id]
        jd_data = jd_map[jd_id]

        flat_stu = flatten_student_features(student_data)
        flat_jd = flatten_jd_features(jd_data)

        # Stage 1 semantic & exact matching
        match_feats = compute_jd_match_features(
            student_data.get("skills", {}) or {},
            jd_data.get("required_skills", {}) or {}
        )
        match_feats.pop("missing_must_have_skills", None)

        is_eligible, _ = check_eligibility(student_data, jd_data)

        # Candidate-to-JD Cross Interaction Features
        interaction_feats = build_candidate_jd_interaction_features(
            flat_stu, flat_jd, match_feats, is_eligible
        )

        row = {**flat_stu, **flat_jd, **match_feats, **interaction_feats}
        row["is_eligible"] = bool(is_eligible)
        row[config.TARGET_COLUMN] = int(lbl.get("placed", 0))
        row["placement_probability_ground_truth"] = float(
            lbl.get("placement_probability_ground_truth", 0.0)
        )

        rows.append(row)

    df = pd.DataFrame(rows)

    # Cast to categorical dtype for XGBoost enable_categorical=True
    for col in config.CATEGORICAL_COLUMNS:
        if col in df.columns:
            df[col] = df[col].astype("category")

    logger.info("Dataset constructed with shape: %s", df.shape)
    return df


def split_and_save_dataset(
    df: pd.DataFrame, 
    output_path: Path = config.PROCESSED_DATA_PATH
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Splits dataset into stratified Train/Validation/Test sets (70/15/15) and saves to Parquet.

    Args:
        df: Consolidated DataFrame.
        output_path: Target parquet path.

    Returns:
        Tuple of (train_df, val_df, test_df).
    """
    logger.info("Performing stratified 70/15/15 Train-Val-Test split...")
    target = df[config.TARGET_COLUMN]

    train_df, temp_df = train_test_split(
        df,
        test_size=(config.VAL_SPLIT_SIZE + config.TEST_SPLIT_SIZE),
        stratify=target,
        random_state=config.RANDOM_SEED,
    )

    val_ratio = config.VAL_SPLIT_SIZE / (config.VAL_SPLIT_SIZE + config.TEST_SPLIT_SIZE)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - val_ratio),
        stratify=temp_df[config.TARGET_COLUMN],
        random_state=config.RANDOM_SEED,
    )

    logger.info("Split sizes: Train=%d, Val=%d, Test=%d", len(train_df), len(val_df), len(test_df))

    df_persisted = df.copy()
    df_persisted.loc[train_df.index, "split"] = "train"
    df_persisted.loc[val_df.index, "split"] = "val"
    df_persisted.loc[test_df.index, "split"] = "test"

    try:
        df_persisted.to_parquet(output_path, index=False)
        logger.info("Processed dataset persisted to %s", output_path)
    except Exception as e:
        logger.error("Failed to write Parquet file: %s", e)
        raise

    return train_df, val_df, test_df
