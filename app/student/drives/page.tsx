'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Search, MapPin, Calendar, CheckCircle, XCircle, Building2, X, Clock, 
  IndianRupee, Loader2, CheckCircle2, AlertTriangle, FileText, Send, Sparkles
} from 'lucide-react';
import { fetcher, apiApplyDrive } from '@/lib/api-client';

interface DriveEligibleItem {
  id: string;
  role: string;
  ctc: number;
  location: string;
  mode: string;
  deadline: string;
  driveDate: string;
  status: string;
  approvalStatus: string;
  jobType: string;
  minCGPA: number;
  maxBacklogs: number;
  branches: string[];
  offerPolicy: string;
  eligible?: boolean;
  reasons?: string[];
  company: {
    name: string;
    tier: string;
    logo?: string;
  };
}

export default function BrowseDrivesPage() {
  const { data: drivesData, isLoading } = useSWR<{ drives: DriveEligibleItem[] }>(
    '/api/drives/eligible', 
    fetcher, 
    { refreshInterval: 3000 }
  );
  const { data: appsData } = useSWR<any>('/api/applications', fetcher, { refreshInterval: 3000 });

  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [minCtc, setMinCtc] = useState(0);
  const [sortBy, setSortBy] = useState('Deadline');
  const [applyModalDrive, setApplyModalDrive] = useState<DriveEligibleItem | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const drives = drivesData?.drives || [];
  const myApplications = appsData?.applications || [];
  const appliedDriveIds = myApplications.map((a: any) => a.drive?.id || a.driveId);

  const daysLeft = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const filteredDrives = drives
    .filter(drive => {
      // Past event filter (Requirement 6)
      const driveTime = new Date(drive.driveDate || drive.deadline).getTime();
      if (driveTime < Date.now() - 24 * 60 * 60 * 1000) return false;

      if (searchTerm && !drive.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !drive.role.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (jobTypeFilter !== 'All' && drive.jobType?.toUpperCase() !== jobTypeFilter.toUpperCase()) return false;
      if (drive.ctc < minCtc) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === 'CTC') return b.ctc - a.ctc;
      return (a.company?.name || '').localeCompare(b.company?.name || '');
    });

  // REAL-TIME API SUBMISSION (Requirement 4)
  const handleConfirmApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalDrive) return;
    setSubmittingApp(true);

    try {
      await apiApplyDrive(applyModalDrive.id, coverNote);
      await mutate('/api/applications');
      await mutate('/api/drives/eligible');
      await mutate('/api/notifications');
      
      showToast(`Application successfully submitted to ${applyModalDrive.company?.name}!`);
      setApplyModalDrive(null);
      setCoverNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="p-8 animate-fade-in text-stone-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-scale-in">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Browse Placement Opportunities</h1>
        <p className="text-stone-500 text-xs mt-0.5">Automated eligibility evaluation and real-time application tracking</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs mb-6 flex flex-wrap gap-3 items-center text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search recruiting companies, job roles..."
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-stone-50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="border border-stone-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-orange-500 text-stone-700 bg-white"
          value={jobTypeFilter}
          onChange={e => setJobTypeFilter(e.target.value)}
        >
          <option value="All">All Work Modes</option>
          <option value="FULL_TIME">Full-Time</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="PPO">PPO</option>
        </select>
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl">
          <span className="text-stone-500 whitespace-nowrap font-semibold">Min CTC: ₹{minCtc}L</span>
          <input type="range" min={0} max={30} step={1} value={minCtc} onChange={e => setMinCtc(Number(e.target.value))} className="w-24 accent-orange-500" />
        </div>
        <select
          className="border border-stone-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-orange-500 text-stone-700 bg-white"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="Deadline">Sort: Deadline</option>
          <option value="CTC">Sort: Highest Package</option>
          <option value="Alphabetical">Sort: Company Name</option>
        </select>
        <span className="text-stone-400 ml-auto font-medium">{filteredDrives.length} drives open</span>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading placement drives...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDrives.map(drive => {
            const isApplied = appliedDriveIds.includes(drive.id);
            const isEligible = drive.eligible !== false;
            const daysRemaining = daysLeft(drive.deadline);

            return (
              <div 
                key={drive.id}
                className={`bg-white rounded-2xl border shadow-card p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                  !isEligible ? 'border-red-200/80 bg-red-50/20' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-xs text-orange-600">
                        {drive.company?.logo || drive.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">{drive.role}</h3>
                        <p className="text-xs text-stone-500 font-medium">{drive.company?.name}</p>
                      </div>
                    </div>

                    {isApplied ? (
                      <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Applied ✓
                      </span>
                    ) : isEligible ? (
                      <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Eligible
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Ineligible
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60 mb-3 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Compensation</p>
                      <p className="font-bold text-orange-600 text-sm">₹{drive.ctc} LPA</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Work Mode / City</p>
                      <p className="font-semibold text-stone-700 truncate">{drive.location} ({drive.mode})</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-stone-400" /> Drive: {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className={`font-bold ${daysRemaining <= 3 ? 'text-red-600' : 'text-stone-600'}`}>
                      <Clock size={12} className="inline mr-1" />{daysRemaining} days left
                    </span>
                  </div>

                  {!isEligible && drive.reasons && drive.reasons.length > 0 && (
                    <div className="p-2.5 bg-red-50 border border-red-200/70 rounded-xl text-[11px] text-red-700 space-y-0.5 mb-2">
                      <p className="font-bold">Gating criteria not met:</p>
                      {drive.reasons.map((r, i) => (
                        <p key={i}>• {r}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100">
                  {isApplied ? (
                    <button 
                      disabled
                      className="w-full py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 size={13} />
                      Application Submitted
                    </button>
                  ) : isEligible ? (
                    <button
                      onClick={() => setApplyModalDrive(drive)}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <Send size={13} />
                      Apply for Drive
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 bg-stone-100 border border-stone-200 text-stone-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                    >
                      Eligibility Gated
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPLY CONFIRMATION MODAL (Requirement 4) */}
      {applyModalDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles size={16} className="text-orange-400" />
                <span>Confirm Placement Application</span>
              </div>
              <button onClick={() => setApplyModalDrive(null)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmApplication} className="p-6 space-y-4">
              <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200 space-y-1.5">
                <h3 className="font-bold text-stone-900 text-sm">{applyModalDrive.role}</h3>
                <p className="text-xs text-stone-600 font-semibold">{applyModalDrive.company?.name} • ₹{applyModalDrive.ctc} LPA</p>
                <p className="text-[11px] text-stone-500">{applyModalDrive.location} ({applyModalDrive.mode})</p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Attached Verified Digital Resume</label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-orange-500" />
                    <span className="font-bold text-stone-800">Official_Resume_TPO_Verified.pdf</span>
                  </div>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Verified ✓
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Cover Note / Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="Share any specific projects, competitive coding handles, or technical achievements..."
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalDrive(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingApp ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
