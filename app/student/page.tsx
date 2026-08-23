'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { fetcher, apiApply } from '@/lib/api-client';
import { 
  Building2, MapPin, Calendar, CheckCircle2, FileText, Star, ArrowRight, 
  Loader2, X, AlertCircle, Award, User, Mail, Phone, BookOpen, Clock, ShieldCheck, Lock
} from 'lucide-react';

interface EligibleDrive {
  id: string;
  role: string;
  ctc: number;
  location: string;
  mode: string;
  deadline: string;
  driveDate: string;
  status: string;
  approvalStatus?: string;
  jobType: string;
  description?: string;
  openings?: number;
  company: { name: string; tier: string };
  eligible: boolean;
  reasons: string[];
  offerPolicy: string;
}

interface AppResponse {
  applications: {
    id: string;
    status: string;
    offerCtc?: number;
    interviewDate?: string;
    drive: { role: string; company: { name: string } };
    stageHistory: { stage: string; date: string; note?: string }[];
  }[];
}

interface StudentResponse {
  student: {
    id: string;
    name: string;
    rollNo: string;
    email?: string;
    phone?: string;
    cgpa: number;
    backlogs: number;
    class10?: number;
    class12?: number;
    graduationYear?: number;
    branch: string;
    resumeVerified: boolean;
    dreamEligible: boolean;
    placementStatus: string;
    skills?: string[];
    skillsJson?: string;
    offers?: Array<{ ctc: number; status: string }>;
  };
}

export default function StudentDashboard() {
  const { data: drivesData, isLoading: drivesLoading } = useSWR<{ 
    drives: EligibleDrive[];
    studentOfferInfo?: {
      hasAcceptedOffer: boolean;
      initialOfferCTC: number;
      doublePackageThreshold: number;
      isEligibleForFurtherPlacements: boolean;
    };
  }>('/api/drives/eligible', fetcher, { refreshInterval: 2000 });

  const { data: appsData, isLoading: appsLoading } = useSWR<AppResponse>('/api/applications', fetcher, { refreshInterval: 2000 });
  const { data: studentData } = useSWR<StudentResponse>('/api/students/me', fetcher, { refreshInterval: 2000 });

  const [applyingTo, setApplyingTo] = useState<EligibleDrive | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);

  const drives = (drivesData?.drives ?? []).filter(d => {
    const driveDate = new Date(d.driveDate || d.deadline).getTime();
    return driveDate >= Date.now() - 24 * 60 * 60 * 1000;
  });
  const offerInfo = drivesData?.studentOfferInfo;
  const apps = appsData?.applications ?? [];
  const student = studentData?.student;
  const activeAppCount = apps.filter(a => ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status)).length;

  const studentSkills = student?.skills || (student?.skillsJson ? JSON.parse(student.skillsJson) : []);

  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const handleApply = async () => {
    if (!applyingTo) return;
    setApplying(true);
    try {
      await apiApply(applyingTo.id, coverNote);
      setApplied(prev => [...prev, applyingTo.id]);
      await mutate('/api/applications');
      await mutate('/api/drives/eligible');
      await mutate('/api/notifications');
      setApplyingTo(null);
      setCoverNote('');
      showPopup('success', 'Application Submitted', `Your application for ${applyingTo.role} at ${applyingTo.company.name} has been successfully submitted!`);
    } catch (e: any) {
      showPopup('error', 'Application Notice', e.message || 'Failed to submit application. Please verify your eligibility criteria.');
    } finally {
      setApplying(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'INTERVIEW_SCHEDULED') return 'bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4]';
    if (s === 'OFFER_EXTENDED' || s === 'OFFER_ACCEPTED') return 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]';
    if (s === 'REJECTED') return 'bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]';
    if (s === 'SHORTLISTED') return 'bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4]';
    return 'bg-[#F8F5EC] text-[#5E544A] border border-[#E3D8C4]';
  };

  const { data: notifData } = useSWR<{ notifications: any[] }>('/api/notifications', fetcher, { refreshInterval: 2000 });
  const reminders = (notifData?.notifications || []).filter(n => n.type === 'reminder');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6 select-none bg-[#F8F5EC] text-[#1C1A1A]">
      {/* Recruiter Reminder Banner */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map(rem => (
            <div key={rem.id} className="bg-[#F1E9D8] border-2 border-[#8B1A1A] rounded-2xl p-4 flex items-start justify-between gap-4 shadow-sm animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-[#1C1A1A] text-sm">{rem.title}</h3>
                  <p className="text-xs text-[#5E544A] mt-0.5 leading-relaxed">{rem.desc}</p>
                </div>
              </div>
              <Link
                href="/student/applications"
                className="px-3.5 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
              >
                View Applications →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 2X Offer Governance Banner */}
      {offerInfo?.hasAcceptedOffer && (
        <div className="bg-[#F1E9D8] border border-[#E3D8C4] rounded-2xl p-4 flex items-center justify-between text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] shrink-0 font-bold">
              <Award size={20} />
            </div>
            <div>
              <p className="font-bold text-[#1C1A1A]">
                2X Offer Policy Active — Initial Offer: ₹{offerInfo.initialOfferCTC} LPA
              </p>
              <p className="text-[#5E544A] mt-0.5 text-[11px] font-medium">
                Under GGSIPU placement rules, you are eligible for subsequent placement drives offering at least ₹{offerInfo.doublePackageThreshold} LPA (2X initial package).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#8B1A1A] text-white rounded-xl font-bold text-[11px] shrink-0">
            2X Threshold: ₹{offerInfo.doublePackageThreshold} LPA
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1A1A]">Student Dashboard</h1>
          <p className="text-[#5E544A] text-xs sm:text-sm mt-0.5 font-medium">
            Welcome back{student?.name ? `, ${student.name.split(' ')[0]}` : ''}. Here is your real-time campus recruitment overview.
          </p>
        </div>
        <Link 
          href="/student/profile"
          className="flex items-center gap-2 px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-xs font-bold hover:bg-[#A63030] transition-colors shadow-xs"
        >
          <FileText size={15} /> Edit Profile
        </Link>
      </div>

      {/* Profile & Registered Credentials Card */}
      {student && (
        <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-5 animate-fade-in-up space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3D8C4] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center font-extrabold text-[#8B1A1A] text-lg">
                {student.name ? student.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[#1C1A1A] text-base">{student.name}</h2>
                  <span className="px-2 py-0.5 bg-[#F1E9D8] text-[#8B1A1A] rounded-full text-[10px] font-bold">
                    {student.branch} • Class of {student.graduationYear || 2027}
                  </span>
                </div>
                <p className="text-xs text-[#5E544A] mt-0.5">Enrollment No: <strong className="text-[#1C1A1A]">{student.rollNo}</strong></p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#5E544A] bg-[#F8F5EC] px-3 py-1.5 rounded-xl border border-[#E3D8C4]">
                <Mail size={13} className="text-[#8B7B6F]" />
                <span className="font-semibold text-[#1C1A1A]">{student.email || 'Registered'}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-1.5 text-[#5E544A] bg-[#F8F5EC] px-3 py-1.5 rounded-xl border border-[#E3D8C4]">
                  <Phone size={13} className="text-[#8B7B6F]" />
                  <span className="font-semibold text-[#1C1A1A]">+91 {student.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
              <p className="text-[10px] uppercase font-bold text-[#8B7B6F]">Current CGPA</p>
              <p className="text-base font-black text-[#8B1A1A]">{student.cgpa ? Number(student.cgpa).toFixed(1) : '8.0'} / 10</p>
            </div>
            <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
              <p className="text-[10px] uppercase font-bold text-[#8B7B6F]">Active Backlogs</p>
              <p className={`text-base font-black ${student.backlogs === 0 ? 'text-[#4A7C59]' : 'text-[#C85555]'}`}>
                {student.backlogs ?? 0}
              </p>
            </div>
            <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
              <p className="text-[10px] uppercase font-bold text-[#8B7B6F]">Class 10th / 12th</p>
              <p className="text-xs font-bold text-[#1C1A1A] mt-0.5">{student.class10 ?? 85}% / {student.class12 ?? 85}%</p>
            </div>
            <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
              <p className="text-[10px] uppercase font-bold text-[#8B7B6F]">Placement Status</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#F1E9D8] text-[#4A7C59] rounded font-bold text-[10px] uppercase">
                {student.placementStatus || 'UNPLACED'}
              </span>
            </div>
          </div>

          {/* Student Verified Skills */}
          {studentSkills.length > 0 && (
            <div className="pt-2 border-t border-[#E3D8C4]">
              <p className="text-[10px] uppercase font-bold text-[#8B7B6F] mb-1.5">My Registered Skills ({studentSkills.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {studentSkills.map((sk: string) => (
                  <span key={sk} className="px-2.5 py-1 bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4] rounded-lg text-xs font-bold shadow-2xs">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Drives */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-[#E3D8C4] flex justify-between items-center bg-[#F8F5EC]">
              <div>
                <h2 className="font-bold text-[#1C1A1A] text-sm">Placement Drives</h2>
                <p className="text-[11px] text-[#5E544A] mt-0.5">TPO verified recruitment schedules and eligibility status</p>
              </div>
              <Link href="/student/drives" className="text-xs font-bold text-[#8B1A1A] hover:text-[#A63030] flex items-center gap-1">
                Browse All <ArrowRight size={13} />
              </Link>
            </div>
            {drivesLoading ? (
              <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F8F5EC] rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-[#E3D8C4]">
                {drives.slice(0, 4).map(drive => {
                  const isApplied = applied.includes(drive.id) || apps.some(a => a.drive?.role === drive.role);
                  const isApproved = drive.approvalStatus === 'APPROVED';
                  return (
                    <div key={drive.id} className={`p-5 ${!drive.eligible ? 'bg-[#F1E9D8]/30' : ''}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <div className="w-11 h-11 bg-[#F1E9D8] border border-[#E3D8C4] rounded-xl flex items-center justify-center flex-shrink-0 text-[#8B1A1A]">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-[#1C1A1A] text-sm">{drive.role}</h3>
                              {drive.eligible ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]">
                                  ELIGIBLE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]">
                                  INELIGIBLE
                                </span>
                              )}
                              {!isApproved && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4]">
                                  PENDING TPO APPROVAL
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5E544A] font-semibold mt-0.5">{drive.company.name}</p>
                            
                            <div className="flex items-center gap-3 text-[11px] text-[#8B7B6F] mt-2 flex-wrap">
                              <span className="font-bold text-[#8B1A1A]">₹{drive.ctc} LPA</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><MapPin size={11} /> {drive.location} ({drive.mode})</span>
                              {drive.openings && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-[#1C1A1A]">{drive.openings} Openings</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} /> {new Date(drive.driveDate || drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            {/* Eligibility Reasons */}
                            {!drive.eligible && drive.reasons?.length > 0 && (
                              <div className="mt-2 text-[11px] text-[#C85555] bg-[#F8F5EC] p-2 rounded-lg border border-[#E3D8C4] space-y-0.5">
                                {drive.reasons.map((r, idx) => (
                                  <p key={idx} className="flex items-center gap-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{r}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isApplied ? (
                            <span className="px-3 py-1.5 bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] rounded-xl text-xs font-bold inline-block">
                              Applied ✓
                            </span>
                          ) : drive.eligible ? (
                            <button
                              onClick={() => setApplyingTo(drive)}
                              className="px-4 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                            >
                              Apply Now
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-1.5 bg-[#E3D8C4] text-[#8B7B6F] rounded-xl text-xs font-bold cursor-not-allowed"
                            >
                              Ineligible
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {drives.length === 0 && (
                  <p className="p-6 text-center text-xs text-[#8B7B6F]">No upcoming drives available at this time.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Applications & Track */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* My Applications Card */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden animate-fade-in-up delay-200">
            <div className="px-5 py-4 border-b border-[#E3D8C4] flex justify-between items-center bg-[#F8F5EC]">
              <h2 className="font-bold text-[#1C1A1A] text-xs">My Applications</h2>
              <span className="text-[11px] bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full font-bold">{activeAppCount} Active</span>
            </div>
            {appsLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F8F5EC] rounded animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-[#E3D8C4]">
                {apps.slice(0, 4).map(app => (
                  <div key={app.id} className="p-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-[#1C1A1A]">{app.drive?.role}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(app.status)}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[#5E544A] text-xs font-semibold">{app.drive?.company?.name}</p>
                    {app.interviewDate && (
                      <p className="text-[11px] text-[#C8A243] font-bold">
                        Interview: {new Date(app.interviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                ))}
                {apps.length === 0 && (
                  <p className="p-4 text-xs text-[#8B7B6F] text-center">No applications submitted yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Dream Placement Track */}
          <div className="bg-[#F1E9D8] rounded-2xl border border-[#E3D8C4] p-5 shadow-card animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#8B1A1A]" fill="currentColor" />
              <h2 className="font-bold text-xs text-[#1C1A1A]">Dream Placement Track</h2>
            </div>
            <p className="text-xs text-[#5E544A] leading-relaxed font-medium">
              Your CGPA of {student?.cgpa ?? 8.0} qualifies you for Tier-1 Dream Placement Drives with CTC packages {'>'} ₹20 LPA.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Apply Modal */}
      {applyingTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-[99999] animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex justify-between items-center border-b border-[#E3D8C4] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#1C1A1A]">{applyingTo.role}</h3>
                <p className="text-xs text-[#5E544A]">{applyingTo.company.name} · ₹{applyingTo.ctc} LPA</p>
              </div>
              <button onClick={() => setApplyingTo(null)} className="text-[#8B7B6F] hover:text-[#1C1A1A]"><X size={18} /></button>
            </div>

            {applyingTo.description && (
              <div className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] text-[11px] text-[#5E544A] leading-relaxed font-medium">
                {applyingTo.description}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#5E544A] mb-1">Cover Note (Optional)</label>
              <textarea
                rows={3}
                placeholder="Briefly state your relevant skills and interest in this role..."
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                className="w-full p-2.5 bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-medium select-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setApplyingTo(null)} className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]">
                Cancel
              </button>
              <button
                disabled={applying}
                onClick={handleApply}
                className="px-5 py-2 bg-[#8B1A1A] text-white rounded-xl font-bold hover:bg-[#A63030] flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Modal Dialog Popup */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] text-[#8B1A1A] flex items-center justify-center mx-auto mb-3 border border-[#E3D8C4]">
              {modalDialog.type === 'success' ? (
                <CheckCircle2 size={24} className="text-[#4A7C59]" />
              ) : (
                <AlertCircle size={24} className="text-[#C85555]" />
              )}
            </div>
            <h3 className="text-base font-bold text-[#1C1A1A] mb-1">{modalDialog.title}</h3>
            <p className="text-xs text-[#5E544A] mb-5 leading-relaxed font-medium">{modalDialog.message}</p>
            <button
              type="button"
              onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
              className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
