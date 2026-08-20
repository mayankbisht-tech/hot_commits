'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { fetcher, apiApply } from '@/lib/api-client';
import { Building2, MapPin, Calendar, CheckCircle2, FileText, Star, ArrowRight, Loader2, X } from 'lucide-react';

interface EligibleDrive {
  id: string;
  role: string;
  ctc: number;
  location: string;
  mode: string;
  deadline: string;
  driveDate: string;
  status: string;
  jobType: string;
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
    cgpa: number;
    backlogs: number;
    branch: string;
    resumeVerified: boolean;
    dreamEligible: boolean;
    placementStatus: string;
    skillsJson: string;
  };
}

export default function StudentDashboard() {
  const { data: drivesData, isLoading: drivesLoading } = useSWR<{ drives: EligibleDrive[] }>('/api/drives/eligible', fetcher);
  const { data: appsData, isLoading: appsLoading } = useSWR<AppResponse>('/api/applications', fetcher);
  const { data: studentData } = useSWR<StudentResponse>('/api/students/me', fetcher);

  const [applyingTo, setApplyingTo] = useState<EligibleDrive | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);

  const drives = (drivesData?.drives ?? []).filter(d => {
    const driveDate = new Date(d.driveDate || d.deadline).getTime();
    return driveDate >= Date.now() - 24 * 60 * 60 * 1000;
  });
  const apps = appsData?.applications ?? [];
  const student = studentData?.student;
  const activeAppCount = apps.filter(a => ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status)).length;

  const handleApply = async () => {
    if (!applyingTo) return;
    setApplying(true);
    try {
      await apiApply(applyingTo.id, coverNote);
      setApplied(prev => [...prev, applyingTo.id]);
      mutate('/api/applications');
      setApplyingTo(null);
      setCoverNote('');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setApplying(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'INTERVIEW_SCHEDULED') return 'bg-amber-100 text-amber-800';
    if (s === 'OFFER_EXTENDED' || s === 'OFFER_ACCEPTED') return 'bg-green-100 text-green-800';
    if (s === 'REJECTED') return 'bg-red-100 text-red-800';
    if (s === 'SHORTLISTED') return 'bg-orange-100 text-orange-800';
    return 'bg-stone-100 text-stone-600';
  };

  const { data: notifData } = useSWR<{ notifications: any[] }>('/api/notifications', fetcher, { refreshInterval: 2000 });
  const reminders = (notifData?.notifications || []).filter(n => n.type === 'reminder');

  return (
    <div className="p-8 animate-fade-in space-y-6">
      {/* Real-time Recruiter Reminder Banner (Requirement 3) */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map(rem => (
            <div key={rem.id} className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-sm animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-orange-950 text-sm">{rem.title}</h3>
                  <p className="text-xs text-orange-800 mt-0.5 leading-relaxed">{rem.desc}</p>
                </div>
              </div>
              <Link
                href="/student/applications"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
              >
                View Applications →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Student Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">
            Welcome back{student ? `, ${student.name.split(' ')[0]}` : ''}. Here is your placement overview.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
          <FileText size={16} />Update Resume
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-8 space-y-6">
          {/* Eligible Drives */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-card overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
              <h2 className="font-semibold text-stone-900">Eligible Upcoming Drives</h2>
              <Link href="/student/drives" className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {drivesLoading ? (
              <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {drives.slice(0, 4).map(drive => {
                  const isApplied = applied.includes(drive.id) || apps.some(a => a.drive?.role === drive.role);
                  return (
                    <div key={drive.id} className={`p-5 ${!drive.eligible ? 'bg-red-50/30' : ''}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-stone-900 text-sm">{drive.role}</h3>
                              {drive.eligible ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">● ELIGIBLE</span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">● INELIGIBLE</span>
                              )}
                            </div>
                            <p className="text-stone-500 text-xs mt-0.5">{drive.company.name}</p>
                            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-stone-400">
                              <span className="flex items-center gap-1"><MapPin size={10} />{drive.location}</span>
                              <span className="text-orange-600 font-semibold">₹{drive.ctc}L</span>
                              <span className="flex items-center gap-1"><Calendar size={10} />
                                {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            {!drive.eligible && drive.reasons[0] && (
                              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 mt-2 inline-block">
                                {drive.reasons[0]}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          disabled={!drive.eligible || isApplied}
                          onClick={() => drive.eligible && !isApplied && setApplyingTo(drive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                            isApplied ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' :
                            drive.eligible ? 'bg-orange-500 text-white hover:bg-orange-600' :
                            'bg-stone-100 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {isApplied ? '✓ Applied' : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!drivesLoading && drives.length === 0 && (
                  <div className="p-8 text-center text-stone-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-stone-200" />
                    <p>No active drives available right now.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placement Readiness */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-card p-5 animate-fade-in-up delay-100">
            <h2 className="font-semibold text-stone-900 mb-3">Placement Readiness</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-stone-600">Profile Completion</span>
                <span className="font-bold text-orange-600">85%</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Resume Uploaded', done: student?.resumeVerified ?? true },
                { label: `CGPA ≥ 7.5 (${student?.cgpa ?? 8.7})`, done: (student?.cgpa ?? 8.7) >= 7.5 },
                { label: 'No Active Backlogs', done: (student?.backlogs ?? 0) === 0 },
                { label: 'Mock Interview Attended', done: false },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${item.done ? 'text-green-500' : 'text-stone-300'}`} />
                  <span className={item.done ? 'text-stone-700' : 'text-stone-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-4 space-y-4">
          {/* My Applications */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-card overflow-hidden animate-fade-in-up delay-200">
            <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center">
              <h2 className="font-semibold text-stone-900">My Applications</h2>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{activeAppCount} Active</span>
            </div>
            {appsLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-stone-100 rounded animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {apps.slice(0, 3).map(app => (
                  <Link key={app.id} href="/student/applications" className="block p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{app.drive?.role}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{app.drive?.company.name}</p>
                      </div>
                    </div>
                    <span className={`mt-2 inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(app.status)}`}>
                      {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </Link>
                ))}
                {apps.length === 0 && <p className="p-4 text-center text-stone-400 text-sm">No applications yet.</p>}
              </div>
            )}
            {apps.length > 0 && (
              <div className="p-3 border-t border-stone-100 text-center">
                <Link href="/student/applications" className="text-xs text-orange-600 hover:text-orange-700 font-medium">View all →</Link>
              </div>
            )}
          </div>

          {/* Resume Status */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-card p-5 text-center animate-fade-in-up delay-300">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-semibold text-stone-900">Resume Status</h3>
            <p className="text-xs text-stone-400 mt-1">Last updated: Oct 15, 2023</p>
            <div className="mt-3 space-y-2">
              <button className="w-full py-2 border border-stone-200 rounded-lg text-xs text-stone-600 hover:bg-stone-50 transition-colors">View Current</button>
              {student?.resumeVerified && (
                <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} />Verified by T&P Cell
                </p>
              )}
            </div>
          </div>

          {/* Dream Offer */}
          {student?.dreamEligible && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 relative overflow-hidden animate-fade-in-up delay-400">
              <Star className="absolute top-2 right-2 w-14 h-14 text-orange-200" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-orange-500 fill-current" />
                  <h3 className="font-bold text-stone-900 text-sm">Dream Offer Eligible!</h3>
                </div>
                <p className="text-xs text-stone-600">Your CGPA of {student.cgpa} qualifies you for dream offer drives (CTC &gt; ₹20L).</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyingTo && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-900">Apply to {applyingTo.role}</h3>
                <p className="text-sm text-stone-500">{applyingTo.company.name} · ₹{applyingTo.ctc}L</p>
              </div>
              <button onClick={() => setApplyingTo(null)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 mb-1.5">✓ Eligibility Confirmed</p>
                <p className="text-xs text-green-700">You meet all eligibility criteria for this drive.</p>
              </div>
              <div className="border border-stone-200 rounded-lg p-3">
                <p className="text-xs text-stone-400 mb-0.5">Applying with resume</p>
                <p className="text-sm font-medium text-stone-800">Rohan_Mehta_Resume.pdf</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={10} />Verified</p>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Cover Note (Optional)</label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  rows={3}
                  placeholder="Briefly mention your interest..."
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setApplyingTo(null)} className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {applying && <Loader2 size={14} className="animate-spin" />}
                Confirm Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
