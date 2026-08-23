"""Inference service for single and batch placement predictions with SHAP factor breakdowns."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
import shap
import config
from dataset_builder import build_candidate_jd_interaction_features
from feature_engineering import flatten_jd_features, flatten_student_features
from jd_matching import check_eligibility, compute_jd_match_features

logger = logging.getLogger(__name__)


class PlacementPredictor:
    """Production predictor that encapsulates model loading, eligibility gating, and explanation generation."""

    def __init__(
        self,
        model_path: Optional[Path] = None,
        calibrator_path: Optional[Path] = None,
        explainer_path: Optional[Path] = None,
    ):
        """Loads serialized model, calibrator, and SHAP explainer artifacts."""
        m_path = model_path or config.MODEL_PATH
        c_path = calibrator_path or config.CALIBRATOR_PATH
        e_path = explainer_path or config.EXPLAINER_PATH

        try:
            model_bundle = joblib.load(m_path)
            self.base_model = model_bundle["model"]
            self.feature_names = model_bundle["feature_names"]
            self.optimal_threshold = model_bundle.get("optimal_threshold", 0.50)
            self.calibrator = joblib.load(c_path)
            self.explainer: shap.TreeExplainer = joblib.load(e_path)
            logger.info("PlacementPredictor initialized successfully.")
        except Exception as e:
            logger.error("Failed to load predictor artifacts: %s", e)
            raise

    def predict_placement_probability(
        self, 
        student_json: Dict[str, Any], 
        jd_json: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Predicts placement probability for a single student-JD pair.

        Short-circuits immediately with 0% probability if candidate is ineligible.

        Args:
            student_json: Single student JSON object.
            jd_json: Single JD JSON object.

        Returns:
            Dictionary matching the output prediction specification.
        """
        student_id = student_json.get("student_id", "UNKNOWN")
        jd_id = str(jd_json.get("jd_id") or jd_json.get("company_id", "UNKNOWN"))
        company_name = str(jd_json.get("company_name", "Unknown Company"))

        # 1. Hard Eligibility Gate
        is_eligible, reason = check_eligibility(student_json, jd_json)

        # Stage 1 Skill matching
        match_info = compute_jd_match_features(
            student_json.get("skills", {}) or {},
            jd_json.get("required_skills", {}) or {}
        )
        missing_skills = match_info.get("missing_must_have_skills", [])

        if not is_eligible:
            return {
                "student_id": student_id,
                "jd_id": jd_id,
                "company_name": company_name,
                "eligible": False,
                "ineligibility_reason": reason,
                "placement_probability": 0.0,
                "predicted_placed": False,
                "top_contributing_factors": [],
                "skill_gap": missing_skills,
            }

        # 2. Flatten & Prepare Features
        flat_stu = flatten_student_features(student_json)
        flat_jd = flatten_jd_features(jd_json)
        interaction_feats = build_candidate_jd_interaction_features(
            flat_stu, flat_jd, match_info, is_eligible
        )

        raw_row = {**flat_stu, **flat_jd, **match_info, **interaction_feats}
        row_dict = {k: v for k, v in raw_row.items() if k != "missing_must_have_skills"}
        row_dict["is_eligible"] = True

        input_df = pd.DataFrame([row_dict])

        for col in config.CATEGORICAL_COLUMNS:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype("category")

        # Align exactly with model feature columns
        X_infer = input_df[self.feature_names]

        # 3. Model Probability Inference
        prob_pred = float(self.calibrator.predict_proba(X_infer)[0][1])
        placement_probability = round(prob_pred * 100.0, 2)
        predicted_placed = bool(prob_pred >= self.optimal_threshold)

        # 4. Top 5 SHAP Factor Attributions
        top_factors: List[Dict[str, Any]] = []
        try:
            shap_values = self.explainer(X_infer)
            vals = shap_values.values[0]
            top_idx = np.argsort(np.abs(vals))[::-1][:5]

            for idx in top_idx:
                top_factors.append({
                    "feature": self.feature_names[idx],
                    "impact": round(float(vals[idx]), 4),
                    "value": str(X_infer.iloc[0, idx]),
                })
        except Exception as e:
            logger.warning("SHAP explanation failed: %s", e)

        return {
            "student_id": student_id,
            "jd_id": jd_id,
            "company_name": company_name,
            "eligible": True,
            "placement_probability": placement_probability,
            "predicted_placed": predicted_placed,
            "top_contributing_factors": top_factors,
            "skill_gap": missing_skills,
        }

    def predict_for_all_jds(
        self, 
        student_json: Dict[str, Any], 
        list_of_jds: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Ranks a list of JDs for a student sorted by placement probability descending.

        Args:
            student_json: Student JSON profile.
            list_of_jds: List of JD JSON objects.

        Returns:
            Ranked list of prediction results.
        """
        predictions: List[Dict[str, Any]] = []
        for jd in list_of_jds:
            res = self.predict_placement_probability(student_json, jd)
            predictions.append(res)

        predictions.sort(key=lambda x: x["placement_probability"], reverse=True)
        return predictions
