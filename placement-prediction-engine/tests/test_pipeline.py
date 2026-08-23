"""Pytest unit tests for feature engineering, semantic matching, and eligibility gating."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from feature_engineering import flatten_jd_features, flatten_student_features
from jd_matching import check_eligibility, compute_jd_match_features, normalize_skill


@pytest.fixture
def sample_student():
    """Returns a realistic student dictionary."""
    return {
        "student_id": "STU_001",
        "academic": {
            "cgpa": 8.7,
            "tenth_percentage": 92.0,
            "twelfth_percentage": 89.5,
            "backlog_count": 0,
            "active_backlog_count": 0,
            "degree_type": "B.Tech",
            "branch": "CSE",
            "graduation_year": 2025,
        },
        "experience": {
            "internship_count": 2,
            "total_internship_months": 6,
            "relevant_internship_count": 2,
            "work_experience_count": 0,
            "total_work_experience_months": 0,
            "relevant_work_experience_months": 0,
        },
        "projects": {
            "project_count": 5,
            "major_project_count": 2,
            "relevant_project_count": 3,
            "deployed_project_count": 2,
            "github_project_count": 4,
            "has_ml_project": True,
            "has_web_project": True,
            "has_final_year_project": True,
        },
        "skills": {
            "programming_languages": ["Python", "JavaScript", "SQL"],
            "frameworks": ["React", "FastAPI"],
            "databases": ["PostgreSQL", "Redis"],
            "cloud": ["AWS"],
            "devops": ["Docker", "Git"],
            "machine_learning": ["Scikit-learn", "Pandas"],
        },
        "coding": {
            "leetcode_problems_solved": 400,
            "leetcode_data_available": True,
            "codeforces_rating": None,  # Test null imputation
            "hackathon_count": 3,
            "coding_competition_count": 2,
        },
        "certifications": {
            "certification_count": 2,
            "relevant_certification_count": 1,
            "has_cloud_certification": True,
            "has_ml_certification": False,
        },
        "online_presence": {
            "has_github": True,
            "has_linkedin": True,
            "has_portfolio": True,
        },
        "resume_metadata": {
            "resume_word_count": 550,
            "resume_page_count": 1,
            "has_projects_section": True,
            "has_experience_section": True,
            "has_achievements_section": True,
        },
    }


@pytest.fixture
def sample_jd():
    """Returns a realistic JD dictionary."""
    return {
        "jd_id": "JD_TIER1_01",
        "company_name": "Acme Tech",
        "role_title": "Backend Engineer",
        "role_category": "Software Engineering",
        "eligibility": {
            "min_cgpa": 7.5,
            "max_active_backlogs_allowed": 0,
            "eligible_branches": ["CSE", "IT", "AI-DS"],
            "eligible_degree_types": ["B.Tech", "BE"],
        },
        "required_skills": {
            "must_have": ["Python", "ReactJS", "PostgreSQL"],
            "good_to_have": ["AWS", "Docker", "Kubernetes"],
        },
        "experience_requirement": {
            "min_internship_months_preferred": 3,
            "fresher_eligible": True,
        },
        "company_metadata": {
            "sector": "Product",
            "company_size": "Enterprise",
            "historical_hire_rate": 0.12,
            "avg_hired_cgpa": 8.4,
        },
    }


def test_flatten_student_features(sample_student):
    """Verifies student flattening and codeforces null fallback."""
    features = flatten_student_features(sample_student)
    assert features["student_id"] == "STU_001"
    assert features["cgpa"] == 8.7
    assert features["codeforces_data_available"] is False
    assert features["codeforces_rating"] == 1000.0  # Imputed default
    assert features["total_technical_skills"] == 12


def test_flatten_student_empty():
    """Verifies edge case handling for empty student object."""
    features = flatten_student_features({})
    assert features["cgpa"] == 0.0
    assert features["total_technical_skills"] == 0
    assert features["leetcode_problems_solved"] == 0


def test_skill_normalization():
    """Verifies case insensitivity and synonym canonicalization."""
    assert normalize_skill("ReactJS") == "react"
    assert normalize_skill("  Node.js  ") == "node.js"
    assert normalize_skill("k8s") == "kubernetes"
    assert normalize_skill("") == ""


def test_jd_matching(sample_student, sample_jd):
    """Verifies skill match percentages, missing must-have detection, and embedding similarity."""
    match = compute_jd_match_features(sample_student["skills"], sample_jd["required_skills"])
    # React matched via ReactJS synonym
    assert match["required_skill_match_percentage"] == 100.0
    assert match["must_have_skills_missing_count"] == 0
    # Good to have: AWS, Docker present; Kubernetes missing -> 2/3
    assert match["optional_skill_match_percentage"] == pytest.approx(66.67, rel=1e-2)
    assert match["jd_overall_similarity_score"] > 0.60


def test_eligibility_checks(sample_student, sample_jd):
    """Verifies eligibility criteria pass and fail scenarios."""
    # Pass
    eligible, reason = check_eligibility(sample_student, sample_jd)
    assert eligible is True
    assert reason == "Eligible"

    # Fail: CGPA
    sample_student["academic"]["cgpa"] = 7.1
    eligible, reason = check_eligibility(sample_student, sample_jd)
    assert eligible is False
    assert "below minimum requirement" in reason

    # Fail: Active Backlogs
    sample_student["academic"]["cgpa"] = 8.7
    sample_student["academic"]["active_backlog_count"] = 1
    eligible, reason = check_eligibility(sample_student, sample_jd)
    assert eligible is False
    assert "Active backlogs" in reason

    # Fail: Branch
    sample_student["academic"]["active_backlog_count"] = 0
    sample_student["academic"]["branch"] = "Civil"
    eligible, reason = check_eligibility(sample_student, sample_jd)
    assert eligible is False
    assert "not in eligible branches" in reason
