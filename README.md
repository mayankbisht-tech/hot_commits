# 🎓 GGSIPU Training & Placement Cell (TPC) Platform — Complete Architecture, ML Engine & Cloudinary Resume Pipeline

> **Guru Gobind Singh Indraprastha University (GGSIPU), New Delhi**  
> Enterprise-grade Campus Recruitment Automation, AI Resume Feature Extractor, Cloudinary Storage & XGBoost Placement Prediction Engine for the 2026 Academic Session and Beyond.  
> Powered by **Next.js 16 App Router**, **Prisma ORM**, **Supabase PostgreSQL**, **Cloudinary API**, **Python XGBoost ML Engine**, **Tailwind CSS**, and **SWR Real-Time State Synchronization**.

---

## 📑 Table of Contents

1. [Executive Summary & Core Objectives](#1-executive-summary--core-objectives)
2. [Platform Architecture & Technology Stack](#2-platform-architecture--technology-stack)
3. [Cloudinary Integration & Real-Time Resume Storage](#3-cloudinary-integration--real-time-resume-storage)
4. [AI Resume Extraction Engine & Dual Skill Merging](#4-ai-resume-extraction-engine--dual-skill-merging)
5. [XGBoost ML Placement Prediction Pipeline Workflow](#5-xgboost-ml-placement-prediction-pipeline-workflow)
6. [Database Schema & Entity Relationship Model](#6-database-schema--entity-relationship-model)
7. [Authentication & Role-Based Access Control (RBAC)](#7-authentication--role-based-access-control-rbac)
8. [Comprehensive Portal & UI Component Breakdown](#8-comprehensive-portal--ui-component-breakdown)
   - [8.1 Public & Authentication Layer (`/login`, `/signup`)](#81-public--authentication-layer-login-signup)
   - [8.2 Student Portal & Real-Time AI Predictor (`/student/predictions`)](#82-student-portal--real-time-ai-predictor-studentpredictions)
   - [8.3 Training & Workshop Recommender (`/student/training`)](#83-training--workshop-recommender-studenttraining)
   - [8.4 TPO Admin Portal (`/tpo`)](#84-tpo-admin-portal-tpo)
   - [8.5 Recruiting Company Portal (`/company`)](#85-recruiting-company-portal-company)
9. [Backend API Specifications & Endpoints](#9-backend-api-specifications--endpoints)
10. [University Placement Governance & 2X Dream Offer Rules](#10-university-placement-governance--2x-dream-offer-rules)
11. [Local Setup, Environment Variables & Deployment](#11-local-setup-environment-variables--deployment)

---

## 1. Executive Summary & Core Objectives

### ❓ WHAT is this platform?
The **GGSIPU Training & Placement Cell (TPC) Platform** is an end-to-end web application that automates university placement operations, candidate-company matching, resume management via Cloudinary, and machine learning placement probability predictions.

### 💡 WHY was it built?
- **Automate Recruitment Operations**: Eliminate manual resume collection, manual shortlisting, and paper-based eligibility checking across departments (`CSE`, `IT`, `AI-DS`, `ECE`, `EEE`, `ME`).
- **Real-Time Candidate Insights**: Provide students with immediate data-driven feedback on their placement chances against active campus drives (e.g. *Microsoft*, *Amazon*, *Atlassian*, *TechCorp*, *TCS Digital*, *Nexus Systems*).
- **Skill Gap Identification**: Automatically highlight missing technical skills required by target companies and deep-link students to relevant university training workshops.
- **Strict Placement Policy Enforcement**: Automatically govern GGSIPU's NIRF placement metrics, 2X CTC Dream Offer rules, and 1-offer policy limits.

### ⚙️ HOW does it work?
1. **Cloudinary Upload**: Students upload real-time resumes (PDF/DOCX/TXT) which are stored securely on Cloudinary.
2. **Dual-Extraction Engine**: The backend parses text from the uploaded document using `pdf-parse` and merges technical skills, CGPA, projects, internships, and coding stats from **both the resume text stream AND the student database profile**.
3. **Multi-JD Machine Learning Inference**: An XGBoost classifier script (`placement-prediction-engine/predict_service.py`) evaluates candidate features against **EACH AND EVERY active job description**, computing placement probability percentages, predicted placement status, and skill gap recommendations.
4. **Interactive Dashboard**: Students view a company-by-company placement probability matrix with matched/missing skill chips and 1-click workshop enrollment buttons.

---

## 2. Platform Architecture & Technology Stack

```mermaid
graph TD
    User[Client Browser / Device] -->|HTTPS Requests| AppShell[Next.js 16 App Router]
    AppShell -->|Role & Token Verification| Middleware[Edge Middleware Layer]
    Middleware -->|Client Components & Optimistic UI| SWR[SWR Real-Time State Manager]
    Middleware -->|API Handlers| API[Next.js Server API Routes]
    API -->|Prisma Connection Pool| DB[(Supabase PostgreSQL Database)]
    API -->|Multipart Upload Stream| Cloudinary[Cloudinary Cloud Media Storage]
    API -->|PDF Stream Parsing| PDFParse[pdf-parse Engine]
    API -->|Subprocess Execution via Python| ML[XGBoost ML Prediction Service]
    ML -->|Inference & Scoring| Artifacts[(Model Artifacts & JSON Schemas)]
```

### 🛠️ Core Technologies
- **Frontend Framework**: Next.js 16 (React 19, TypeScript, App Router)
- **Database & ORM**: Supabase PostgreSQL with Prisma ORM v5
- **Media & File Storage**: Cloudinary SDK (`cloudinary` & `next-cloudinary`)
- **PDF Text Parsing**: `pdf-parse` engine
- **Machine Learning**: Python 3.14, XGBoost 2.0+, Scikit-Learn, Pandas, NumPy
- **Styling**: Vanilla CSS / Tailwind CSS with Warm Palette (`#F8F5EC` canvas, `#8B1A1A` maroon primary, `#F1E9D8` secondary, `#E3D8C4` borders)
- **State Management & Polling**: SWR (Stale-While-Revalidate) with 2s refresh interval
- **Icons & Visuals**: `lucide-react`, Recharts data visualizations

---

## 3. Cloudinary Integration & Real-Time Resume Storage

### ❓ WHAT is the Cloudinary Integration?
The platform integrates Cloudinary's cloud storage network to store student resumes securely and serve them with high-speed CDN URLs.

### 💡 WHY use Cloudinary?
- **Reliable Storage**: Avoids storing heavy PDF/DOCX binary files directly in PostgreSQL or local server disk.
- **Direct Accessibility**: Provides public, secure Cloudinary URLs (`resumeUrl`) accessible to recruiters, TPO admins, and ML feature extractors.
- **Instant Persistence**: Updates the student's profile (`Student.resumeUrl`) upon upload so resumes persist across sessions.

### ⚙️ HOW is it implemented?
- **Configuration** ([`lib/cloudinary.ts`](file:///c:/Users/cw_71/OneDrive/Desktop/project/hot%20commits/Placement-portal/lib/cloudinary.ts)):
  ```ts
  import { v2 as cloudinary } from 'cloudinary';
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  ```
- **Upload Stream**: The API route [`app/api/resume/upload/route.ts`](file:///c:/Users/cw_71/OneDrive/Desktop/project/hot%20commits/Placement-portal/app/api/resume/upload/route.ts) converts multipart FormData files into Buffer streams and uploads them via `cloudinary.uploader.upload_stream`.

---

## 4. AI Resume Extraction Engine & Dual Skill Merging

### ❓ WHAT is the AI Resume Extractor?
It is a dual-source extraction engine ([`lib/resume-parser.ts`](file:///c:/Users/cw_71/OneDrive/Desktop/project/hot%20commits/Placement-portal/lib/resume-parser.ts)) that reads the unformatted text stream of a uploaded resume and merges it with the candidate's existing database profile.

### 💡 WHY use Dual-Source Extraction?
Resumes often omit profile skills (or format them informally), while profile records might lack details from newly updated resumes. Combining both sources ensures **100% complete feature extraction** for the ML prediction model.

### ⚙️ HOW does extraction work?

1. **PDF Text Stream Parsing**: Converts binary PDF data into raw string text using `pdf-parse`.
2. **Regex & Heuristic Pattern Matching**:
   - **CGPA & Grades**:
     ```ts
     /cgpa[:\s]+([0-9]\.[0-9]{1,2})/i
     /gpa[:\s]+([0-9]\.[0-9]{1,2})/i
     /([0-9]\.[0-9]{1,2})\s*\/\s*10/i
     ```
   - **Branch Detection**: Identifies `Computer Science`, `CSE`, `AI-DS`, `IT`, `ECE`, `EEE`, `ME`.
   - **Skill Category Dictionaries**:
     - *Languages*: Python, JavaScript, TypeScript, C++, C#, Java, Rust, Go, SQL, HTML, CSS, R, Kotlin, Swift, MATLAB.
     - *Frameworks*: React, Next.js, Angular, Vue, Node.js, Express, Django, Flask, FastAPI, Spring Boot, Tailwind, Flutter.
     - *Databases*: PostgreSQL, MySQL, MongoDB, Redis, SQLite, Oracle, Firebase, Supabase, Prisma.
     - *Cloud*: AWS, GCP, Azure, Cloudinary, Heroku, Vercel, Netlify.
     - *DevOps*: Docker, Kubernetes, Git, GitHub Actions, Terraform, Linux, Nginx, System Design, Microservices.
     - *Machine Learning*: PyTorch, TensorFlow, Scikit-Learn, XGBoost, Pandas, NumPy, OpenCV, NLP, Keras, LLM, Transformers.
3. **Database Profile Merging**: Pulls `Student.skillsJson` from database and appends any registered skills not explicitly extracted from resume text.
4. **Experience & Project Counters**: Counts internships, calculates total internship months, counts GitHub projects, and flags `has_ml_project` / `has_web_project`.

---

## 5. XGBoost ML Placement Prediction Pipeline Workflow

### ❓ WHAT is the ML Placement Pipeline?
A machine learning classification pipeline powered by an XGBoost model (`placement-prediction-engine/predict_service.py`) trained on candidate academic records, technical skill stacks, project portfolios, and company job descriptions.

### 💡 WHY generate scores against EACH job description?
Calculating a generic "standalone" score doesn't reflect real-world hiring. A student with strong Python/ML skills might have a **92% chance at Amazon (AWS/ML role)** but only a **60% chance at Atlassian (Java/System Design role)**. Evaluating against **each and every job description** provides exact, job-specific guidance.

### ⚙️ HOW does the ML Pipeline execute?

```mermaid
sequenceDiagram
    participant UI as Student UI (/student/predictions)
    participant API as API Handler (/api/resume/upload)
    participant DB as Prisma Database
    participant Py as Python ML Service (predict_service.py)

    UI->>API: Post Multipart Resume File
    API->>API: Parse Text (pdf-parse) & Extract Features
    API->>DB: Save resumeUrl & merged skills
    API->>DB: Fetch ALL Active Company Drives (Microsoft, Amazon, TCS, etc.)
    loop For Each Company Job Drive
        API->>Py: Pass Student Payload + Target Job Description JSON via stdin
        Py->>Py: Flatten Features & Compute Candidate-JD Interaction Matrix
        Py->>Py: XGBoost Model Inference (predict_proba)
        Py-->>API: Return Probability %, Status, & Skill Gap via stdout
    end
    API-->>UI: Return Drive Prediction Matrix Array
    UI->>UI: Render Job-by-Job Placement Chance Cards & Skill Chips
```

- **Feature Engineering**: Python's `feature_engineering.py` computes composite metrics:
  $$\text{Academic Consistency} = \frac{(\text{CGPA} \times 10 \times 0.5) + (\text{12th\%} \times 0.25) + (\text{10th\%} \times 0.25)}{100}$$
  $$\text{Skill Match \%} = \frac{\text{Matched Must-Have Skills}}{\text{Total Required Skills}} \times 100$$
- **Inference Output**: Returns `placement_probability` (0–100%), `predicted_placed` (boolean), `matched_skills`, and `missing_skills` gap list.

---

## 6. Database Schema & Entity Relationship Model

```mermaid
erDiagram
    USER ||--o| TPO_ADMIN : profile
    USER ||--o| COMPANY : profile
    USER ||--o| STUDENT : profile
    COMPANY ||--o{ DRIVE : posts
    STUDENT ||--o{ APPLICATION : submits
    DRIVE ||--o{ APPLICATION : receives
    APPLICATION ||--o{ STAGE_ENTRY : tracks
    STUDENT ||--o{ OFFER : receives
    DRIVE ||--o{ OFFER : generates
    TRAINING_PROGRAM ||--o{ ENROLLMENT : offers
    STUDENT ||--o{ ENROLLMENT : registers
```

### Key Models
- **`User`**: Authentication identity (`email`, `password`, `role: TPO | COMPANY | STUDENT`).
- **`Student`**: Candidate metrics (`rollNo`, `branch`, `cgpa`, `backlogs`, `class10`, `class12`, `graduationYear`, `placementStatus`, `resumeUrl`, `skillsJson`).
- **`Company`**: Corporate profile (`name`, `tier: TIER_1 | TIER_2 | TIER_3`, `industry`, `logo`).
- **`Drive`**: Placement opening (`role`, `ctc`, `location`, `minCGPA`, `maxBacklogs`, `minClass10`, `minClass12`, `offerPolicy`, `branchesJson`, `roundsJson`).
- **`Application`**: Candidate drive submission (`status: APPLIED | SHORTLISTED | INTERVIEW_SCHEDULED | OFFER_EXTENDED | OFFER_ACCEPTED | REJECTED`).
- **`TrainingProgram`**: Career bootcamp (`title`, `type: TECHNICAL | APTITUDE | SOFT_SKILLS | CERTIFICATION`, `capacity`, `tagsJson`).

---

## 7. Authentication & Role-Based Access Control (RBAC)

- **JWT Session Tokens**: Encoded payload containing user ID, role, and profile reference stored in `httpOnly` secure cookies (`tpc_auth`).
- **Edge Middleware (`middleware.ts`)**: Intercepts requests and enforces route protection:
  - `/tpo/*` $\rightarrow$ Accessible strictly to `TPO` users.
  - `/company/*` $\rightarrow$ Accessible strictly to `COMPANY` users.
  - `/student/*` $\rightarrow$ Accessible strictly to `STUDENT` users.

---

## 8. Comprehensive Portal & UI Component Breakdown

### 8.1 Public & Authentication Layer (`/login`, `/signup`)
- **Login Page (`app/login/page.tsx`)**: Quick 1-click role switcher cards for TPO Admin, Company HR, and Student with auto-fill credentials.
- **Signup Page (`app/signup/page.tsx`)**: Dual role registration form supporting academic inputs for students and company tier details for recruiters.

### 8.2 Student Portal & Real-Time AI Predictor (`/student/predictions`)
- **Cloudinary Drag & Drop Uploader**: Drag & drop PDF/DOCX resume uploader with upload progress indicator.
- **Candidate Skill Portfolio Deck**: Displays merged technical skills extracted from both resume text and student database record.
- **Multi-Company Placement Probability Matrix**:
  - Displays individual cards for **each and every company drive** (*Microsoft*, *Amazon*, *Atlassian*, *TechCorp*, *Nexus Systems*, *TCS Digital*, *Global FinServ*).
  - Features color-coded placement probability gauges:
    - **80%+**: Emerald Green (`#4A7C59`) — High Placement Match
    - **60–79%**: Gold Amber (`#C8A243`) — Moderate Match
    - **<60%**: Coral Red (`#C85555`) — Improvement Needed
  - **Matched vs Missing Skill Breakdown**: Lists matched required skills and missing skills with 1-click links to enroll in training workshops (`/student/training?skill=...`).

### 8.3 Training & Workshop Recommender (`/student/training`)
- **Interactive Workshops Grid**: Browse aptitude bootcamps, technical certifications, and mock interview series.
- **Auto-Scroll Skill Filter Banner**: When coming from the AI Predictor skill gap recommendation, automatically highlights and scrolls smoothly to target training programs for that missing skill.

### 8.4 TPO Admin Portal (`/tpo`)
- **Dashboard Overview (`app/tpo/page.tsx`)**: NIRF placement metric KPI cards, company drive verification queue, branch-wise placement bar charts, and 1-click CSV report export.
- **Drive Verification (`app/tpo/drives/page.tsx`)**: Approve or reject company placement postings.
- **Student Verification & Applicants (`app/tpo/applicants/page.tsx`)**: Monitor student offer statuses and application stages.

### 8.5 Recruiting Company Portal (`/company`)
- **Drive Management (`app/company/drives/page.tsx`)**: Post new job drives with CTC, eligibility cutoffs, and required skills.
- **Applicant Pipeline (`app/company/applicants/page.tsx`)**: Shortlist candidates, schedule interviews, and issue official job offers.

---

## 9. Backend API Specifications & Endpoints

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates user and issues HTTP-only JWT cookie. |
| `/api/auth/signup` | `POST` | Public | Registers student, company, or TPO admin user. |
| `/api/auth/me` | `GET` | All | Returns current authenticated user payload. |
| `/api/resume/upload` | `POST` | Student | Uploads resume to Cloudinary, extracts text & skills, and runs XGBoost ML predictions against ALL active job drives. |
| `/api/predictions` | `POST` | All | Runs XGBoost ML prediction for a specific student and job description payload. |
| `/api/drives/eligible` | `GET` | Student | Returns active drives with student eligibility validation. |
| `/api/applications` | `POST`/`GET` | Student/TPO | Submits job application or fetches student application history. |
| `/api/training` | `GET` | All | Fetches training workshops and enrollment counts. |
| `/api/training/[id]/enroll` | `POST`/`DELETE`| Student | Toggles student workshop enrollment. |

---

## 10. University Placement Governance & 2X Dream Offer Rules

- **Standard Policy**: Unplaced candidates are eligible for all active drives matching CGPA and backlog criteria.
- **2X Package Rule**: Once a student accepts an offer (e.g. ₹10 LPA initial offer), they are locked out from standard drives and become eligible **only for Dream Drives offering at least 2X their accepted package** (₹20+ LPA).
- **Backlog Safeguard**: Candidates exceeding maximum active backlogs (`maxBacklogs`) are automatically flagged as ineligible with explicit reason notifications.

---

## 11. Local Setup, Environment Variables & Deployment

### 📋 Prerequisites
- Node.js 18+ or 20+
- Python 3.10+ (with `xgboost`, `pandas`, `scikit-learn`, `pyarrow`)
- Supabase PostgreSQL Database

### ⚙️ Environment Variables (`.env`)
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true&connection_limit=15"
DIRECT_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
JWT_SECRET="tpc-platform-secret-key-ggsipu-2026"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 🚀 Quick Start Commands

```bash
# 1. Install Node.js dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed Database with Initial Companies, Students & Drives
npm run seed

# 4. Start Next.js Development Server
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) to launch the GGSIPU Placement Portal!
#   h o t _ c o m m i t s  
 