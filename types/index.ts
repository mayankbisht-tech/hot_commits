// Types for TPC Platform

export type Role = "tpo" | "company" | "student";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  cgpa: number;
  backlogs: number;
  email: string;
  phone: string;
  class10: number;
  class12: number;
  graduationYear: number;
  placementStatus: "placed" | "unplaced" | "opted_out";
  dreamOfferEligible: boolean;
  activeOffers: string[];
  appliedDrives: string[];
  resumeUrl?: string;
  resumeVerified: boolean;
  skills: string[];
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  tier: "Tier-1" | "Tier-2" | "Tier-3";
  industry: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
}

export interface EligibilityRules {
  minCGPA: number;
  maxBacklogs: number;
  branches: string[];
  graduationYears: number[];
  minClass10: number;
  minClass12: number;
  offerPolicy: "standard" | "one_offer" | "dream_offer";
}

export interface Drive {
  id: string;
  companyId: string;
  companyName: string;
  companyTier: "Tier-1" | "Tier-2" | "Tier-3";
  role: string;
  ctc: number; // LPA
  location: string;
  mode: "Onsite" | "Remote" | "Hybrid";
  deadline: string; // ISO date
  driveDate: string; // ISO date
  status: "upcoming" | "active" | "completed" | "cancelled";
  eligibility: EligibilityRules;
  totalApplicants: number;
  shortlisted: number;
  offers: number;
  description: string;
  jobType: "Full-Time" | "Internship" | "PPO";
  rounds: string[];
  approvalStatus: "pending" | "approved" | "rejected";
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  driveId: string;
  driveName: string;
  companyName: string;
  appliedOn: string;
  status: "applied" | "shortlisted" | "interview_scheduled" | "offer_extended" | "offer_accepted" | "rejected" | "withdrawn";
  offerCtc?: number;
  interviewDate?: string;
  rejectionReason?: string;
  resumeUrl?: string;
  stageHistory: { stage: string; date: string; note?: string }[];
}

export interface TrainingProgram {
  id: string;
  title: string;
  type: "aptitude" | "soft_skills" | "technical" | "certification";
  date: string;
  time: string;
  venue: string;
  mode: "Offline" | "Online" | "Hybrid";
  registeredCount: number;
  capacity: number;
  attendedCount: number;
  facilitator: string;
  description: string;
  tags: string[];
}

export interface PlacementStats {
  academicYear: string;
  totalEligible: number;
  totalPlaced: number;
  averageCTC: number;
  medianCTC: number;
  highestCTC: number;
  highestCTCCompany: string;
  branchStats: BranchStat[];
  monthlyOffers: { month: string; offers: number }[];
  ctcBands: { band: string; count: number }[];
}

export interface BranchStat {
  branch: string;
  eligible: number;
  placed: number;
  avgCTC: number;
  medianCTC: number;
  highestCTC: number;
}
