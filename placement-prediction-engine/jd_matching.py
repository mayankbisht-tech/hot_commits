"""Stage 1: Semantic sentence embedding matching and strict eligibility checking."""

import functools
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
import config

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """Lazily loads and caches the SentenceTransformer embedding model."""
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        logger.info("Initializing SentenceTransformer: %s", config.EMBEDDING_MODEL_NAME)
        _EMBEDDING_MODEL = SentenceTransformer(config.EMBEDDING_MODEL_NAME)
    return _EMBEDDING_MODEL


def normalize_skill(skill: str) -> str:
    """Standardizes skill strings by lowercasing, stripping punctuation, and resolving synonyms.

    Args:
        skill: Raw skill string.

    Returns:
        Canonical skill string.
    """
    if not skill or not isinstance(skill, str):
        return ""
    clean = skill.lower().strip()
    clean = re.sub(r"[\s\-_]+", " ", clean)
    return config.SKILL_SYNONYMS.get(clean, clean)


def extract_all_student_skills(student_skills: Dict[str, List[str]]) -> Set[str]:
    """Extracts, normalizes, and dedupes all skills across student skill categories.

    Args:
        student_skills: Dictionary of skill categories to list of skill strings.

    Returns:
        Set of normalized skill tokens.
    """
    normalized_set: Set[str] = set()
    if not student_skills:
        return normalized_set

    for _, skill_list in student_skills.items():
        if isinstance(skill_list, list):
            for s in skill_list:
                cleaned = normalize_skill(s)
                if cleaned:
                    normalized_set.add(cleaned)
    return normalized_set


@functools.lru_cache(maxsize=10000)
def _cached_encode_text(text: str) -> bytes:
    """Encodes a skill string and caches the raw bytes for high throughput."""
    model = get_embedding_model()
    vec = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return vec.tobytes()


def compute_skill_embeddings(skill_list: List[str]) -> np.ndarray:
    """Encodes a skill sequence into a normalized dense embedding vector with LRU caching.

    Args:
        skill_list: List of skill strings.

    Returns:
        1D numpy array representing the L2-normalized embedding vector.
    """
    sorted_skills = sorted(list(set(skill_list)))
    text = ", ".join(sorted_skills) if sorted_skills else "none"
    raw_bytes = _cached_encode_text(text)
    return np.frombuffer(raw_bytes, dtype=np.float32)


def compute_jd_match_features(
    student_skills_dict: Dict[str, List[str]], 
    jd_required_skills_dict: Dict[str, List[str]]
) -> Dict[str, Any]:
    """Computes Stage 1 matching metrics: semantic cosine similarity, must-have/good-to-have overlap.

    Args:
        student_skills_dict: Categorized student skills dictionary.
        jd_required_skills_dict: Dictionary containing 'must_have' and 'good_to_have' lists.

    Returns:
        Dictionary containing semantic similarity score, match percentages, and missing skills.
    """
    student_skills_set = extract_all_student_skills(student_skills_dict)

    raw_must_have = jd_required_skills_dict.get("must_have", []) or []
    raw_good_to_have = jd_required_skills_dict.get("good_to_have", []) or []

    norm_must_have = [normalize_skill(s) for s in raw_must_have if normalize_skill(s)]
    norm_good_to_have = [normalize_skill(s) for s in raw_good_to_have if normalize_skill(s)]

    # Exact & Normalized Overlap
    must_have_matched = [s for s in norm_must_have if s in student_skills_set]
    missing_must_have = [
        raw for raw, norm in zip(raw_must_have, norm_must_have) if norm not in student_skills_set
    ]
    good_to_have_matched = [s for s in norm_good_to_have if s in student_skills_set]

    req_match_pct = (len(must_have_matched) / len(norm_must_have) * 100.0) if norm_must_have else 100.0
    opt_match_pct = (len(good_to_have_matched) / len(norm_good_to_have) * 100.0) if norm_good_to_have else 100.0

    # Semantic Cosine Similarity
    student_vec = compute_skill_embeddings(list(student_skills_set))
    all_jd_skills = norm_must_have + norm_good_to_have
    jd_vec = compute_skill_embeddings(all_jd_skills)

    # Dot product equals cosine similarity for normalized vectors
    similarity = float(np.clip(np.dot(student_vec, jd_vec), 0.0, 1.0))

    return {
        "jd_overall_similarity_score": round(similarity, 4),
        "required_skill_match_percentage": round(req_match_pct, 2),
        "optional_skill_match_percentage": round(opt_match_pct, 2),
        "must_have_skills_missing_count": len(missing_must_have),
        "missing_must_have_skills": missing_must_have,
    }


def check_eligibility(student_json: Dict[str, Any], jd_json: Dict[str, Any]) -> Tuple[bool, str]:
    """Checks hard eligibility rules (min CGPA, active backlogs, eligible branches, degrees).

    Args:
        student_json: Raw student profile JSON.
        jd_json: Raw JD JSON.

    Returns:
        Tuple of (is_eligible: bool, reason_message: str).
    """
    academic = student_json.get("academic", {}) or {}
    eligibility = jd_json.get("eligibility", {}) or {}

    # CGPA cutoff check
    student_cgpa = float(academic.get("cgpa", 0.0))
    min_cgpa = float(eligibility.get("min_cgpa", 0.0))
    if student_cgpa < min_cgpa:
        return False, f"CGPA {student_cgpa:.2f} is below minimum requirement of {min_cgpa:.2f}"

    # Backlog limit check
    student_active_backlogs = int(academic.get("active_backlog_count", 0))
    max_backlogs = int(eligibility.get("max_active_backlogs_allowed", 0))
    if student_active_backlogs > max_backlogs:
        return (
            False,
            f"Active backlogs ({student_active_backlogs}) exceeds maximum allowed ({max_backlogs})",
        )

    # Branch eligibility check
    eligible_branches = [b.strip().upper() for b in eligibility.get("eligible_branches", []) if b]
    student_branch = str(academic.get("branch", "")).strip().upper()
    if eligible_branches and student_branch not in eligible_branches:
        return False, f"Branch '{student_branch}' is not in eligible branches: {eligible_branches}"

    # Degree eligibility check
    eligible_degrees = [d.strip().upper() for d in eligibility.get("eligible_degree_types", []) if d]
    student_degree = str(academic.get("degree_type", "")).strip().upper()
    if eligible_degrees and student_degree not in eligible_degrees:
        return False, f"Degree '{student_degree}' is not in eligible degrees: {eligible_degrees}"

    return True, "Eligible"
