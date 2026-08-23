"""Script to generate 1000 realistic synthetic student profiles, 10 diverse JDs, and high-fidelity labeled pairs."""

import json
import random
from pathlib import Path
import numpy as np

random.seed(42)
np.random.seed(42)

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

PROG_LANGUAGES = ["Python", "Java", "C++", "JavaScript", "TypeScript", "C", "Go", "SQL", "Kotlin", "Rust"]
FRAMEWORKS = ["React", "Node.js", "Django", "Flask", "Spring Boot", "FastAPI", "Angular", "Vue", "Express"]
DATABASES = ["MySQL", "MongoDB", "PostgreSQL", "Redis", "Oracle", "Cassandra", "DynamoDB"]
CLOUD = ["AWS", "Azure", "GCP"]
DEVOPS = ["Docker", "Kubernetes", "Jenkins", "Git", "CI/CD", "Terraform"]
ML_SKILLS = ["Scikit-learn", "TensorFlow", "PyTorch", "Pandas", "NumPy", "XGBoost", "HuggingFace", "OpenCV"]

BRANCHES_TECH = ["CSE", "IT", "AI-DS"]
BRANCHES_CIRC = ["ECE", "EEE"]
BRANCHES_NONTECH = ["Mechanical", "Civil", "Chemical"]
ALL_BRANCHES = BRANCHES_TECH + BRANCHES_CIRC + BRANCHES_NONTECH

DEGREE_TYPES = ["B.Tech", "BE", "MCA"]


def generate_students(n: int = 1000):
    students = []
    for i in range(1, n + 1):
        stu_id = f"STU_2025_{i:04d}"
        
        branch_rand = random.random()
        if branch_rand < 0.55:
            branch = random.choice(BRANCHES_TECH)
            is_tech_branch = True
        elif branch_rand < 0.80:
            branch = random.choice(BRANCHES_CIRC)
            is_tech_branch = False
        else:
            branch = random.choice(BRANCHES_NONTECH)
            is_tech_branch = False

        degree = random.choices(DEGREE_TYPES, weights=[0.75, 0.20, 0.05])[0]

        base_ability = np.random.beta(4, 2.5)  # 0 to 1
        cgpa = round(float(np.clip(5.2 + base_ability * 4.6 + np.random.normal(0, 0.25), 5.0, 10.0)), 2)
        tenth_pct = round(float(np.clip(58.0 + base_ability * 38.0 + np.random.normal(0, 2.5), 50.0, 99.5)), 1)
        twelfth_pct = round(float(np.clip(55.0 + base_ability * 40.0 + np.random.normal(0, 3.0), 50.0, 99.0)), 1)

        # Backlogs
        if cgpa > 8.2:
            backlogs = 0
            active_backlogs = 0
        elif cgpa > 7.2:
            backlogs = random.choices([0, 1], weights=[0.88, 0.12])[0]
            active_backlogs = 0 if backlogs == 0 else random.choices([0, 1], weights=[0.85, 0.15])[0]
        elif cgpa > 6.2:
            backlogs = random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0]
            active_backlogs = min(backlogs, random.choices([0, 1], weights=[0.7, 0.3])[0])
        else:
            backlogs = random.randint(1, 5)
            active_backlogs = min(backlogs, random.randint(0, 2))

        # Experience & Internships
        tech_exp_multiplier = 1.3 if is_tech_branch else 0.7
        internship_count = int(np.clip(np.random.poisson(base_ability * 2.0 * tech_exp_multiplier), 0, 5))
        total_intern_months = sum(random.choice([2, 3, 6]) for _ in range(internship_count)) if internship_count > 0 else 0
        total_intern_months = min(total_intern_months, 24)
        relevant_intern_count = random.randint(max(0, internship_count - 1), internship_count) if internship_count > 0 else 0

        work_exp_count = random.choices([0, 1], weights=[0.92, 0.08])[0]
        total_work_months = random.choice([6, 12, 18]) if work_exp_count > 0 else 0
        relevant_work_months = total_work_months if work_exp_count > 0 and is_tech_branch else (total_work_months // 2)

        # Projects
        project_count = int(np.clip(np.random.poisson(2.0 + base_ability * 3.5 * tech_exp_multiplier), 0, 10))
        major_project_count = min(project_count, random.randint(0, min(3, project_count)))
        relevant_project_count = min(project_count, random.randint(0, project_count))
        deployed_project_count = min(project_count, random.randint(0, min(3, project_count))) if is_tech_branch else random.randint(0, 1)
        github_project_count = min(project_count, random.randint(max(0, project_count - 2), project_count))

        has_web = (random.random() < 0.75) if is_tech_branch else (random.random() < 0.25)
        has_ml = (random.random() < 0.60) if is_tech_branch else (random.random() < 0.15)
        has_final_year = project_count > 0 and (random.random() < 0.90)

        # Skills
        num_lang = random.randint(2, 5) if is_tech_branch else random.randint(1, 3)
        prog_sample = random.sample(PROG_LANGUAGES, min(num_lang, len(PROG_LANGUAGES)))

        num_fw = random.randint(1, 4) if is_tech_branch else random.randint(0, 2)
        fw_sample = random.sample(FRAMEWORKS, min(num_fw, len(FRAMEWORKS))) if num_fw > 0 else []

        num_db = random.randint(1, 3) if is_tech_branch else random.randint(0, 1)
        db_sample = random.sample(DATABASES, min(num_db, len(DATABASES))) if num_db > 0 else []

        num_cloud = random.randint(1, 2) if (is_tech_branch and base_ability > 0.35) else random.randint(0, 1)
        cloud_sample = random.sample(CLOUD, min(num_cloud, len(CLOUD))) if num_cloud > 0 else []

        num_devops = random.randint(1, 3) if is_tech_branch else random.randint(0, 1)
        devops_sample = random.sample(DEVOPS, min(num_devops, len(DEVOPS))) if num_devops > 0 else []

        ml_sample = random.sample(ML_SKILLS, random.randint(1, 4)) if has_ml else []

        # Coding Activity
        has_lc = random.random() < (0.90 if is_tech_branch else 0.40)
        lc_solved = int(np.clip(base_ability * 650 + np.random.normal(0, 60), 0, 800)) if has_lc else 0
        
        has_cf = random.random() < (0.50 if is_tech_branch else 0.15)
        cf_rating = int(np.clip(1100 + base_ability * 850 + np.random.normal(0, 80), 800, 2200)) if has_cf else None

        hackathons = int(np.clip(np.random.poisson(base_ability * 3.0), 0, 10)) if is_tech_branch else random.randint(0, 2)
        coding_comps = int(np.clip(np.random.poisson(base_ability * 2.5), 0, 8)) if is_tech_branch else random.randint(0, 1)

        # Certifications
        cert_count = int(np.clip(np.random.poisson(base_ability * 2.5), 0, 8))
        rel_cert = min(cert_count, random.randint(0, cert_count))
        has_cloud_cert = len(cloud_sample) > 0 and (random.random() < 0.45)
        has_ml_cert = has_ml and (random.random() < 0.40)

        # Online presence
        has_gh = is_tech_branch or (random.random() < 0.6)
        has_li = random.random() < 0.92
        has_pf = (random.random() < 0.50) if is_tech_branch else (random.random() < 0.15)

        # Resume metadata
        resume_words = int(np.clip(np.random.normal(500, 100), 200, 900))
        resume_pages = 2 if resume_words > 650 else 1

        student = {
            "student_id": stu_id,
            "academic": {
                "cgpa": cgpa,
                "tenth_percentage": tenth_pct,
                "twelfth_percentage": twelfth_pct,
                "backlog_count": backlogs,
                "active_backlog_count": active_backlogs,
                "degree_type": degree,
                "branch": branch,
                "graduation_year": 2025
            },
            "experience": {
                "internship_count": internship_count,
                "total_internship_months": total_intern_months,
                "relevant_internship_count": relevant_intern_count,
                "work_experience_count": work_exp_count,
                "total_work_experience_months": total_work_months,
                "relevant_work_experience_months": relevant_work_months
            },
            "projects": {
                "project_count": project_count,
                "major_project_count": major_project_count,
                "relevant_project_count": relevant_project_count,
                "deployed_project_count": deployed_project_count,
                "github_project_count": github_project_count,
                "has_ml_project": has_ml,
                "has_web_project": has_web,
                "has_final_year_project": has_final_year
            },
            "skills": {
                "programming_languages": prog_sample,
                "frameworks": fw_sample,
                "databases": db_sample,
                "cloud": cloud_sample,
                "devops": devops_sample,
                "machine_learning": ml_sample
            },
            "coding": {
                "leetcode_problems_solved": lc_solved,
                "leetcode_data_available": has_lc,
                "codeforces_rating": cf_rating,
                "hackathon_count": hackathons,
                "coding_competition_count": coding_comps
            },
            "certifications": {
                "certification_count": cert_count,
                "relevant_certification_count": rel_cert,
                "has_cloud_certification": has_cloud_cert,
                "has_ml_certification": has_ml_cert
            },
            "online_presence": {
                "has_github": has_gh,
                "has_linkedin": has_li,
                "has_portfolio": has_pf
            },
            "resume_metadata": {
                "resume_word_count": resume_words,
                "resume_page_count": resume_pages,
                "has_projects_section": project_count > 0,
                "has_experience_section": internship_count > 0 or work_exp_count > 0,
                "has_achievements_section": (hackathons > 0 or coding_comps > 0 or cgpa > 8.5)
            }
        }
        students.append(student)

    return students


def generate_jds():
    jds = [
        {
            "jd_id": "JD_TIER1_SWE_01",
            "company_id": "COMP_GOOGLE",
            "company_name": "Google",
            "role_title": "Software Development Engineer",
            "role_category": "Software Engineering",
            "eligibility": {
                "min_cgpa": 8.0,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "AI-DS", "ECE"],
                "eligible_degree_types": ["B.Tech", "BE"]
            },
            "required_skills": {
                "must_have": ["C++", "Python", "SQL", "Git"],
                "good_to_have": ["Docker", "Kubernetes", "AWS", "FastAPI"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 3,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Product",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.08,
                "avg_hired_cgpa": 8.9
            }
        },
        {
            "jd_id": "JD_FINTECH_BACKEND_02",
            "company_id": "COMP_RAZORPAY",
            "company_name": "Razorpay",
            "role_title": "Backend Software Engineer",
            "role_category": "Backend Engineering",
            "eligibility": {
                "min_cgpa": 7.5,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "ECE", "AI-DS"],
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["Java", "Spring Boot", "MySQL", "Git"],
                "good_to_have": ["Redis", "Docker", "AWS", "CI/CD"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 2,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Fintech",
                "company_size": "Mid-Size",
                "historical_hire_rate": 0.14,
                "avg_hired_cgpa": 8.2
            }
        },
        {
            "jd_id": "JD_AI_STARTUP_03",
            "company_id": "COMP_NEXUS_AI",
            "company_name": "Nexus AI",
            "role_title": "Machine Learning Engineer",
            "role_category": "Data Science & ML",
            "eligibility": {
                "min_cgpa": 7.0,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "AI-DS"],
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["Python", "PyTorch", "Scikit-learn", "Pandas"],
                "good_to_have": ["Docker", "FastAPI", "AWS", "XGBoost"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 2,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "AI / ML",
                "company_size": "Startup",
                "historical_hire_rate": 0.10,
                "avg_hired_cgpa": 8.3
            }
        },
        {
            "jd_id": "JD_FRONTEND_DEV_04",
            "company_id": "COMP_SWIGGY",
            "company_name": "Swiggy",
            "role_title": "Frontend Engineer",
            "role_category": "Frontend Engineering",
            "eligibility": {
                "min_cgpa": 6.8,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "ECE", "AI-DS", "EEE"],
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["JavaScript", "TypeScript", "React"],
                "good_to_have": ["Node.js", "Vue", "Git", "Docker"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 1,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "E-Commerce",
                "company_size": "Mid-Size",
                "historical_hire_rate": 0.18,
                "avg_hired_cgpa": 7.9
            }
        },
        {
            "jd_id": "JD_SERVICES_MNC_05",
            "company_id": "COMP_TCS",
            "company_name": "TCS Digital",
            "role_title": "Systems Developer",
            "role_category": "Software Engineering",
            "eligibility": {
                "min_cgpa": 6.0,
                "max_active_backlogs_allowed": 1,
                "eligible_branches": ALL_BRANCHES,
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["Python", "SQL"],
                "good_to_have": ["Java", "React", "Git"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 0,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "IT Services",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.38,
                "avg_hired_cgpa": 7.3
            }
        },
        {
            "jd_id": "JD_CLOUD_DEVOPS_06",
            "company_id": "COMP_ORACLE",
            "company_name": "Oracle Cloud",
            "role_title": "Cloud DevOps Engineer",
            "role_category": "DevOps & Cloud",
            "eligibility": {
                "min_cgpa": 7.2,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "ECE", "AI-DS"],
                "eligible_degree_types": ["B.Tech", "BE"]
            },
            "required_skills": {
                "must_have": ["Linux", "Docker", "Kubernetes", "AWS"],
                "good_to_have": ["Python", "CI/CD", "Terraform", "Go"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 2,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Enterprise Software",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.12,
                "avg_hired_cgpa": 8.0
            }
        },
        {
            "jd_id": "JD_CORE_EMBEDDED_07",
            "company_id": "COMP_QUALCOMM",
            "company_name": "Qualcomm",
            "role_title": "Embedded Systems Engineer",
            "role_category": "Hardware & Embedded",
            "eligibility": {
                "min_cgpa": 7.5,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["ECE", "EEE", "CSE"],
                "eligible_degree_types": ["B.Tech", "BE"]
            },
            "required_skills": {
                "must_have": ["C", "C++", "Linux"],
                "good_to_have": ["Python", "Git", "Docker"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 2,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Semiconductor",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.11,
                "avg_hired_cgpa": 8.4
            }
        },
        {
            "jd_id": "JD_FULLSTACK_STARTUP_08",
            "company_id": "COMP_GROWW",
            "company_name": "Groww",
            "role_title": "Full Stack Engineer",
            "role_category": "Full Stack Development",
            "eligibility": {
                "min_cgpa": 7.0,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ["CSE", "IT", "AI-DS", "ECE"],
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["React", "Node.js", "PostgreSQL", "JavaScript"],
                "good_to_have": ["Redis", "Docker", "AWS", "TypeScript"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 2,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Fintech",
                "company_size": "Mid-Size",
                "historical_hire_rate": 0.16,
                "avg_hired_cgpa": 8.0
            }
        },
        {
            "jd_id": "JD_MASS_RECRUITER_09",
            "company_id": "COMP_INFOSYS",
            "company_name": "Infosys Specialist Programmer",
            "role_title": "Associate Specialist Programmer",
            "role_category": "Software Engineering",
            "eligibility": {
                "min_cgpa": 6.5,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ALL_BRANCHES,
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["Java", "Python", "SQL"],
                "good_to_have": ["Spring Boot", "React", "Docker"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 0,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "IT Services",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.28,
                "avg_hired_cgpa": 7.5
            }
        },
        {
            "jd_id": "JD_DATA_ANALYST_10",
            "company_id": "COMP_DELOITTE",
            "company_name": "Deloitte USI",
            "role_title": "Analyst - Technology & Analytics",
            "role_category": "Analytics & Consulting",
            "eligibility": {
                "min_cgpa": 6.8,
                "max_active_backlogs_allowed": 0,
                "eligible_branches": ALL_BRANCHES,
                "eligible_degree_types": ["B.Tech", "BE", "MCA"]
            },
            "required_skills": {
                "must_have": ["SQL", "Python", "Pandas"],
                "good_to_have": ["MySQL", "Tableau", "AWS"]
            },
            "experience_requirement": {
                "min_internship_months_preferred": 0,
                "fresher_eligible": True
            },
            "company_metadata": {
                "sector": "Consulting",
                "company_size": "Enterprise",
                "historical_hire_rate": 0.25,
                "avg_hired_cgpa": 7.6
            }
        }
    ]
    return jds


def generate_labels(students, jds, sample_pairs_per_student: int = 4):
    from jd_matching import check_eligibility, compute_jd_match_features

    labels = []

    for student in students:
        chosen_jds = random.sample(jds, min(sample_pairs_per_student, len(jds)))
        
        for jd in chosen_jds:
            stu_id = student["student_id"]
            jd_id = jd["jd_id"]

            is_eligible, reason = check_eligibility(student, jd)
            match_res = compute_jd_match_features(student.get("skills", {}), jd.get("required_skills", {}))
            skill_pct = match_res["required_skill_match_percentage"]

            if not is_eligible:
                prob = round(float(random.uniform(0.00, 0.03)), 3)
                placed = False
            else:
                hire_rate = jd["company_metadata"]["historical_hire_rate"]
                cgpa_factor = max(0.0, (student["academic"]["cgpa"] - jd["eligibility"]["min_cgpa"])) / max(1.0, (10.0 - jd["eligibility"]["min_cgpa"]))
                skill_factor = skill_pct / 100.0
                intern_factor = min(1.0, student["experience"]["relevant_internship_count"] * 0.4)
                project_factor = min(1.0, student["projects"]["deployed_project_count"] * 0.35 + student["projects"]["relevant_project_count"] * 0.15)
                coding_factor = min(1.0, student["coding"]["leetcode_problems_solved"] / 350.0)

                # Composite score
                composite_score = (
                    (skill_factor * 0.35) +
                    (coding_factor * 0.22) +
                    (cgpa_factor * 0.18) +
                    (project_factor * 0.15) +
                    (intern_factor * 0.10)
                )

                # Sigmoid placement curve with company threshold
                adjusted_score = composite_score * (0.85 + hire_rate * 0.6)
                z = (adjusted_score - 0.48) * 8.0
                prob = 1.0 / (1.0 + np.exp(-z))
                prob = round(float(np.clip(prob + np.random.normal(0, 0.04), 0.05, 0.95)), 3)
                
                # Discriminative placement threshold
                placed = bool(prob >= 0.50 or (prob >= 0.40 and random.random() < prob))

            labels.append({
                "student_id": stu_id,
                "jd_id": jd_id,
                "eligible": bool(is_eligible),
                "skill_match_percentage": float(skill_pct),
                "placed": int(placed),
                "placement_probability_ground_truth": prob
            })

    return labels


def main():
    print("Generating 1000 synthetic student profiles...")
    students = generate_students(1000)
    with open(DATA_DIR / "students.json", "w", encoding="utf-8") as f:
        json.dump(students, f, indent=2)
    print(f"Saved {len(students)} students to data/students.json")

    print("Generating 10 job descriptions...")
    jds = generate_jds()
    with open(DATA_DIR / "jds.json", "w", encoding="utf-8") as f:
        json.dump(jds, f, indent=2)
    print(f"Saved {len(jds)} JDs to data/jds.json")

    print("Generating labeled student-JD pairs...")
    labels = generate_labels(students, jds, sample_pairs_per_student=4)
    with open(DATA_DIR / "labels.json", "w", encoding="utf-8") as f:
        json.dump(labels, f, indent=2)
    print(f"Saved {len(labels)} labels to data/labels.json")

    eligible_count = sum(1 for l in labels if l["eligible"])
    placed_count = sum(1 for l in labels if l["placed"] == 1)
    print(f"Total pairs: {len(labels)}")
    print(f"Eligible pairs: {eligible_count} ({eligible_count/len(labels)*100:.1f}%)")
    print(f"Placed total: {placed_count} ({placed_count/len(labels)*100:.1f}%)")
    if eligible_count > 0:
        print(f"Placed among eligible: {placed_count/eligible_count*100:.1f}%")


if __name__ == "__main__":
    main()
