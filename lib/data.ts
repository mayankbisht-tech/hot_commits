import { Student, Company, Drive, Application, TrainingProgram, PlacementStats } from "@/types";

// ─── Companies ───────────────────────────────────────────────────────────────
export const companies: Company[] = [
  { id: "c1", name: "TechCorp Innovations", tier: "Tier-1", industry: "Software Engineering", website: "https://techcorp.io", contactPerson: "Arjun Sharma", contactEmail: "arjun@techcorp.io", logo: "TC" },
  { id: "c2", name: "Google India", tier: "Tier-1", industry: "Technology", website: "https://google.co.in", contactPerson: "Priya Nair", contactEmail: "priya@google.com", logo: "G" },
  { id: "c3", name: "Microsoft India", tier: "Tier-1", industry: "Technology", website: "https://microsoft.com", contactPerson: "Rahul Verma", contactEmail: "rahul@microsoft.com", logo: "MS" },
  { id: "c4", name: "Atlassian Corp", tier: "Tier-1", industry: "SaaS", website: "https://atlassian.com", contactPerson: "Sneha Gupta", contactEmail: "sneha@atlassian.com", logo: "AT" },
  { id: "c5", name: "Global FinServ", tier: "Tier-2", industry: "Finance", website: "https://globalfinserv.com", contactPerson: "Ankit Jain", contactEmail: "ankit@gfs.com", logo: "GF" },
  { id: "c6", name: "TCS Digital", tier: "Tier-2", industry: "IT Services", website: "https://tcs.com", contactPerson: "Kavya Reddy", contactEmail: "kavya@tcs.com", logo: "TCS" },
  { id: "c7", name: "Nexus Systems", tier: "Tier-1", industry: "Cloud Computing", website: "https://nexus.io", contactPerson: "Rohit Bansal", contactEmail: "rohit@nexus.io", logo: "NS" },
  { id: "c8", name: "CreativeMinds Agency", tier: "Tier-3", industry: "Design & Marketing", website: "https://creativeminds.in", contactPerson: "Pooja Shah", contactEmail: "pooja@cm.in", logo: "CM" },
  { id: "c9", name: "Amazon India", tier: "Tier-1", industry: "E-Commerce / Cloud", website: "https://amazon.in", contactPerson: "Vikram Singh", contactEmail: "vikram@amazon.com", logo: "AMZ" },
  { id: "c10", name: "Infosys BPM", tier: "Tier-2", industry: "IT Services", website: "https://infosys.com", contactPerson: "Meena Patel", contactEmail: "meena@infosys.com", logo: "INF" },
];

// ─── Students (Branches: AI-DS, AI-ML, AR, IIOT | Grad Years: 2027, 2028, 2029, 2030) ───
export const students: Student[] = [
  { id: "s1", name: "Rohan Mehta", rollNo: "07114803121", branch: "AI-DS", year: 4, cgpa: 8.7, backlogs: 0, email: "rohan@ipu.ac.in", phone: "9811234567", class10: 91, class12: 88, graduationYear: 2027, placementStatus: "placed", dreamOfferEligible: true, activeOffers: ["a3"], appliedDrives: ["d1","d2","d3"], resumeVerified: true, skills: ["React","Node.js","Python","SQL"], avatar: "RM" },
  { id: "s2", name: "Priya Kapoor", rollNo: "07214803121", branch: "AI-ML", year: 4, cgpa: 7.8, backlogs: 0, email: "priya.k@ipu.ac.in", phone: "9812345678", class10: 86, class12: 82, graduationYear: 2027, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: ["d2","d4"], resumeVerified: true, skills: ["Java","Spring Boot","MySQL"], avatar: "PK" },
  { id: "s3", name: "Amit Verma", rollNo: "07314803121", branch: "AR", year: 3, cgpa: 6.9, backlogs: 1, email: "amit.v@ipu.ac.in", phone: "9813456789", class10: 79, class12: 75, graduationYear: 2028, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: ["d5"], resumeVerified: false, skills: ["Embedded C","Unity","Unreal Engine"], avatar: "AV" },
  { id: "s4", name: "Sneha Gupta", rollNo: "07414803121", branch: "AI-DS", year: 4, cgpa: 9.2, backlogs: 0, email: "sneha.g@ipu.ac.in", phone: "9814567890", class10: 96, class12: 94, graduationYear: 2027, placementStatus: "placed", dreamOfferEligible: true, activeOffers: ["a4"], appliedDrives: ["d1","d6"], resumeVerified: true, skills: ["Python","ML","TensorFlow","Data Analysis"], avatar: "SG" },
  { id: "s5", name: "Karan Singh", rollNo: "07514803121", branch: "IIOT", year: 2, cgpa: 7.2, backlogs: 0, email: "karan.s@ipu.ac.in", phone: "9815678901", class10: 83, class12: 80, graduationYear: 2029, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: [], resumeVerified: true, skills: ["IoT","MQTT","Sensors","Embedded"], avatar: "KS" },
  { id: "s6", name: "Anjali Sharma", rollNo: "07614803121", branch: "AI-ML", year: 4, cgpa: 8.3, backlogs: 0, email: "anjali.s@ipu.ac.in", phone: "9816789012", class10: 89, class12: 85, graduationYear: 2027, placementStatus: "placed", dreamOfferEligible: true, activeOffers: ["a5"], appliedDrives: ["d2","d3","d4"], resumeVerified: true, skills: ["Angular","TypeScript","PyTorch","NLP"], avatar: "AS" },
  { id: "s7", name: "Nikhil Rao", rollNo: "07714803121", branch: "AI-DS", year: 3, cgpa: 7.5, backlogs: 0, email: "nikhil.r@ipu.ac.in", phone: "9817890123", class10: 85, class12: 81, graduationYear: 2028, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: ["d1","d5"], resumeVerified: true, skills: ["Go","Kubernetes","Docker","AWS"], avatar: "NR" },
  { id: "s8", name: "Divya Jain", rollNo: "07814803121", branch: "IIOT", year: 1, cgpa: 6.4, backlogs: 0, email: "divya.j@ipu.ac.in", phone: "9818901234", class10: 74, class12: 71, graduationYear: 2030, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: [], resumeVerified: false, skills: ["Robotics","PLC","Edge AI"], avatar: "DJ" },
  { id: "s9", name: "Aryan Patel", rollNo: "07914803121", branch: "AR", year: 4, cgpa: 8.9, backlogs: 0, email: "aryan.p@ipu.ac.in", phone: "9819012345", class10: 93, class12: 90, graduationYear: 2027, placementStatus: "placed", dreamOfferEligible: true, activeOffers: ["a6"], appliedDrives: ["d1","d2","d6"], resumeVerified: true, skills: ["Flutter","Computer Vision","OpenCV"], avatar: "AP" },
  { id: "s10", name: "Meera Nair", rollNo: "08014803121", branch: "AI-ML", year: 3, cgpa: 7.6, backlogs: 0, email: "meera.n@ipu.ac.in", phone: "9810123456", class10: 87, class12: 83, graduationYear: 2028, placementStatus: "unplaced", dreamOfferEligible: false, activeOffers: [], appliedDrives: ["d3","d4"], resumeVerified: true, skills: ["Python","Django","Deep Learning","PostgreSQL"], avatar: "MN" },
];

// ─── Drives (Dates: August–September 2026 | Grad Years: 2027, 2028, 2029, 2030) ───
export const drives: Drive[] = [
  {
    id: "d1", companyId: "c1", companyName: "TechCorp Innovations", companyTier: "Tier-1",
    role: "Software Development Engineer", ctc: 12, location: "Bangalore / Remote", mode: "Hybrid",
    deadline: "2026-08-25", driveDate: "2026-08-29", status: "active",
    eligibility: { minCGPA: 7.5, maxBacklogs: 0, branches: ["AI-DS","AI-ML","AR"], graduationYears: [2027, 2028], minClass10: 75, minClass12: 75, offerPolicy: "standard" },
    totalApplicants: 84, shortlisted: 24, offers: 6, description: "SDE-1 role focused on backend development using Go and Kubernetes.",
    jobType: "Full-Time", rounds: ["Online Test","Technical Interview 1","Technical Interview 2","HR"], approvalStatus: "approved"
  },
  {
    id: "d2", companyId: "c3", companyName: "Microsoft India", companyTier: "Tier-1",
    role: "Product Engineer", ctc: 18, location: "Hyderabad", mode: "Onsite",
    deadline: "2026-08-28", driveDate: "2026-09-02", status: "active",
    eligibility: { minCGPA: 8.0, maxBacklogs: 0, branches: ["AI-DS","AI-ML"], graduationYears: [2027], minClass10: 80, minClass12: 80, offerPolicy: "one_offer" },
    totalApplicants: 56, shortlisted: 16, offers: 4, description: "Product Engineering role at Microsoft Azure division.",
    jobType: "Full-Time", rounds: ["Coding Round","Design Interview","Behavioral"], approvalStatus: "approved"
  },
  {
    id: "d3", companyId: "c7", companyName: "Nexus Systems", companyTier: "Tier-1",
    role: "Cloud Architect", ctc: 22, location: "Gurgaon", mode: "Onsite",
    deadline: "2026-08-26", driveDate: "2026-08-31", status: "active",
    eligibility: { minCGPA: 7.0, maxBacklogs: 0, branches: ["AI-DS","AI-ML","AR","IIOT"], graduationYears: [2027, 2028, 2029], minClass10: 70, minClass12: 70, offerPolicy: "dream_offer" },
    totalApplicants: 102, shortlisted: 30, offers: 8, description: "Cloud infrastructure design for large-scale distributed systems.",
    jobType: "Full-Time", rounds: ["Aptitude","Technical","Case Study","HR"], approvalStatus: "approved"
  },
  {
    id: "d4", companyId: "c5", companyName: "Global FinServ", companyTier: "Tier-2",
    role: "Data Analyst", ctc: 8.5, location: "Gurgaon", mode: "Onsite",
    deadline: "2026-09-05", driveDate: "2026-09-10", status: "upcoming",
    eligibility: { minCGPA: 8.0, maxBacklogs: 0, branches: ["AI-DS","AI-ML","AR"], graduationYears: [2027, 2028], minClass10: 80, minClass12: 80, offerPolicy: "standard" },
    totalApplicants: 38, shortlisted: 12, offers: 0, description: "Financial data analytics and reporting using Python and Tableau.",
    jobType: "Full-Time", rounds: ["Aptitude","SQL Test","HR"], approvalStatus: "approved"
  },
  {
    id: "d5", companyId: "c6", companyName: "TCS Digital", companyTier: "Tier-2",
    role: "System Engineer", ctc: 7, location: "Pan India", mode: "Onsite",
    deadline: "2026-09-12", driveDate: "2026-09-18", status: "upcoming",
    eligibility: { minCGPA: 6.0, maxBacklogs: 2, branches: ["AI-DS","AI-ML","AR","IIOT"], graduationYears: [2027, 2028, 2029, 2030], minClass10: 60, minClass12: 60, offerPolicy: "standard" },
    totalApplicants: 210, shortlisted: 80, offers: 0, description: "Systems integration and application development for enterprise clients.",
    jobType: "Full-Time", rounds: ["NQT","Technical","HR"], approvalStatus: "approved"
  },
  {
    id: "d6", companyId: "c4", companyName: "Atlassian Corp", companyTier: "Tier-1",
    role: "Senior Software Engineer", ctc: 52, location: "Sydney / Remote", mode: "Remote",
    deadline: "2026-09-15", driveDate: "2026-09-22", status: "upcoming",
    eligibility: { minCGPA: 9.0, maxBacklogs: 0, branches: ["AI-DS","AI-ML"], graduationYears: [2027], minClass10: 85, minClass12: 85, offerPolicy: "dream_offer" },
    totalApplicants: 12, shortlisted: 5, offers: 2, description: "Remote SSE role. Dream offer — highest domestic package this season.",
    jobType: "Full-Time", rounds: ["Take-Home","System Design","Pair Programming","HR"], approvalStatus: "approved"
  },
  {
    id: "d7", companyId: "c9", companyName: "Amazon India", companyTier: "Tier-1",
    role: "SDE-1 (AWS)", ctc: 26, location: "Bangalore", mode: "Hybrid",
    deadline: "2026-09-20", driveDate: "2026-09-25", status: "upcoming",
    eligibility: { minCGPA: 7.5, maxBacklogs: 0, branches: ["AI-DS","AI-ML"], graduationYears: [2027, 2028], minClass10: 75, minClass12: 75, offerPolicy: "one_offer" },
    totalApplicants: 0, shortlisted: 0, offers: 0, description: "AWS infrastructure and cloud services engineering.",
    jobType: "Full-Time", rounds: ["OA","Technical x3","Bar Raiser","HR"], approvalStatus: "pending"
  },
];

// ─── Applications ─────────────────────────────────────────────────────────────
export const applications: Application[] = [
  {
    id: "a1", studentId: "s1", studentName: "Rohan Mehta", driveId: "d1", driveName: "SDE-1", companyName: "TechCorp Innovations",
    appliedOn: "2026-08-20", status: "shortlisted", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Shortlisted", date: "2026-08-21", note: "Selected for technical rounds" },
    ]
  },
  {
    id: "a2", studentId: "s1", studentName: "Rohan Mehta", driveId: "d2", driveName: "Product Engineer", companyName: "Microsoft India",
    appliedOn: "2026-08-20", status: "interview_scheduled", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Shortlisted", date: "2026-08-21" },
      { stage: "Interview Scheduled", date: "2026-08-22", note: "Round 2 Design on Aug 28, 2:00 PM" },
    ]
  },
  {
    id: "a3", studentId: "s1", studentName: "Rohan Mehta", driveId: "d3", driveName: "Cloud Architect", companyName: "Nexus Systems",
    appliedOn: "2026-08-20", status: "offer_extended", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Shortlisted", date: "2026-08-21" },
      { stage: "Interview Scheduled", date: "2026-08-22" },
      { stage: "Offer Extended", date: "2026-08-23", note: "CTC: 22 LPA. Response deadline: Aug 30" },
    ]
  },
  {
    id: "a4", studentId: "s4", studentName: "Sneha Gupta", driveId: "d1", driveName: "SDE-1", companyName: "TechCorp Innovations",
    appliedOn: "2026-08-20", status: "offer_extended", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Shortlisted", date: "2026-08-21" },
      { stage: "Offer Extended", date: "2026-08-22", note: "CTC: 12 LPA" },
    ]
  },
  {
    id: "a5", studentId: "s6", studentName: "Anjali Sharma", driveId: "d3", driveName: "Cloud Architect", companyName: "Nexus Systems",
    appliedOn: "2026-08-20", status: "offer_extended", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Offer Extended", date: "2026-08-22", note: "CTC: 22 LPA" },
    ]
  },
  {
    id: "a6", studentId: "s9", studentName: "Aryan Patel", driveId: "d6", driveName: "Senior Software Engineer", companyName: "Atlassian Corp",
    appliedOn: "2026-08-20", status: "offer_extended", resumeUrl: "#",
    stageHistory: [
      { stage: "Applied", date: "2026-08-20" },
      { stage: "Offer Extended", date: "2026-08-23", note: "Dream Offer — CTC: 52 LPA" },
    ]
  },
];

// ─── Training Programs (August–September 2026) ────────────────────────────────
export const trainingPrograms: TrainingProgram[] = [
  { id: "tp1", title: "Advanced Java & AI Systems Prep", type: "technical", date: "2026-08-24", time: "10:00 AM – 1:00 PM", venue: "Seminar Hall A", mode: "Offline", capacity: 150, registeredCount: 135, attendedCount: 120, facilitator: "Dr. Ramesh Kumar", description: "Hands-on preparation for enterprise cloud and AI microservices.", tags: ["Java", "AI", "Cloud"] },
  { id: "tp2", title: "Quantitative Aptitude Workshop", type: "aptitude", date: "2026-08-27", time: "2:00 PM – 5:00 PM", venue: "Block B, Lab 3", mode: "Offline", capacity: 400, registeredCount: 340, attendedCount: 310, facilitator: "Prof. Anita Mathur", description: "Speed math, probability, permutation & combination for placement tests.", tags: ["Aptitude", "Quant", "Verbal"] },
  { id: "tp3", title: "Corporate Communication & Leadership", type: "soft_skills", date: "2026-08-30", time: "11:30 AM – 1:00 PM", venue: "Online (Zoom)", mode: "Online", capacity: 250, registeredCount: 230, attendedCount: 205, facilitator: "Ms. Shweta Agarwal", description: "Email etiquette, group discussion strategies, and executive presence.", tags: ["Communication", "GD", "HR"] },
  { id: "tp4", title: "AWS Cloud & DevOps Bootcamp", type: "certification", date: "2026-09-05", time: "9:00 AM – 4:00 PM", venue: "Computer Lab 2", mode: "Hybrid", capacity: 100, registeredCount: 64, attendedCount: 55, facilitator: "Mr. Suresh Pillai", description: "Full-day hands-on AWS console training and exam readiness.", tags: ["AWS", "Cloud", "DevOps"] },
  { id: "tp5", title: "Distributed System Design Masterclass", type: "technical", date: "2026-09-12", time: "3:00 PM – 6:00 PM", venue: "Seminar Hall B", mode: "Online", capacity: 200, registeredCount: 178, attendedCount: 160, facilitator: "Mr. Vikram Batra (Ex-Google)", description: "High-level architecture, scalability, caching, and database sharding.", tags: ["System Design", "Architecture"] },
  { id: "tp6", title: "Mock Technical Interview Series", type: "soft_skills", date: "2026-09-18", time: "10:00 AM – 5:00 PM", venue: "Placement Cell", mode: "Offline", capacity: 100, registeredCount: 88, attendedCount: 80, facilitator: "TPO Staff & Alumni", description: "1-on-1 mock interviews with structured rubrics and video playback feedback.", tags: ["Mock", "Interview", "HR"] },
];

// ─── Placement Statistics (Session 2026) ──────────────────────────────────────
export const placementStats: PlacementStats = {
  academicYear: "2026-2027",
  totalEligible: 2450,
  totalPlaced: 2190,
  averageCTC: 12.4,
  medianCTC: 10.5,
  highestCTC: 52.0,
  highestCTCCompany: "Atlassian Corp",
  branchStats: [
    { branch: "AI-DS", eligible: 650, placed: 605, avgCTC: 14.5, medianCTC: 12.0, highestCTC: 52.0 },
    { branch: "AI-ML", eligible: 620, placed: 570, avgCTC: 13.8, medianCTC: 11.5, highestCTC: 48.0 },
    { branch: "AR", eligible: 580, placed: 510, avgCTC: 10.5, medianCTC: 9.0, highestCTC: 28.0 },
    { branch: "IIOT", eligible: 600, placed: 505, avgCTC: 9.8, medianCTC: 8.5, highestCTC: 24.0 },
  ],
  ctcBands: [
    { band: "< 6 LPA", count: 280 },
    { band: "6 - 10 LPA", count: 750 },
    { band: "10 - 15 LPA", count: 620 },
    { band: "15 - 25 LPA", count: 390 },
    { band: "> 25 LPA (Dream)", count: 150 },
  ],
  monthlyOffers: [
    { month: "Aug", offers: 320 },
    { month: "Sep", offers: 580 },
    { month: "Oct", offers: 740 },
    { month: "Nov", offers: 620 },
    { month: "Dec", offers: 410 },
    { month: "Jan", offers: 290 },
  ],
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
export function isStudentEligible(
  student: Student,
  drive: Drive
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (student.cgpa < drive.eligibility.minCGPA) {
    reasons.push(`CGPA ${student.cgpa} is below minimum required ${drive.eligibility.minCGPA}`);
  }
  if (student.backlogs > drive.eligibility.maxBacklogs) {
    reasons.push(`${student.backlogs} active backlog(s) exceeds maximum allowed ${drive.eligibility.maxBacklogs}`);
  }
  if (!drive.eligibility.branches.includes(student.branch)) {
    reasons.push(`Branch ${student.branch} is not in eligible branches: ${drive.eligibility.branches.join(", ")}`);
  }
  if (!drive.eligibility.graduationYears.includes(student.graduationYear)) {
    reasons.push(`Graduation year ${student.graduationYear} is not eligible`);
  }
  if (student.class10 < drive.eligibility.minClass10) {
    reasons.push(`Class 10th marks (${student.class10}%) below minimum ${drive.eligibility.minClass10}%`);
  }
  if (student.class12 < drive.eligibility.minClass12) {
    reasons.push(`Class 12th marks (${student.class12}%) below minimum ${drive.eligibility.minClass12}%`);
  }
  if (drive.eligibility.offerPolicy === "one_offer" && student.placementStatus === "placed" && !student.dreamOfferEligible) {
    reasons.push("Already placed — blocked under One-Offer Policy");
  }
  if (drive.eligibility.offerPolicy === "dream_offer" && !student.dreamOfferEligible) {
    reasons.push("Not eligible for Dream Offer tier (requires CGPA >= 8.5)");
  }

  return { eligible: reasons.length === 0, reasons };
}

export function computeEligibleCount(
  allStudents: Student[],
  rules: {
    minCGPA: number;
    maxBacklogs: number;
    branches: string[];
    graduationYears: number[];
    minClass10: number;
    minClass12: number;
    offerPolicy: string;
  }
): number {
  return allStudents.filter((student) => {
    if (student.cgpa < rules.minCGPA) return false;
    if (student.backlogs > rules.maxBacklogs) return false;
    if (rules.branches.length > 0 && !rules.branches.includes(student.branch)) return false;
    if (rules.graduationYears.length > 0 && !rules.graduationYears.includes(student.graduationYear)) return false;
    if (student.class10 < rules.minClass10) return false;
    if (student.class12 < rules.minClass12) return false;
    if (rules.offerPolicy === "one_offer" && student.placementStatus === "placed") return false;
    if (rules.offerPolicy === "dream_offer" && !student.dreamOfferEligible) return false;
    return true;
  }).length;
}
