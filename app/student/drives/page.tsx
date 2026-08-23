'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Search, MapPin, Calendar, CheckCircle, XCircle, Building2, X, Clock, 
  IndianRupee, Loader2, CheckCircle2, AlertTriangle, FileText, Send, Sparkles, ShieldCheck, Briefcase, Award
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
  description?: string;
  openings?: number;
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
  const { data: drivesData, isLoading } = useSWR<{ 
    drives: DriveEligibleItem[];
    studentOfferInfo?: {
      hasAcceptedOffer: boolean;
      initialOfferCTC: number;
      doublePackageThreshold: number;
      isEligibleForFurtherPlacements: boolean;
    };
  }>('/api/drives/eligible', fetcher, { refreshInterval: 3000 });

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
  const offerInfo = drivesData?.studentOfferInfo;
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
      alert(err.message || 'Could not submit application. Please check offer policy constraints.');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 animate-fade-in select-none text-[#1C1A1A] bg-[#F8F5EC]">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-[99999] bg-[#1C1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-scale-in border border-[#E3D8C4]">
          <CheckCircle2 size={16} className="text-[#4A7C59]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs select-none">
        <div>
          <h1 className="text-xl font-bold text-[#1C1A1A]">Campus Placement Drives</h1>
          <p className="text-xs text-[#5E544A] mt-0.5 font-medium">Explore verified recruitment drives, openings, and submit applications</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] px-3 py-1.5 rounded-full font-bold">
            Session 2026–27
          </span>
        </div>
      </div>

      {/* 2X Package Placement Governance Banner */}
      {offerInfo?.hasAcceptedOffer && (
        <div className="bg-[#F1E9D8] border border-[#E3D8C4] rounded-2xl p-4 flex items-center justify-between text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] shrink-0 font-bold">
              <Award size={20} />
            </div>
            <div>
              <p className="font-bold text-[#1C1A1A]">
                2X Offer Policy Active — Initial Offer Secured: ₹{offerInfo.initialOfferCTC} LPA
              </p>
              <p className="text-[#5E544A] mt-0.5 text-[11px] font-medium">
                Under GGSIPU placement regulations, you can participate in subsequent drives offering at least double (2X) your initial offer (≥ ₹{offerInfo.doublePackageThreshold} LPA).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#8B1A1A] text-white rounded-xl font-bold text-[11px] shrink-0">
            Threshold: ₹{offerInfo.doublePackageThreshold} LPA
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7B6F] h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search by company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E3D8C4] rounded-xl text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold select-text"
            />
          </div>

          <div>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E3D8C4] rounded-xl text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-bold"
            >
              <option value="All">All Job Types</option>
              <option value="FULL_TIME">Full-Time Placement</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="PPO">Pre-Placement Offer (PPO)</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 border border-[#E3D8C4] rounded-xl text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-bold"
            >
              <option value="Deadline">Sort by: Deadline (Urgent First)</option>
              <option value="CTC">Sort by: CTC (High to Low)</option>
              <option value="Company">Sort by: Company (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E3D8C4] text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#5E544A] font-bold text-xs">Min Package (CTC):</span>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={minCtc}
              onChange={(e) => setMinCtc(Number(e.target.value))}
              className="w-32 accent-[#8B1A1A]"
            />
            <span className="font-extrabold text-[#8B1A1A] text-xs">₹{minCtc} LPA+</span>
          </div>
          <span className="text-[#8B7B6F] font-bold text-[11px]">{filteredDrives.length} drives available</span>
        </div>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading verified placement opportunities...
        </div>
      ) : filteredDrives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDrives.map((drive) => {
            const hasApplied = appliedDriveIds.includes(drive.id);
            const remainingDays = daysLeft(drive.deadline);
            const isEligible = drive.eligible !== false;

            return (
              <div
                key={drive.id}
                className={`bg-white rounded-2xl border p-5 shadow-card flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                  !isEligible ? 'border-[#E3D8C4] opacity-90' : 'border-[#E3D8C4]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-extrabold text-sm shrink-0">
                        {drive.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1C1A1A] text-sm">{drive.role}</h3>
                        <p className="text-[#5E544A] text-xs font-semibold">{drive.company?.name} • {drive.location} ({drive.mode})</p>
                      </div>
                    </div>

                    <span className="bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                      {drive.company?.tier || 'Tier-1'}
                    </span>
                  </div>

                  {/* Job Description */}
                  {drive.description && (
                    <p className="mt-3 text-xs text-[#5E544A] line-clamp-2 leading-relaxed bg-[#F8F5EC] p-2.5 rounded-xl border border-[#E3D8C4]/60 font-medium">
                      {drive.description}
                    </p>
                  )}

                  {/* Key Metrics Strip: CTC, Openings, Deadline */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4] text-center">
                    <div>
                      <span className="text-[#8B7B6F] block text-[10px] uppercase font-bold">Package</span>
                      <span className="text-[#8B1A1A] font-extrabold text-sm">₹{drive.ctc} LPA</span>
                    </div>
                    <div>
                      <span className="text-[#8B7B6F] block text-[10px] uppercase font-bold">Openings</span>
                      <span className="font-bold text-[#1C1A1A] text-sm">{drive.openings || 5} Positions</span>
                    </div>
                    <div>
                      <span className="text-[#8B7B6F] block text-[10px] uppercase font-bold">Deadline</span>
                      <span className="font-bold text-[#1C1A1A] text-xs">
                        {new Date(drive.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        <span className={`block text-[10px] ${remainingDays <= 3 ? 'text-[#C85555]' : 'text-[#8B7B6F]'}`}>
                          ({remainingDays}d left)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Status */}
                  <div className="mt-3 flex items-center justify-between text-xs flex-wrap gap-1.5">
                    {drive.approvalStatus !== 'APPROVED' ? (
                      <span className="text-[#C8A243] bg-[#F1E9D8] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Clock size={11} /> Pending TPO Approval
                      </span>
                    ) : isEligible ? (
                      <span className="text-[#4A7C59] bg-[#F1E9D8] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> You are Eligible
                      </span>
                    ) : (
                      <span className="text-[#C85555] bg-[#F1E9D8] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1" title={drive.reasons?.join('; ')}>
                        <XCircle size={11} /> Ineligible: {drive.reasons?.[0]?.slice(0, 45)}...
                      </span>
                    )}

                    <span className="text-[#8B7B6F] text-[11px] font-semibold">Min CGPA: {drive.minCGPA || 7.0}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E3D8C4] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#8B7B6F] font-semibold">
                    Policy: {drive.offerPolicy?.replace(/_/g, ' ') || 'Standard'}
                  </span>

                  {hasApplied ? (
                    <span className="px-4 py-1.5 bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] rounded-xl text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Already Applied
                    </span>
                  ) : (
                    <button
                      disabled={!isEligible}
                      onClick={() => isEligible && setApplyModalDrive(drive)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isEligible 
                          ? 'bg-[#8B1A1A] hover:bg-[#A63030] text-white active:scale-95' 
                          : 'bg-[#F8F5EC] text-[#8B7B6F] border border-[#E3D8C4] cursor-not-allowed'
                      }`}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center text-xs text-[#8B7B6F] bg-white rounded-2xl border border-[#E3D8C4]">
          No placement drives found matching your filter criteria.
        </div>
      )}

      {/* CONFIRM APPLICATION MODAL */}
      {applyModalDrive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-[#E3D8C4] pb-3">
              <div>
                <h3 className="font-bold text-[#1C1A1A] text-sm">Submit Placement Application</h3>
                <p className="text-[#5E544A] text-xs font-semibold">{applyModalDrive.company?.name} — {applyModalDrive.role}</p>
              </div>
              <button 
                onClick={() => setApplyModalDrive(null)}
                className="text-[#8B7B6F] hover:text-[#1C1A1A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApplication} className="space-y-3">
              {/* Drive Details Summary */}
              <div className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] space-y-2">
                <div className="flex justify-between font-bold text-xs">
                  <span>Package: <strong className="text-[#8B1A1A]">₹{applyModalDrive.ctc} LPA</strong></span>
                  <span>Openings: <strong>{applyModalDrive.openings || 5}</strong></span>
                </div>
                {applyModalDrive.description && (
                  <p className="text-[11px] text-[#5E544A] leading-relaxed font-medium">
                    {applyModalDrive.description}
                  </p>
                )}
              </div>

              <div className="p-3 bg-[#F1E9D8] rounded-xl border border-[#E3D8C4] space-y-1">
                <p className="font-bold text-[#4A7C59] flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Academic Criteria Verified
                </p>
                <p className="text-[11px] text-[#5E544A] font-medium">
                  Your profile meets all CGPA, backlog, and discipline requirements for this drive.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Cover Note / Candidate Pitch (Optional)</label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Brief statement of interest and why you are a great fit..."
                  className="w-full p-2.5 bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-medium select-text"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyModalDrive(null)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingApp ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
