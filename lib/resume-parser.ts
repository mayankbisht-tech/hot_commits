/**
 * Utility module for parsing raw resume text into structured features
 * required by the Placement Prediction Engine (XGBoost ML Model).
 * Extracts ALL skills from raw resume text + student profile database.
 */

export interface ParsedStudentFeatures {
  student_id?: string;
  academic: {
    cgpa: number;
    tenth_percentage: number;
    twelfth_percentage: number;
    backlog_count: number;
    active_backlog_count: number;
    degree_type: string;
    branch: string;
    graduation_year: number;
  };
  experience: {
    internship_count: number;
    total_internship_months: number;
    relevant_internship_count: number;
    work_experience_count: number;
    total_work_experience_months: number;
    relevant_work_experience_months: number;
  };
  projects: {
    project_count: number;
    major_project_count: number;
    relevant_project_count: number;
    deployed_project_count: number;
    github_project_count: number;
    has_ml_project: boolean;
    has_web_project: boolean;
    has_final_year_project: boolean;
  };
  skills: {
    programming_languages: string[];
    frameworks: string[];
    databases: string[];
    cloud: string[];
    devops: string[];
    machine_learning: string[];
    other_skills: string[];
  };
  coding: {
    leetcode_problems_solved: number;
    leetcode_data_available: boolean;
    codeforces_rating: number | null;
    hackathon_count: number;
    coding_competition_count: number;
  };
  certifications: {
    certification_count: number;
    relevant_certification_count: number;
    has_cloud_certification: boolean;
    has_ml_certification: boolean;
  };
  online_presence: {
    has_github: boolean;
    has_linkedin: boolean;
    has_portfolio: boolean;
  };
  resume_metadata: {
    resume_word_count: number;
    resume_page_count: number;
    has_projects_section: boolean;
    has_experience_section: boolean;
    has_achievements_section: boolean;
  };
}

const TECH_SKILL_DICTIONARY = {
  programming_languages: [
    'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'java', 'rust',
    'go', 'golang', 'sql', 'html', 'css', 'r', 'kotlin', 'swift', 'php', 'embedded c', 'matlab'
  ],
  frameworks: [
    'react', 'next.js', 'nextjs', 'angular', 'vue', 'vue.js', 'node.js', 'nodejs',
    'express', 'express.js', 'django', 'flask', 'fastapi', 'spring boot', 'spring',
    'tailwind', 'tailwindcss', 'bootstrap', 'react native', 'flutter', 'dart'
  ],
  databases: [
    'postgresql', 'postgres', 'mysql', 'mongodb', 'mongo', 'redis', 'sqlite',
    'oracle', 'firebase', 'supabase', 'cassandra', 'dynamodb', 'prisma'
  ],
  cloud: [
    'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'microsoft azure',
    'cloudinary', 'heroku', 'vercel', 'netlify', 'digitalocean'
  ],
  devops: [
    'docker', 'kubernetes', 'k8s', 'ci/cd', 'git', 'github', 'gitlab',
    'github actions', 'terraform', 'linux', 'nginx', 'bash', 'shell', 'system design', 'microservices'
  ],
  machine_learning: [
    'pytorch', 'tensorflow', 'scikit-learn', 'sklearn', 'xgboost', 'pandas',
    'numpy', 'opencv', 'huggingface', 'nlp', 'keras', 'deep learning',
    'machine learning', 'computer vision', 'llm', 'langchain', 'transformers', 'data science'
  ]
};

export function parseResumeText(
  text: string, 
  existingStudentData?: any
): ParsedStudentFeatures {
  const lowerText = text.toLowerCase();
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  // 1. CGPA Extraction
  let extractedCgpa = existingStudentData?.cgpa ? Number(existingStudentData.cgpa) : 8.0;
  const cgpaRegexes = [
    /cgpa[:\s]+([0-9]\.[0-9]{1,2})/i,
    /gpa[:\s]+([0-9]\.[0-9]{1,2})/i,
    /([0-9]\.[0-9]{1,2})\s*\/\s*10/i,
    /([0-9]\.[0-9]{1,2})\s*cgpa/i
  ];
  for (const reg of cgpaRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (val >= 4.0 && val <= 10.0) {
        extractedCgpa = val;
        break;
      }
    }
  }

  // 2. Class 10 / 12 Percentages
  let tenthPct = existingStudentData?.class10 ? Number(existingStudentData.class10) : 85.0;
  const tenthMatch = text.match(/(?:10th|ssc|secondary)[:\s]+([0-9]{2}(?:\.[0-9]+)?)/i);
  if (tenthMatch && tenthMatch[1]) {
    const val = parseFloat(tenthMatch[1]);
    if (val >= 50 && val <= 100) tenthPct = val;
  }

  let twelfthPct = existingStudentData?.class12 ? Number(existingStudentData.class12) : 85.0;
  const twelfthMatch = text.match(/(?:12th|hsc|senior secondary)[:\s]+([0-9]{2}(?:\.[0-9]+)?)/i);
  if (twelfthMatch && twelfthMatch[1]) {
    const val = parseFloat(twelfthMatch[1]);
    if (val >= 50 && val <= 100) twelfthPct = val;
  }

  // 3. Branch detection
  let branch = existingStudentData?.branch || 'Computer Science';
  if (lowerText.includes('computer science') || lowerText.includes('cse')) {
    branch = 'CSE';
  } else if (lowerText.includes('artificial intelligence') || lowerText.includes('ai-ds') || lowerText.includes('data science')) {
    branch = 'AI-DS';
  } else if (lowerText.includes('information technology') || lowerText.includes('it')) {
    branch = 'IT';
  } else if (lowerText.includes('electronics') || lowerText.includes('ece')) {
    branch = 'ECE';
  } else if (lowerText.includes('electrical') || lowerText.includes('eee')) {
    branch = 'EEE';
  } else if (lowerText.includes('mechanical')) {
    branch = 'ME';
  }

  // 4. Extract Skills from Resume Text
  const extractedSkills = {
    programming_languages: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    cloud: [] as string[],
    devops: [] as string[],
    machine_learning: [] as string[],
    other_skills: [] as string[]
  };

  (Object.keys(TECH_SKILL_DICTIONARY) as Array<keyof typeof TECH_SKILL_DICTIONARY>).forEach(category => {
    const list = TECH_SKILL_DICTIONARY[category];
    list.forEach(skill => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        const formatted = skill.length <= 3 ? skill.toUpperCase() : skill.charAt(0).toUpperCase() + skill.slice(1);
        extractedSkills[category].push(formatted);
      }
    });
  });

  // 5. MERGE WITH STUDENT PROFILE SKILLS FROM DATABASE (FULL INTEGRATION)
  let profileSkills: string[] = [];
  if (existingStudentData?.skills) {
    profileSkills = Array.isArray(existingStudentData.skills)
      ? existingStudentData.skills
      : [];
  } else if (existingStudentData?.skillsJson) {
    try {
      profileSkills = JSON.parse(existingStudentData.skillsJson);
    } catch {}
  }

  profileSkills.forEach((sk: string) => {
    if (!sk) return;
    const l = sk.toLowerCase().trim();
    if (['python', 'c++', 'java', 'javascript', 'typescript', 'sql', 'rust', 'go', 'c#', 'c', 'r', 'html', 'css'].includes(l)) {
      if (!extractedSkills.programming_languages.includes(sk)) extractedSkills.programming_languages.push(sk);
    } else if (['react', 'next.js', 'angular', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'vue'].includes(l)) {
      if (!extractedSkills.frameworks.includes(sk)) extractedSkills.frameworks.push(sk);
    } else if (['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'firebase'].includes(l)) {
      if (!extractedSkills.databases.includes(sk)) extractedSkills.databases.push(sk);
    } else if (['aws', 'gcp', 'azure', 'cloudinary', 'heroku', 'vercel'].includes(l)) {
      if (!extractedSkills.cloud.includes(sk)) extractedSkills.cloud.push(sk);
    } else if (['docker', 'kubernetes', 'git', 'linux', 'ci/cd', 'nginx'].includes(l)) {
      if (!extractedSkills.devops.includes(sk)) extractedSkills.devops.push(sk);
    } else if (['pytorch', 'tensorflow', 'scikit-learn', 'xgboost', 'pandas', 'numpy', 'opencv', 'ml'].includes(l)) {
      if (!extractedSkills.machine_learning.includes(sk)) extractedSkills.machine_learning.push(sk);
    } else {
      if (!extractedSkills.other_skills.includes(sk)) extractedSkills.other_skills.push(sk);
    }
  });

  // 6. Internships & Experience
  const internshipMatches = lowerText.match(/intern(?:ship)?/g) || [];
  const internshipCount = Math.min(5, internshipMatches.length > 0 ? Math.ceil(internshipMatches.length / 2) : 0);
  const monthMatch = lowerText.match(/([0-9]{1,2})\s*(?:month|mos)/i);
  const totalInternshipMonths = monthMatch ? parseInt(monthMatch[1]) : (internshipCount * 3);

  // 7. Projects Section
  const projectHeaderMatch = /projects?|work|portfolio/i.test(text);
  const projectTitleMatches = lowerText.match(/\b(?:project|system|app|application|platform|dashboard|model)\b/g) || [];
  const projectCount = Math.max(projectHeaderMatch ? 2 : 1, Math.min(6, projectTitleMatches.length));
  
  const hasMlProject = Boolean(
    extractedSkills.machine_learning.length > 0 ||
    /machine learning|deep learning|ai model|nlp|classification|vision|neural network|xgboost|pytorch|tensorflow/i.test(text)
  );

  const hasWebProject = Boolean(
    extractedSkills.frameworks.length > 0 ||
    /react|next|node|web application|full stack|frontend|backend|api/i.test(text)
  );

  // 8. Coding & Competitions
  let leetcodeSolved = 0;
  const leetcodeMatch = text.match(/leetcode\D*([0-9]{2,4})/i);
  if (leetcodeMatch && leetcodeMatch[1]) {
    leetcodeSolved = parseInt(leetcodeMatch[1]);
  } else if (/leetcode/i.test(text)) {
    leetcodeSolved = 250;
  }

  const hackathonMatches = lowerText.match(/hackathon|coding contest|codechef|codeforces|kaggle/g) || [];
  const hackathonCount = hackathonMatches.length;

  // 9. Certifications
  const certMatches = lowerText.match(/certified|certification|certificate|aws certified|cloud practitioner|coursera|nptel/g) || [];
  const certCount = certMatches.length;
  const hasCloudCert = /aws certified|gcp certified|azure certified|cloud practitioner/i.test(text);
  const hasMlCert = /deeplearning\.ai|tensorflow certified|machine learning certification|ai certified/i.test(text);

  // 10. Online Presence & Links
  const hasGithub = /github\.com/i.test(text) || lowerText.includes('github');
  const hasLinkedin = /linkedin\.com/i.test(text) || lowerText.includes('linkedin');
  const hasPortfolio = /portfolio|vercel\.app|github\.io|http/i.test(text);

  const resumePageCount = wordCount > 600 ? 2 : 1;

  return {
    student_id: existingStudentData?.id || existingStudentData?.rollNo || 'STU_CURRENT',
    academic: {
      cgpa: extractedCgpa,
      tenth_percentage: tenthPct,
      twelfth_percentage: twelfthPct,
      backlog_count: existingStudentData?.backlogs ?? 0,
      active_backlog_count: existingStudentData?.backlogs ?? 0,
      degree_type: 'B.Tech',
      branch: branch,
      graduation_year: existingStudentData?.graduationYear ?? 2027
    },
    experience: {
      internship_count: internshipCount,
      total_internship_months: totalInternshipMonths,
      relevant_internship_count: internshipCount,
      work_experience_count: 0,
      total_work_experience_months: 0,
      relevant_work_experience_months: 0
    },
    projects: {
      project_count: projectCount,
      major_project_count: Math.max(1, Math.floor(projectCount / 2)),
      relevant_project_count: projectCount,
      deployed_project_count: hasPortfolio ? Math.max(1, Math.floor(projectCount / 2)) : 0,
      github_project_count: hasGithub ? projectCount : 0,
      has_ml_project: hasMlProject,
      has_web_project: hasWebProject,
      has_final_year_project: true
    },
    skills: extractedSkills,
    coding: {
      leetcode_problems_solved: leetcodeSolved,
      leetcode_data_available: leetcodeSolved > 0,
      codeforces_rating: null,
      hackathon_count: hackathonCount,
      coding_competition_count: hackathonCount
    },
    certifications: {
      certification_count: certCount,
      relevant_certification_count: certCount,
      has_cloud_certification: hasCloudCert,
      has_ml_certification: hasMlCert
    },
    online_presence: {
      has_github: hasGithub,
      has_linkedin: hasLinkedin,
      has_portfolio: hasPortfolio
    },
    resume_metadata: {
      resume_word_count: wordCount,
      resume_page_count: resumePageCount,
      has_projects_section: projectHeaderMatch,
      has_experience_section: /experience|internship|employment/i.test(text),
      has_achievements_section: /achievements|honors|awards|certifications/i.test(text)
    }
  };
}
