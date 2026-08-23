"""Feature extraction, schema flattening, and domain feature engineering for student profiles and job descriptions."""

import logging
from typing import Any, Dict, List
import config

logger = logging.getLogger(__name__)


def flatten_student_features(student_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Flattens nested student JSON into a 1D tabular dictionary with engineered domain scores.

    Handles academic, experience, project, skills, coding, certifications, online presence,
    and resume metadata sections with composite scoring.

    Args:
        student_dict: Nested student profile matching students.json schema.

    Returns:
        Flat dictionary of scalar, categorical, and engineered composite features.
    """
    academic = student_dict.get("academic", {}) or {}
    experience = student_dict.get("experience", {}) or {}
    projects = student_dict.get("projects", {}) or {}
    skills = student_dict.get("skills", {}) or {}
    coding = student_dict.get("coding", {}) or {}
    certifications = student_dict.get("certifications", {}) or {}
    online = student_dict.get("online_presence", {}) or {}
    resume = student_dict.get("resume_metadata", {}) or {}

    # Category skill count breakdowns
    prog_lang = skills.get("programming_languages", []) or []
    frameworks = skills.get("frameworks", []) or []
    databases = skills.get("databases", []) or []
    cloud = skills.get("cloud", []) or []
    devops = skills.get("devops", []) or []
    ml_skills = skills.get("machine_learning", []) or []

    total_technical_skills = (
        len(prog_lang) + len(frameworks) + len(databases) +
        len(cloud) + len(devops) + len(ml_skills)
    )

    # Missing value handling for codeforces
    cf_rating_raw = coding.get("codeforces_rating")
    codeforces_data_available = cf_rating_raw is not None
    codeforces_rating = (
        float(cf_rating_raw) if codeforces_data_available else config.DEFAULT_CODEFORCES_RATING
    )

    # Base scalar extractions
    cgpa = float(academic.get("cgpa", 0.0))
    tenth_percentage = float(academic.get("tenth_percentage", 0.0))
    twelfth_percentage = float(academic.get("twelfth_percentage", 0.0))
    backlog_count = int(academic.get("backlog_count", 0))
    active_backlog_count = int(academic.get("active_backlog_count", 0))

    internship_count = int(experience.get("internship_count", 0))
    total_internship_months = int(experience.get("total_internship_months", 0))
    relevant_internship_count = int(experience.get("relevant_internship_count", 0))
    work_exp_count = int(experience.get("work_experience_count", 0))
    total_work_months = int(experience.get("total_work_experience_months", 0))
    relevant_work_months = int(experience.get("relevant_work_experience_months", 0))

    project_count = int(projects.get("project_count", 0))
    major_project_count = int(projects.get("major_project_count", 0))
    relevant_project_count = int(projects.get("relevant_project_count", 0))
    deployed_project_count = int(projects.get("deployed_project_count", 0))
    github_project_count = int(projects.get("github_project_count", 0))
    has_ml_project = bool(projects.get("has_ml_project", False))
    has_web_project = bool(projects.get("has_web_project", False))
    has_final_year_project = bool(projects.get("has_final_year_project", False))

    leetcode_solved = int(coding.get("leetcode_problems_solved", 0))
    leetcode_avail = bool(coding.get("leetcode_data_available", False))
    hackathon_count = int(coding.get("hackathon_count", 0))
    coding_comp_count = int(coding.get("coding_competition_count", 0))

    cert_count = int(certifications.get("certification_count", 0))
    rel_cert_count = int(certifications.get("relevant_certification_count", 0))
    has_cloud_cert = bool(certifications.get("has_cloud_certification", False))
    has_ml_cert = bool(certifications.get("has_ml_certification", False))

    has_github = bool(online.get("has_github", False))
    has_linkedin = bool(online.get("has_linkedin", False))
    has_portfolio = bool(online.get("has_portfolio", False))

    resume_word_count = int(resume.get("resume_word_count", 0))
    resume_page_count = int(resume.get("resume_page_count", 1))
    has_proj_sec = bool(resume.get("has_projects_section", False))
    has_exp_sec = bool(resume.get("has_experience_section", False))
    has_ach_sec = bool(resume.get("has_achievements_section", False))

    # ========================================================
    # Engineered Domain & Interaction Features
    # ========================================================
    academic_consistency_score = (
        (cgpa * 10.0 * 0.5) + (twelfth_percentage * 0.25) + (tenth_percentage * 0.25)
    ) / 100.0

    coding_strength_index = (
        (min(leetcode_solved, 800) / 400.0 * 0.45) +
        ((codeforces_rating / 1600.0) * 0.30 if codeforces_data_available else 0.15) +
        (min(hackathon_count, 5) * 0.15) +
        (min(coding_comp_count, 5) * 0.10)
    )

    practical_experience_score = (
        (relevant_internship_count * 2.0) +
        (total_internship_months * 0.3) +
        (deployed_project_count * 1.5) +
        (relevant_project_count * 1.0) +
        (major_project_count * 0.8)
    )

    online_brand_score = (
        (1.0 if has_github else 0.0) +
        (1.0 if has_linkedin else 0.0) +
        (1.5 if has_portfolio else 0.0)
    )

    features: Dict[str, Any] = {
        # Identifiers
        "student_id": str(student_dict.get("student_id", "")),

        # Academic
        "cgpa": cgpa,
        "tenth_percentage": tenth_percentage,
        "twelfth_percentage": twelfth_percentage,
        "backlog_count": backlog_count,
        "active_backlog_count": active_backlog_count,
        "degree_type": str(academic.get("degree_type", "Unknown")),
        "branch": str(academic.get("branch", "Unknown")),
        "graduation_year": int(academic.get("graduation_year", 2025)),

        # Experience
        "internship_count": internship_count,
        "total_internship_months": total_internship_months,
        "relevant_internship_count": relevant_internship_count,
        "work_experience_count": work_exp_count,
        "total_work_experience_months": total_work_months,
        "relevant_work_experience_months": relevant_work_months,

        # Projects
        "project_count": project_count,
        "major_project_count": major_project_count,
        "relevant_project_count": relevant_project_count,
        "deployed_project_count": deployed_project_count,
        "github_project_count": github_project_count,
        "has_ml_project": has_ml_project,
        "has_web_project": has_web_project,
        "has_final_year_project": has_final_year_project,

        # Skill Counts
        "total_technical_skills": total_technical_skills,
        "programming_language_count": len(prog_lang),
        "framework_count": len(frameworks),
        "database_skill_count": len(databases),
        "cloud_skill_count": len(cloud),
        "devops_skill_count": len(devops),
        "machine_learning_skill_count": len(ml_skills),

        # Coding Activity
        "leetcode_problems_solved": leetcode_solved,
        "leetcode_data_available": leetcode_avail,
        "codeforces_rating": codeforces_rating,
        "codeforces_data_available": codeforces_data_available,
        "hackathon_count": hackathon_count,
        "coding_competition_count": coding_comp_count,

        # Certifications
        "certification_count": cert_count,
        "relevant_certification_count": rel_cert_count,
        "has_cloud_certification": has_cloud_cert,
        "has_ml_certification": has_ml_cert,

        # Online Presence
        "has_github": has_github,
        "has_linkedin": has_linkedin,
        "has_portfolio": has_portfolio,

        # Resume Metadata
        "resume_word_count": resume_word_count,
        "resume_page_count": resume_page_count,
        "has_projects_section": has_proj_sec,
        "has_experience_section": has_exp_sec,
        "has_achievements_section": has_ach_sec,

        # High-signal Engineered Domain Scores
        "academic_consistency_score": round(float(academic_consistency_score), 4),
        "coding_strength_index": round(float(coding_strength_index), 4),
        "practical_experience_score": round(float(practical_experience_score), 4),
        "online_brand_score": round(float(online_brand_score), 4),
    }

    return features


def flatten_jd_features(jd_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Flattens nested Job Description (JD) JSON into a feature dictionary.

    Args:
        jd_dict: Nested job description matching jds.json schema.

    Returns:
        Flat dictionary of extracted JD features.
    """
    eligibility = jd_dict.get("eligibility", {}) or {}
    required_skills = jd_dict.get("required_skills", {}) or {}
    exp_req = jd_dict.get("experience_requirement", {}) or {}
    company_meta = jd_dict.get("company_metadata", {}) or {}

    must_have = required_skills.get("must_have", []) or []
    good_to_have = required_skills.get("good_to_have", []) or []

    min_cgpa = float(eligibility.get("min_cgpa", config.DEFAULT_MIN_CGPA))
    historical_hire_rate = float(company_meta.get("historical_hire_rate", 0.20))
    avg_hired_cgpa = float(company_meta.get("avg_hired_cgpa", 7.5))

    features: Dict[str, Any] = {
        "jd_id": str(jd_dict.get("jd_id") or jd_dict.get("company_id", "")),
        "company_name": str(jd_dict.get("company_name", "Unknown")),
        "role_title": str(jd_dict.get("role_title", "Unknown")),
        "role_category": str(jd_dict.get("role_category", "Software Engineering")),
        "min_cgpa": min_cgpa,
        "max_active_backlogs_allowed": int(
            eligibility.get("max_active_backlogs_allowed", config.DEFAULT_MAX_BACKLOGS)
        ),
        "must_have_skill_count": len(must_have),
        "good_to_have_skill_count": len(good_to_have),
        "min_internship_months_preferred": int(exp_req.get("min_internship_months_preferred", 0)),
        "fresher_eligible": bool(exp_req.get("fresher_eligible", True)),
        "historical_hire_rate": historical_hire_rate,
        "avg_hired_cgpa": avg_hired_cgpa,
        "company_size": str(company_meta.get("company_size", "Mid-Size")),
        "sector": str(company_meta.get("sector", "IT Services")),
        # Company bar competitiveness
        "company_competitiveness_index": round(float((1.0 - historical_hire_rate) * (avg_hired_cgpa / 10.0)), 4)
    }

    return features
