# 🎓 GGSIPU Training & Placement Cell (TPC) Platform — Complete Architecture & Component Documentation

> **Guru Gobind Singh Indraprastha University (GGSIPU), New Delhi**  
> Enterprise-grade Placement Automation & Career Services Platform for the 2023–24 Session and beyond.  
> Powered by **Next.js 14/15/16 App Router**, **Prisma ORM**, **Supabase PostgreSQL**, **Tailwind CSS**, and **SWR Real-Time State Synchronization**.

---

## 📑 Table of Contents

1. [Platform Architecture & Tech Stack](#1-platform-architecture--tech-stack)
2. [Database Schema & Entity Relationship Model](#2-database-schema--entity-relationship-model)
3. [Global Design System & Color Palette](#3-global-design-system--color-palette)
4. [Authentication & Role-Based Access Control (RBAC)](#4-authentication--role-based-access-control-rbac)
5. [Complete Module, Component & UI Element Breakdown](#5-complete-module-component--ui-element-breakdown)
   - [5.1 Public & Authentication Layer](#51-public--authentication-layer)
   - [5.2 Shared Platform Components](#52-shared-platform-components)
   - [5.3 TPO Admin Portal (`/tpo`)](#53-tpo-admin-portal-tpo)
   - [5.4 Recruiting Company Portal (`/company`)](#54-recruiting-company-portal-company)
   - [5.5 Student Portal (`/student`)](#55-student-portal-student)
6. [Backend API Routes & Handlers Specification](#6-backend-api-routes--handlers-specification)
7. [Real-Time Engine & Optimistic UI Architecture](#7-real-time-engine--optimistic-ui-architecture)
8. [Policy & Eligibility Engine (NIRF, Dream Offer, One-Offer)](#8-policy--eligibility-engine-nirf-dream-offer-one-offer)
9. [Dynamic University Branch Management System](#9-dynamic-university-branch-management-system)
10. [Local Development, Environment Variables & Deployment](#10-local-development-environment-variables--deployment)

---

## 1. Platform Architecture & Tech Stack

```mermaid
graph TD
    A[Client Browser / Devices] -->|HTTPS Requests| B[Next.js App Router Shell]
    B -->|Route Proxy & RBAC Middleware| C[Edge Middleware Layer]
    C --> D[Client Components & SWR Cache]
    C --> E[Next.js App Router API Handlers]
    E -->|Singleton Connection Pool| F[Prisma ORM Client]
    F -->|TCP Port 5432 Direct Connection| G[(Supabase PostgreSQL Database)]
    E -->|Persistent Branch Config Store| H[(data-branches.json)]
    D -->|Real-Time Polling 2s-4s| E
```

### Core Technologies
- **Framework**: Next.js 14+ (App Router, Server Components & Client Hooks)
- **Database**: PostgreSQL (Hosted on Supabase with Direct Connection Pooling on port `5432`)
- **ORM**: Prisma Client (`@prisma/client`) with custom connection retry resilience
- **Styling**: Tailwind CSS with customized Warm Orange (`#F97316`) theme and micro-animation keyframes
- **State & Real-Time Sync**: SWR (Stale-While-Revalidate) with optimistic client updates
- **Icons**: `lucide-react`
- **Charts & Visualizations**: Recharts (`ResponsiveContainer`, `BarChart`, `LineChart`, `Tooltip`)
- **Authentication**: JWT stored in HTTP-Only, Secure cookies with bcryptjs password hashing

---

## 2. Database Schema & Entity Relationship Model

```mermaid
erDiagram
    USER ||--o| TPO_ADMIN : has_profile
    USER ||--o| COMPANY : has_profile
    USER ||--o| STUDENT : has_profile
    COMPANY ||--o{ DRIVE : posts
    STUDENT ||--o{ APPLICATION : submits
    DRIVE ||--o{ APPLICATION : receives
    APPLICATION ||--o{ STAGE_ENTRY : tracks_history
    STUDENT ||--o{ OFFER : receives
    DRIVE ||--o{ OFFER : generates
    TRAINING_PROGRAM ||--o{ ENROLLMENT : registers
    STUDENT ||--o{ ENROLLMENT : attends
```

### Models Overview
1. **`User`**: Core identity table (`email`, `password`, `role: TPO | COMPANY | STUDENT`, `name`, `createdAt`, `updatedAt`).
2. **`TPOAdmin`**: Administrator profile associated with `User`.
3. **`Company`**: Corporate profile (`name`, `tier: TIER_1 | TIER_2 | TIER_3`, `industry`, `website`, `contactPerson`, `contactEmail`, `logo`).
4. **`Student`**: Candidate profile (`rollNo`, `branch: AI-DS | AI-ML | AR | IIOT`, `year`, `cgpa`, `backlogs`, `class10`, `class12`, `graduationYear`, `placementStatus`, `dreamEligible`, `resumeVerified`, `skillsJson`, `phone`).
5. **`Drive`**: Placement opening (`role`, `ctc`, `location`, `mode`, `deadline`, `driveDate`, `status`, `approvalStatus: PENDING | APPROVED | REJECTED`, `jobType`, `minCGPA`, `maxBacklogs`, `minClass10`, `minClass12`, `offerPolicy`, `branchesJson`, `roundsJson`, `gradYearsJson`).
6. **`Application`**: Candidate job application (`status: APPLIED | SHORTLISTED | INTERVIEW_SCHEDULED | OFFER_EXTENDED | OFFER_ACCEPTED | REJECTED | WITHDRAWN`, `appliedOn`, `resumeUrl`, `coverNote`).
7. **`StageEntry`**: Audit trail for candidate pipeline (`stage`, `date`, `note`, `interviewDate`).
8. **`Offer`**: Official compensation offer (`ctc`, `status: PENDING | ACCEPTED | DECLINED`, `offeredOn`, `deadline`).
9. **`TrainingProgram`**: Career prep module (`title`, `type: APTITUDE | SOFT_SKILLS | TECHNICAL | CERTIFICATION`, `date`, `time`, `venue`, `mode`, `capacity`, `facilitator`, `tagsJson`).
10. **`Enrollment`**: Student training attendance (`registeredAt`, `attended`).

---

## 3. Global Design System & Color Palette

| Token | Hex Value | UI Purpose |
|---|---|---|
| **Primary Orange** | `#F97316` | Main brand color, primary CTA buttons, active tabs, highlights |
| **Orange Hover** | `#EA580C` | Button hover state, interactive highlights |
| **Warm Background** | `#FFFAF6` | Platform-wide body canvas background |
| **Surface Pure** | `#FFFFFF` | Card surface, modal panels, table containers |
| **Stone Dark** | `#1C1917` | Primary typography, headers, modal titles |
| **Stone Muted** | `#78716C` | Subtitles, helper text, empty state descriptions |
| **Border Subtle** | `#E7E5E4` | Card dividers, input borders, table borders |
| **Success Emerald** | `#16A34A` | Approved status, Accepted offers, verified checkmarks |
| **Warning Amber** | `#D97706` | Pending TPO review badges, Interview scheduled chips |
| **Danger Rose** | `#DC2626` | Ineligible badges, Delete confirmations, error alerts |

---

## 4. Authentication & Role-Based Access Control (RBAC)

The platform provides a dual-layer security model:
1. **Server-Side Session Resolution (`lib/auth.ts`)**: Generates JWT payloads containing `{ userId, email, role, name, profileId }` stored in an `httpOnly`, `sameSite=lax` cookie named `tpc_auth`.
2. **Next.js Proxy/Middleware (`middleware.ts`)**: Intercepts requests to `/tpo/*`, `/company/*`, and `/student/*`, verifying user role clearance before allowing page render. Unauthorized requests are redirected to `/login`.

---

## 5. Complete Module, Component & UI Element Breakdown

### 5.1 Public & Authentication Layer

#### 1. Quick-Access Login Page (`/login` — `app/login/page.tsx`)
- **Container Box (`<div className="min-h-screen bg-[#FFFAF6] ...">`)**: Centered vertical flex layout with soft ambient warm off-white background.
- **University Crest & Title Header**:
  - `div.w-16.h-16.bg-orange-100`: Orange rounded-2xl icon container holding `GraduationCap`.
  - `h1.text-3xl.font-bold`: "GGSIPU Placement Cell".
  - `p.text-stone-500`: "Training & Placement Portal · Session 2023–24".
  - `span.badge`: Active Session pill with green checkmark.
- **Role Cards Grid (`div.grid.grid-cols-1.md:grid-cols-3`)**:
  - **TPO Admin Role Card**:
    - Border: Orange accent border on hover.
    - Icon: `GraduationCap` in orange circle.
    - Credentials Preview: `admin@ggsipu.ac.in` / `admin123`.
    - CTA Button: `Login as TPO Admin` with instant 1-click token dispatch.
  - **Recruiting Company Role Card**:
    - Border: Emerald accent border on hover.
    - Icon: `Building2` in green circle.
    - Credentials Preview: `hr@techcorp.io` / `company123`.
    - CTA Button: `Login as Company`.
  - **Student Role Card**:
    - Border: Amber accent border on hover.
    - Icon: `User` in orange circle.
    - Credentials Preview: `rohan@ipu.ac.in` / `student123`.
    - CTA Button: `Login as Student`.
- **Manual Credentials Drawer/Form (`div.bg-white.p-6`)**:
  - Email input box with Mail icon.
  - Password input box with Lock icon.
  - Submit button with animated loading spinner.
  - Error banner: Centered red alert message with `AlertCircle` icon on invalid credentials.

#### 2. User Registration Portal (`/signup` — `app/signup/page.tsx`)
- **Role Selector Pill Tabs**: Multi-tab switcher between `Student`, `Company`, and `TPO Admin`.
- **Common Details Box**: Name, institutional email, secure password with minimum 6 characters.
- **Dynamic Student Academic Sub-Form**:
  - Roll number text input.
  - **Branch Selector Dropdown**: Populated with `AI-DS`, `AI-ML`, `AR`, and `IIOT`.
  - Graduation Year dropdown (`2024`, `2025`, `2026`).
  - CGPA number input with 0.1 step accuracy.
  - Active Backlogs counter.
  - 10th & 12th percentage inputs.
- **Dynamic Company Sub-Form**:
  - Corporate industry sector text input.
  - Company tier selector (`Tier-1`, `Tier-2`, `Tier-3`).
  - Official website URL input.
  - Point of Contact (HR/Talent Acquisition lead name).
- **Form Action Footer**: Submit button + "Already registered? Login" anchor link.

---

### 5.2 Shared Platform Components

#### 1. Universal Sidebar Navigation (`components/shared/Sidebar.tsx`)
- **Container (`aside.w-[220px].h-screen.sticky.bg-white.shadow-sidebar`)**: Full-height sticky sidebar with clear border separation.
- **Placement Cell Branding Box**:
  - Orange graduation logo + "Placement Cell" heading.
  - Role subtitle pill (`GGSIPU Admin`, Company Name, Student Name).
- **TPO New Drive Fast Action Button**: Full-width primary orange `+ New Placement Drive` button leading straight to `/tpo/drives`.
- **Navigation Links Group**:
  - Active link state: Light orange background (`#FFF7ED`), bold text (`#EA580C`), and 4px solid orange left indicator border.
  - Inactive link state: Subtle stone gray text with light hover transition.
- **Sidebar Footer Box**:
  - Help Center modal trigger.
  - **Logout Action**: Calls `/api/auth/logout`, clears `localStorage`, and performs clean redirect to `/login`.

---

### 5.3 TPO Admin Portal (`/tpo`)

#### 1. TPO Overview Dashboard (`app/tpo/page.tsx`)
- **Header Action Bar**:
  - Page Title: "Dashboard Overview".
  - **Export NIRF Report Button**: Downloads current year placement statistics as a structured `.csv` payload.
- **NIRF Key Metrics KPI Cards Row (3 Cards)**:
  - **Total Placed Card**: Huge `89.4%` placed rate, green `↑ 2.1%` growth pill, subtext showing `Eligible: 2,450 | Placed: 2,190`.
  - **Average Package Card**: `₹12.4L` average CTC, green `↑ 8.5%` badge, median CTC and top 10% bracket breakdown.
  - **Highest Package Card (Featured Orange Container)**: `₹52.0L` domestic CTC offered by *Atlassian Corp* with secured offers badge.
- **Pending Company Drives Verification Banner**:
  - Highlighted amber warning container listing company drives submitted for approval.
  - Action buttons per drive: **`Approve & Publish`** (makes drive live for students) and **`Reject`**.
- **Two-Column Analytics Grid**:
  - **Left: Active Placement Drives Table**: Lists active drives, company name, role, CTC package, registration deadline, student applicant count, and real-time status pill.
  - **Right: Branch-wise Placement Horizontal Bar Chart**: Recharts visual bar chart mapping placement percentages across `AI-DS`, `AI-ML`, `AR`, and `IIOT`.
- **Monthly Offers Timeline Chart**: Interactive Recharts smooth line chart showing offer velocity from August to January.
- **Training Participation Metric Badges**: Aptitude (85%), Soft Skills (92%), Technical Certifications (64%).

#### 2. Drive Configuration, Dynamic Branches & Calendar Schedule (`app/tpo/drives/page.tsx` & `app/tpo/schedule/page.tsx`)
- **Left Control Panel (380px Configuration Drawer)**:
  - **Target Company Search Box**: Typeahead search matching registered companies with tier badges.
  - **Academic Eligibility Sliders & Controls**:
    - Minimum CGPA slider (0.0 to 10.0 with 0.1 step resolution).
    - Maximum Backlogs dropdown (`0 Strict`, `1`, `2`, `3`).
    - Class 12th & Class 10th minimum percentage cutoff boxes.
  - **Dynamic Branch Management Module**:
    - Shows all active university branches (`AI-DS`, `AI-ML`, `AR`, `IIOT`).
    - **Add Branch Trigger (`+ Add Branch`)**: Inline text box allowing TPO Admin to type any new branch and persist it platform-wide.
    - **Delete Branch Action (`×` icon)**: Instantly deletes the branch from the university roster.
    - Checkbox toggle to include/exclude branches for the specific drive.
  - **Graduation Year Pill Selectors**: Multi-select pills (`2024`, `2025`, `2026`) with add/remove year capability.
  - **Offer Governance Policy Radios**:
    - *Standard Policy*: Students with active offers excluded.
    - *One-Offer-One-Student*: Once a student accepts an offer, blocked from standard drives.
    - *Dream Offer*: Unlocked for high CTC packages (> ₹20 LPA) for top CGPA candidates.
  - **Live Eligible Student Counter**: Instant calculation badge showing exact count of students matching configured criteria.
- **Right Panel: Interactive Multi-View Calendar**:
  - Month navigation controls (`<`, `Month Year`, `>`), `Today` jump button, and `Month | Week | Day` view toggles.
  - 7-column calendar matrix (Sunday to Saturday) mapping placement drives to their assessment dates.
  - Tier-colored event chips: Tier-1 (Orange), Tier-2 (Blue), Tier-3 (Green).
  - **Day Cell Click Drawer**: Shows detailed schedule for that date, complete with **Edit Drive** and **Delete Drive** triggers.

#### 3. Applicant Pool & Resume Verification (`app/tpo/applicants/page.tsx`)
- **Global Filter Bar**:
  - Real-time search by candidate name or roll number.
  - **Branch Filter Dropdown**: Filter candidates by `All Branches`, `AI-DS`, `AI-ML`, `AR`, `IIOT`.
  - Placement Status dropdown (`All`, `Placed`, `Unplaced`).
  - Minimum CGPA numeric filter box.
- **Candidate Pool Roster Table**:
  - Candidate identity column: Initials avatar, student full name, roll number.
  - Branch column: `AI-DS`, `AI-ML`, `AR`, `IIOT` badge.
  - CGPA column: Color-coded (≥8.0 Green, ≥7.0 Orange, <7.0 Red).
  - Backlogs badge: Green `0 Backlogs` or Red `N Backlogs`.
  - Resume status: Green `✓ Verified` or Amber `Pending Review`.
  - Action button: **"View Profile"** opening slide-over drawer.
- **Candidate Detail Slide-Over Drawer (`z-[9999]`)**:
  - Full academic breakdown: 10th%, 12th%, CGPA, backlogs.
  - Technical skills chips.
  - Drive application history.
  - **Approve Resume Action**: Marks resume verified in database with instant feedback.
  - **Send Notification Action**: Opens modal to send direct messages to the student.

#### 4. NIRF Reports & Analytics Engine (`app/tpo/reports/page.tsx`)
- **KPI Summary Grid**: Total eligible students, total placed, placement rate, average CTC, median CTC, highest package.
- **Branch-wise Placement Report Table**: Full breakdown table for `AI-DS`, `AI-ML`, `AR`, `IIOT` (Eligible, Placed, Placed %, Avg CTC, Median CTC, Highest CTC) with sortable column headers.
- **CTC Distribution Histogram**: Recharts bar chart showing candidate counts across `< 6 LPA`, `6-10 LPA`, `10-15 LPA`, `15-25 LPA`, and `> 25 LPA (Dream)`.
- **NIRF Export Builder Box**:
  - Academic year selector dropdown.
  - Include data checkboxes (Median salary, higher studies, diversity ratio).
  - **Download CSV Action**: Generates standard NIRF-compliant CSV format.
  - **Print PDF Action**: Prepares print-optimized layout for university accreditation reports.

#### 5. Training Programs & Skill Development (`app/tpo/training/page.tsx`)
- **Participation KPI Cards**: Aptitude (85%), Soft Skills (92%), Technical Certifications (64%).
- **Training Programs Schedule List**:
  - Cards displaying program title, category badge (`Technical`, `Aptitude`, `Soft Skills`, `Certification`), date & time, venue, mode (`Offline`, `Online`, `Hybrid`), and facilitator.
  - Capacity progress bar showing registered vs total available seats.
- **Create Training Program Modal**: Modal to schedule new workshops and training modules.

---

### 5.4 Recruiting Company Portal (`/company`)

#### 1. Company Recruitment Overview (`app/company/page.tsx`)
- **Live Recruitment Header**: Shows logged-in company name and "+ Post New Drive" shortcut button.
- **Company KPI Metric Cards (4 Cards)**:
  - *Our Active Drives*: Count of active drives posted by our company.
  - *Total Candidates*: Total applicants registered for our drives.
  - *Shortlisted Candidates*: Candidates advanced to interview or technical rounds.
  - *Offers Extended*: Offers rolled out by our talent team.
- **"Our Active Drives" Live Container**:
  - Connected directly to live database backend.
  - Shows drive role, CTC package, work mode, assessment date, and applicant counter.
  - Direct link to candidate pipeline for that drive.
- **Application Funnel Chart**: Vertical bar visualization showing conversion from *Applied → Shortlisted → Interview Scheduled → Offer Extended*.

#### 2. Our Placement Drives Management (`app/company/drives/page.tsx`)
- **Fast-Sync Real-Time Notification Banner**: Displays animated micro-indicator during background database synchronization (`⚡ Fast-Sync: Updating drive changes in real-time...`).
- **Tab Filter Bar**: `All`, `Active`, `Pending TPO`, `Upcoming`, `Completed`.
- **Search Bar**: Instant filter by job role title.
- **Placement Drive Cards Grid**:
  - Job type badge (`Full Time`, `Internship`, `PPO`).
  - Role title, company name, CTC compensation highlight in orange (`₹12.0 LPA`).
  - Work mode (`Hybrid`, `Onsite`, `Remote`) and location.
  - Academic eligibility summary (Min CGPA, Backlogs, Eligible Branches `AI-DS`, `AI-ML`, `AR`, `IIOT`).
  - Action Bar:
    - **Edit Drive Button**: Opens pre-filled edit modal with zero-lag optimistic updates.
    - **Delete Drive Button**: Opens styled confirmation dialog (`z-[9999]`) and cascade-deletes drive and applicant records.
- **Create & Edit Drive Modals (`z-[9999]`)**:
  - Job Role Title input box.
  - CTC Package (LPA) decimal input.
  - Mode selector (`Hybrid`, `Onsite`, `Remote`).
  - Application Deadline and Assessment Drive Date pickers.
  - Academic eligibility sliders (Min CGPA, Max Backlogs).
  - **Dynamic Branch Multi-Select Buttons**: Populated from `/api/branches` (`AI-DS`, `AI-ML`, `AR`, `IIOT`).
  - Offer Policy selection radio.

#### 3. Candidate Pipeline & Kanban Shortlisting (`app/company/applicants/page.tsx`)
- **Drive Selector Dropdown**: Switches pipeline context between different company drives.
- **4-Stage Kanban Pipeline**:
  1. **Applied Column**: Newly submitted candidate applications.
  2. **Under Review / Shortlisted Column**: Candidates selected for technical rounds.
  3. **Interview Scheduled Column**: Candidates with scheduled interviews.
  4. **Offer Extended Column**: Candidates who have received official compensation offers.
- **Candidate Kanban Cards**:
  - Initials avatar, candidate name, roll number, and branch tag (`AI-DS`, `AI-ML`, `AR`, `IIOT`).
  - CGPA pill and key skills preview.
  - **Advance Stage Arrow Button (`→`)**: Instantly advances candidate to the next recruitment stage with transactional database sync.
  - **Reject Action (`×`)**: Marks candidate rejected with optional feedback note.
- **Candidate Full Profile Slide-Over Drawer**: Shows full academic transcript, 10th/12th percentages, and resume link.

#### 4. Our Offer Management & Real-Time Reminders (`app/company/offers/page.tsx`)
- **Scope Isolation**: Strictly filtered to show offers extended by the authenticated company only.
- **Policy Governance Banner**: Explains One-Offer-One-Student rules and candidate locking.
- **Offer Metrics Row**: Total Offers Extended, Pending Student Decision, Accepted Offers.
- **Offers Roster Table**:
  - Candidate name, roll number, and branch.
  - Role, drive title, and extended CTC package.
  - Status badge: Amber `Pending Student Response` or Emerald `Accepted ✓`.
  - **Functional "Send Reminder" Action**:
    - Clicking button opens personalized reminder modal.
    - Dispatches urgent notification via `/api/notifications`.
    - Immediately alerts student on their dashboard and notification bell.
- **Bulk Reminder Button**: Broadcasts an acceptance deadline reminder to all candidates with pending offers.

---

### 5.5 Student Portal (`/student`)

#### 1. Student Dashboard (`app/student/page.tsx`)
- **Urgent Recruiter Reminder Alert Banner (`z-20`)**:
  - Live animated high-priority notification container.
  - Displays urgent recruiter reminders sent by companies (e.g. *⚡ Recruiter Reminder from TechCorp: Please review and respond to our Software Engineer offer*).
  - One-click shortcut button linking directly to `/student/applications`.
- **Top Welcome Bar**: Personalized greeting ("Welcome back, Rohan") and "Update Resume" action button.
- **Two-Column Dashboard Layout**:
  - **Left: Eligible Upcoming Drives**:
    - Displays drives matching the student's branch (`AI-DS`), CGPA, and backlog record.
    - **Green "ELIGIBLE" Badge**: Shows matching drives with 1-click **"Apply Now"** button.
    - **Pink "INELIGIBLE" Badge**: Explains precise disqualification reason (e.g., *CGPA below 8.0*).
  - **Right: Placement Readiness & Resume Status**:
    - Profile completion meter (85%) with checklist (Resume, CGPA, Backlogs, Training).
    - Resume verification status card verified by TPO office.
    - Dream Offer Eligibility status container (`CGPA 8.7 qualifies for > ₹20L packages`).

#### 2. Browse & Apply to Placement Drives (`app/student/drives/page.tsx`)
- **Search & Filter Controls**: Filter by company name, role title, job type (`Full Time`, `Internship`, `PPO`), and minimum CTC package slider.
- **Drive Cards List**:
  - Company tier badge, role title, location, mode, compensation (`₹18.0 LPA`), and application deadline countdown (*X days left*).
  - Eligibility badge with detailed rule check.
  - **"Apply Now" Button**:
    - Opens formal application submission modal.
    - Allows optional cover note entry.
    - Submits application in real-time via `/api/applications` and disables subsequent duplicate submissions.

#### 3. My Applications & Offer Decision Hub (`app/student/applications/page.tsx`)
- **Tab Filters**: `All Applications`, `Active`, `Offers Received`, `Rejected`.
- **Application Detail Cards**:
  - Company name, role, applied date, and live status badge.
  - **Interactive Step Timeline**: Vertical visual stepper tracking application journey (*Applied → Shortlisted → Interview Scheduled → Offer Extended*).
  - **Offer Decision Action Bar (When Offer is Extended)**:
    - **`Accept Offer` Button (Emerald)**: Confirms offer acceptance, marks student as `PLACED` in database, and locks candidate from conflicting standard drives.
    - **`Decline Offer` Button (Red)**: Releases offer and notifies company.

#### 4. Training Programs & Schedule (`app/student/training/page.tsx`)
- **Training Roster**: Category filters (`Technical`, `Aptitude`, `Soft Skills`, `Certification`).
- **Program Card Controls**: Shows venue, instructor, and seat availability with 1-click **"Register"** and **"Enrolled ✓"** state toggle.

#### 5. Student Profile & Transcript (`app/student/profile/page.tsx`)
- **Profile Header**: Avatar circle with initials, student name, roll number, and branch (`AI-DS`).
- **Academic Transcript Tabs**:
  - *Academic*: Verified CGPA, 10th%, 12th%, active backlogs, graduation year, branch.
  - *Skills*: Dynamic skills chips with add/remove capability.
  - *Achievements & Certifications*: External credentials (AWS, Meta, Hackathon accolades).

---

## 6. Backend API Routes & Handlers Specification

| Endpoint | Method | Role Access | Functionality & Payload |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Validates credentials via bcryptjs, signs JWT, sets `tpc_auth` httpOnly cookie. |
| `/api/auth/logout` | `POST` | Authenticated | Clears `tpc_auth` cookie and terminates session. |
| `/api/auth/me` | `GET` | Authenticated | Returns current authenticated user payload. |
| `/api/auth/signup` | `POST` | Public | Registers new Student, Company, or TPO user with profile relations. |
| `/api/branches` | `GET` | Authenticated | Retrieves current list of active university branches (`AI-DS`, `AI-ML`, `AR`, `IIOT`). |
| `/api/branches` | `POST` | `TPO` | Adds a new branch to the university roster with persistent storage. |
| `/api/branches` | `DELETE` | `TPO` | Deletes a branch from the active branches roster. |
| `/api/drives` | `GET` | Authenticated | Fetches drives. Scoped to company's own drives for `COMPANY` role. |
| `/api/drives` | `POST` | `TPO`, `COMPANY` | Creates placement drive. `COMPANY` drives start as `PENDING`; `TPO` drives as `APPROVED`. |
| `/api/drives/[id]` | `PUT` | `TPO`, `COMPANY` | Updates drive details or approves/rejects drive (`TPO` only). |
| `/api/drives/[id]` | `DELETE` | `TPO`, `COMPANY` | Cascade-deletes drive and associated application/offer records. |
| `/api/drives/eligible` | `GET` | `STUDENT` | Evaluates all active drives against student's CGPA, backlogs, branch, and policy. |
| `/api/applications` | `GET` | Authenticated | Fetches applications. Scoped by student for `STUDENT`, and by company for `COMPANY`. |
| `/api/applications` | `POST` | `STUDENT` | Submits candidate application after verifying eligibility and offer constraints. |
| `/api/applications/[id]` | `PUT` | `TPO`, `COMPANY`, `STUDENT` | Advances recruitment stage (*Shortlisted, Interview, Offer Extended, Offer Accepted*). |
| `/api/students` | `GET` | `TPO` | Retrieves student roster with filters for branch, CGPA, and placement status. |
| `/api/students/[id]` | `PUT` | `TPO`, `STUDENT` | Updates student profile, verification status, and skills. |
| `/api/companies` | `GET` | Authenticated | Retrieves registered recruiting companies with drive counts. |
| `/api/notifications` | `GET` | Authenticated | Returns real-time notification feed and unread counter tailored to user role. |
| `/api/notifications` | `POST` | `COMPANY`, `TPO` | Dispatches real-time recruiter reminders and notifications to students. |
| `/api/training` | `GET`, `POST` | Authenticated | Manages training programs and workshops. |
| `/api/training/[id]/enroll` | `POST`, `DELETE` | `STUDENT` | Enrolls or un-enrolls student from career training workshops. |
| `/api/reports/stats` | `GET` | `TPO` | Aggregates real-time NIRF statistics, branch-wise placement metrics, and CTC bands. |
| `/api/reports/nirf` | `GET` | `TPO` | Generates official accreditation dataset for CSV/PDF export. |

---

## 7. Real-Time Engine & Optimistic UI Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Recruiter / Admin / Student
    participant UI as Next.js React Component
    participant SWR as SWR Client Cache
    participant API as Next.js Route Handler
    participant DB as Supabase PostgreSQL

    User->>UI: Clicks Action (e.g. Edit Drive / Send Reminder)
    UI->>SWR: 1. Optimistic Update (UI updates in <20ms)
    UI->>API: 2. Background Asynchronous API Call
    API->>DB: 3. Execute Prisma Transaction
    DB-->>API: 4. Success Response
    API-->>UI: 5. Confirmation
    UI->>SWR: 6. Revalidate Cache & Sync Peers (2s polling)
```

1. **Optimistic State Updates**: All critical operations (editing drives, deleting drives, advancing candidate stages, sending reminders) update local state instantly, providing zero-lag feedback.
2. **Real-Time Polling Engine**: Key endpoints (`/api/notifications`, `/api/drives`, `/api/applications`) use SWR automatic background revalidation at `2000ms–4000ms` intervals.
3. **Persistent Recruiter Reminders**: Reminders sent by companies are stored in the real-time notification pipeline and appear immediately on the student's dashboard.

---

## 8. Policy & Eligibility Engine (NIRF, Dream Offer, One-Offer)

The platform enforces strict placement governance rules:

### 1. Academic Cutoff Enforcement
A student is eligible for a drive if and only if:
$$\text{CGPA} \ge \text{MinCGPA} \quad \land \quad \text{Backlogs} \le \text{MaxBacklogs} \quad \land \quad \text{Branch} \in \text{EligibleBranches} \quad \land \quad 10\text{th}\% \ge \text{Min10th} \quad \land \quad 12\text{th}\% \ge \text{Min12th}$$

### 2. Offer Governance Policies
- **Standard Policy**: Candidate can apply until they receive and accept an offer.
- **One-Offer-One-Student Policy**: Once a candidate accepts an offer, they are marked `PLACED` and restricted from applying to further standard drives to maximize university-wide placement rate.
- **Dream Offer Exception**: High-value drives ($\text{CTC} \ge ₹20\text{ LPA}$) with policy set to `DREAM_OFFER` remain unlocked for high-performing placed candidates ($\text{CGPA} \ge 8.5$).

---

## 9. Dynamic University Branch Management System

The university branch system is fully dynamic and controlled by the TPO Administrator:
- **Default Core Branches**: `AI-DS` (Artificial Intelligence & Data Science), `AI-ML` (Artificial Intelligence & Machine Learning), `AR` (Augmented Reality), and `IIOT` (Industrial Internet of Things).
- **Runtime Addition**: TPO Admin can add any emerging engineering specialization (e.g., `CYBER-SECURITY`, `ROBOTICS`) via the Drive Configuration interface.
- **Runtime Removal**: TPO Admin can remove obsolete branches.
- **Universal Sync**: Branch roster changes immediately update company drive creation forms, candidate filters, student profiles, and NIRF analytical charts.

---

## 10. Local Development, Environment Variables & Deployment

### 1. Environment Configuration (`.env`)
```env
# Direct PostgreSQL connection on Port 5432 (Pool connection limit = 20)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connection_limit=20"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT Authentication Secret
JWT_SECRET="tpc-platform-secret-key-ggsipu-2024-change-in-production"
JWT_EXPIRES_IN="7d"

# Public App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Installation & Setup
```bash
# 1. Clone repository and navigate to folder
cd tpc-platform

# 2. Install dependencies
npm install

# 3. Push schema to Supabase PostgreSQL database
npx prisma db push

# 4. Seed initial placement data and accounts
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev
```

### 3. Verification & Build
```bash
# Run full Next.js production build and TypeScript verification
npm run build
```

---

## 👥 Demo Login Credentials

| Role | Email | Password | Direct Portal Route |
|---|---|---|---|
| **TPO Admin** | `admin@ggsipu.ac.in` | `admin123` | [`/tpo`](http://localhost:3000/tpo) |
| **Recruiting Company** | `hr@techcorp.io` | `company123` | [`/company`](http://localhost:3000/company) |
| **Student** | `rohan@ipu.ac.in` | `student123` | [`/student`](http://localhost:3000/student) |

---

*© 2024–2026 Training & Placement Cell, Guru Gobind Singh Indraprastha University (GGSIPU), New Delhi.*
