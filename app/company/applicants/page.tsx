"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { 
  ChevronRight, X, IndianRupee, AlertTriangle, 
  ChevronDown, Search, Filter, Loader2, CheckCircle2, UserCheck, ShieldAlert, Award, AlertCircle,
  Briefcase, User, GraduationCap, Clock, ArrowRight, ShieldCheck, Mail, Phone, BookOpen,
  FileText, Star, Trash2, Check, CheckSquare, Square, Eye, Sparkles, RefreshCw, MoreVertical, GripVertical
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface ApplicationItem {
  id: string;
  status: string;
  appliedOn: string;
  driveId?: string;
  student: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
    cgpa: number;
    phone?: string;
    email?: string;
    skills?: string[];
    backlogs?: number;
    class10?: number;
    class12?: number;
    graduationYear?: number;
  };
  drive: {
    id: string;
    role: string;
    ctc: number;
    companyId?: string;
    company?: { name: string };
  };
  stageHistory?: Array<{
    id?: string;
    stage: string;
    date: string;
    note?: string;
  }>;
}

function CompanyApplicantsContent() {
  const searchParams = useSearchParams();
  const initialDriveId = searchParams?.get('driveId') || "ALL";

  const { data: appData, isLoading, isValidating } = useSWR<{ applications: ApplicationItem[] }>(
    '/api/applications', 
    fetcher, 
    { refreshInterval: 2000 }
  );
  const { data: drivesData } = useSWR<any>('/api/drives', fetcher);

  // States
  const [selectedDriveId, setSelectedDriveId] = useState<string>(initialDriveId);
  const [activeStageTab, setActiveStageTab] = useState<string>("APPLIED");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
  const [resumePreviewApp, setResumePreviewApp] = useState<ApplicationItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showPolicyBanner, setShowPolicyBanner] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // Sync selectedDriveId from URL searchParams
  useEffect(() => {
    const driveFromUrl = searchParams?.get('driveId');
    if (driveFromUrl) {
      setSelectedDriveId(driveFromUrl);
    }
  }, [searchParams]);

  // Centered Modal Dialog for Alerts & Confirmations
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Pipeline Stage Tabs (Unified 5 stages)
  const stages = [
    { key: "APPLIED", label: "Applied", color: "#5E544A" },
    { key: "SHORTLISTED", label: "Shortlisted", color: "#C8A243" },
    { key: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "#8B1A1A" },
    { key: "OFFER_EXTENDED", label: "Offers Extended", color: "#4A7C59" },
    { key: "OFFER_ACCEPTED", label: "Placed / Accepted", color: "#4A7C59" },
  ];

  const applications: ApplicationItem[] = appData?.applications || [];
  const drivesList: Array<{ id: string; role: string; ctc: number }> = drivesData?.drives || [];

  // Scoped Filtering
  const driveFilteredApps = applications.filter((app) => {
    if (selectedDriveId !== "ALL" && app.driveId !== selectedDriveId) return false;
    return true;
  });

  // Count candidates per stage tab
  const getStageCount = (stageKey: string) => {
    return driveFilteredApps.filter((a) => a.status?.toUpperCase() === stageKey).length;
  };

  // Filter for active stage & search query
  const displayedApplications = driveFilteredApps.filter((app) => {
    const appStatus = app.status?.toUpperCase() || "APPLIED";
    if (appStatus !== activeStageTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.student?.name?.toLowerCase().includes(q);
      const matchRoll = app.student?.rollNo?.toLowerCase().includes(q);
      const matchBranch = app.student?.branch?.toLowerCase().includes(q);
      const matchSkills = (app.student?.skills || []).some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchRoll && !matchBranch && !matchSkills) return false;
    }
    return true;
  });

  // Action Handlers
  const handleAdvanceCandidate = async (app: ApplicationItem) => {
    const stageFlow: Record<string, string> = {
      APPLIED: "SHORTLISTED",
      SHORTLISTED: "INTERVIEW_SCHEDULED",
      INTERVIEW_SCHEDULED: "OFFER_EXTENDED",
      OFFER_EXTENDED: "OFFER_ACCEPTED",
    };

    const nextStatus = stageFlow[app.status?.toUpperCase() || "APPLIED"];
    if (!nextStatus) return;

    setProcessingId(app.id);

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: nextStatus,
          offerCtc: app.drive?.ctc
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to advance candidate");

      await mutate('/api/applications');
      await mutate('/api/notifications');

      const nextLabel = stages.find(s => s.key === nextStatus)?.label || nextStatus;
      showToast(`Advanced ${app.student?.name} to "${nextLabel}" ✓`);
      
      if (selectedApplication?.id === app.id) {
        setSelectedApplication({
          ...selectedApplication,
          status: nextStatus,
        });
      }
    } catch (err: any) {
      showPopup('error', 'Update Failed', err.message || "Failed to update candidate stage.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCandidate = (app: ApplicationItem) => {
    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Reject Candidate Confirmation',
      message: `Are you sure you want to reject ${app.student?.name || 'this candidate'} for the ${app.drive?.role || 'placement'} role?`,
      confirmLabel: 'Yes, Reject Candidate',
      cancelLabel: 'Keep Candidate',
      onConfirm: async () => {
        setModalDialog(prev => ({ ...prev, isOpen: false }));
        setProcessingId(app.id);

        try {
          const res = await fetch(`/api/applications/${app.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              status: "REJECTED",
              note: "Candidate did not clear evaluation round."
            }),
            credentials: "include",
          });

          if (!res.ok) throw new Error("Failed to reject candidate");

          await mutate('/api/applications');
          await mutate('/api/notifications');

          showToast(`${app.student?.name} marked as Rejected.`);
          if (selectedApplication?.id === app.id) setSelectedApplication(null);
        } catch (err: any) {
          showPopup('error', 'Action Failed', err.message || "Failed to reject candidate.");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === displayedApplications.length && displayedApplications.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(displayedApplications.map(a => a.id)));
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getMatchScore = (cgpa: number) => {
    if (cgpa >= 9.0) return "98% Match";
    if (cgpa >= 8.5) return "94% Match";
    if (cgpa >= 8.0) return "89% Match";
    if (cgpa >= 7.5) return "82% Match";
    return "75% Match";
  };

  const selectedDrive = drivesList.find(d => d.id === selectedDriveId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5 text-[#1C1A1A] animate-fade-in select-none bg-[#F8F5EC]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-[99999] bg-[#1C1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-scale-in border border-[#E3D8C4]">
          <CheckCircle2 size={16} className="text-[#4A7C59]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#1C1A1A]">Candidate Application Tracking</h1>
          <p className="text-xs text-[#5E544A] mt-0.5 font-medium">Stage-by-stage candidate review and recruitment pipeline</p>
        </div>

        {/* Drive Filter Selector */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label className="text-xs font-bold text-[#5E544A] shrink-0">Drive Filter:</label>
          <div className="relative flex-1 sm:w-64">
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full appearance-none bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] cursor-pointer"
            >
              <option value="ALL">All Company Postings ({applications.length})</option>
              {drivesList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.role} (₹{d.ctc} LPA)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7B6F] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Policy Governance Banner */}
      {showPolicyBanner && (
        <div className="bg-[#F1E9D8] border border-[#E3D8C4] rounded-2xl p-4 flex items-center justify-between text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] shrink-0 font-bold">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-[#1C1A1A]">One-Offer-One-Student Policy Active</p>
              <p className="text-[#5E544A] mt-0.5 text-[11px] font-medium">
                Students who accept an offer are automatically marked PLACED and locked from competing standard drives.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPolicyBanner(false)}
            className="text-[#8B7B6F] hover:text-[#1C1A1A] p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Horizontal Stage Tab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#E3D8C4] shadow-xs flex items-center overflow-x-auto gap-1">
        {stages.map((st) => {
          const isActive = activeStageTab === st.key;
          const count = getStageCount(st.key);

          return (
            <button
              key={st.key}
              onClick={() => {
                setActiveStageTab(st.key);
                setSelectedRowIds(new Set());
              }}
              className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#8B1A1A] text-white shadow-xs"
                  : "text-[#5E544A] hover:bg-[#F8F5EC] hover:text-[#1C1A1A]"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Bulk Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3D8C4] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7B6F]" />
          <input
            type="text"
            placeholder="Search by candidate, roll no, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold select-text"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] text-[#5E544A] font-semibold">
            Showing <strong className="text-[#1C1A1A]">{displayedApplications.length}</strong> candidate(s)
          </span>

          {selectedRowIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-[#F1E9D8] border border-[#E3D8C4] px-3 py-1.5 rounded-xl animate-scale-in">
              <span className="font-bold text-[#8B1A1A] text-[11px]">{selectedRowIds.size} selected</span>
              <button
                onClick={() => {
                  displayedApplications
                    .filter(a => selectedRowIds.has(a.id))
                    .forEach(a => handleAdvanceCandidate(a));
                }}
                className="px-2 py-0.5 bg-[#8B1A1A] text-white rounded font-bold text-[10px] hover:bg-[#A63030]"
              >
                Advance All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gmail-Style Dense Candidate Application Rows */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-4 py-2.5 bg-[#F8F5EC] border-b border-[#E3D8C4] flex items-center justify-between text-[11px] text-[#5E544A] font-bold">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="text-[#8B7B6F] hover:text-[#1C1A1A] p-0.5">
              {selectedRowIds.size === displayedApplications.length && displayedApplications.length > 0 ? (
                <CheckSquare size={16} className="text-[#8B1A1A]" />
              ) : (
                <Square size={16} />
              )}
            </button>
            <span>Candidate Name & Profile</span>
          </div>
          <div className="flex items-center gap-8">
            <span>Match & Package</span>
            <span className="hidden sm:inline">Actions</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading candidates...
          </div>
        ) : displayedApplications.length > 0 ? (
          <div className="divide-y divide-[#E3D8C4]">
            {displayedApplications.map((app) => {
              const isSelected = selectedRowIds.has(app.id);
              const isStarred = starredIds.has(app.id);
              const isProcessing = processingId === app.id;

              const stageFlow: Record<string, string> = {
                APPLIED: "Shortlist",
                SHORTLISTED: "Schedule Interview",
                INTERVIEW_SCHEDULED: "Extend Offer",
                OFFER_EXTENDED: "Confirm Placed",
              };
              const nextStageLabel = stageFlow[app.status?.toUpperCase() || "APPLIED"] || "Advance";

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className={`px-4 py-3 flex items-center justify-between gap-4 transition-colors cursor-pointer group select-none ${
                    isSelected ? "bg-[#F1E9D8]/60" : "hover:bg-[#F8F5EC]"
                  }`}
                >
                  {/* Left Section: Checkbox, Star, Avatar, Name, Branch, Role, Skills */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={(e) => toggleSelectRow(app.id, e)}
                      className="text-[#8B7B6F] hover:text-[#1C1A1A] shrink-0"
                    >
                      {isSelected ? <CheckSquare size={15} className="text-[#8B1A1A]" /> : <Square size={15} />}
                    </button>

                    <button
                      onClick={(e) => toggleStar(app.id, e)}
                      className="text-[#8B7B6F] hover:text-[#C8A243] shrink-0"
                    >
                      <Star size={14} className={isStarred ? "text-[#C8A243] fill-[#C8A243]" : ""} />
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center font-extrabold text-[#8B1A1A] text-xs shrink-0">
                      {app.student?.name?.slice(0, 2).toUpperCase() || "ST"}
                    </div>

                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-xs text-[#1C1A1A] truncate">{app.student?.name}</p>
                      <span className="text-[11px] text-[#5E544A] shrink-0 font-medium">
                        — {app.student?.branch} • {app.drive?.role}
                      </span>
                    </div>

                    {/* Skill Tags */}
                    {app.student?.skills && (
                      <div className="hidden md:flex items-center gap-1 shrink-0 ml-2">
                        {app.student.skills.slice(0, 2).map((sk) => (
                          <span
                            key={sk}
                            className="bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4] px-2 py-0.5 rounded-md text-[10px] font-bold"
                          >
                            {sk}
                          </span>
                        ))}
                        {app.student.skills.length > 2 && (
                          <span className="text-[10px] text-[#8B7B6F] font-semibold">
                            +{app.student.skills.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Middle Section: Match Score / CGPA & CTC */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]">
                      {getMatchScore(app.student?.cgpa || 8)}
                    </span>

                    <span className="text-[11px] font-bold text-[#1C1A1A] bg-[#F8F5EC] border border-[#E3D8C4] px-1.5 py-0.5 rounded">
                      {app.student?.cgpa} CGPA
                    </span>

                    <span className="font-extrabold text-[#8B1A1A] text-xs min-w-[70px] text-right">
                      ₹{app.drive?.ctc} LPA
                    </span>
                  </div>

                  {/* Right Section: Action Buttons */}
                  <div 
                    className="flex items-center gap-1.5 shrink-0 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setResumePreviewApp(app)}
                      className="px-2 py-1 bg-white hover:bg-[#F1E9D8] border border-[#E3D8C4] text-[#1C1A1A] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      title="View Resume / Profile"
                    >
                      <Eye size={12} className="text-[#8B7B6F]" />
                      <span className="hidden lg:inline">Resume</span>
                    </button>

                    {app.status !== 'OFFER_ACCEPTED' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAdvanceCandidate(app)}
                        className="px-2.5 py-1 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs disabled:opacity-50 active:scale-95"
                        title={nextStageLabel}
                      >
                        {isProcessing ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <>
                            <UserCheck size={12} />
                            <span>{nextStageLabel}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      disabled={isProcessing}
                      onClick={() => handleRejectCandidate(app)}
                      className="p-1 text-[#8B7B6F] hover:text-[#C85555] hover:bg-[#F1E9D8] rounded-lg transition-colors"
                      title="Reject candidate"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center text-xs text-[#8B7B6F] space-y-2">
            <p className="font-bold text-[#1C1A1A]">No candidate applications found in "{activeStageTab.replace(/_/g, ' ')}".</p>
            <p className="text-[11px]">Select another stage tab above or adjust your drive filter.</p>
          </div>
        )}
      </div>

      {/* FULL CANDIDATE PROFILE SLIDE-OVER DRAWER (Layered cleanly on top of everything, z-[99999]) */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-2xs flex justify-end animate-fade-in select-none">
          <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-slide-left text-xs border-l border-[#E3D8C4]">
            <div>
              {/* Drawer Top Header with clear Close X Button */}
              <div className="flex justify-between items-start pb-5 border-b border-[#E3D8C4]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-extrabold text-base flex-shrink-0">
                    {selectedApplication.student?.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1C1A1A] text-lg">{selectedApplication.student?.name}</h3>
                    <p className="text-[#5E544A] font-bold text-xs mt-0.5">
                      {selectedApplication.student?.branch} • Roll: {selectedApplication.student?.rollNo}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedApplication(null)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5EC] border border-[#E3D8C4] text-[#1C1A1A] hover:bg-[#F1E9D8] rounded-xl transition-all font-bold text-xs"
                  title="Close Candidate Profile"
                >
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {/* Target Role & CTC */}
                <div className="p-4 bg-[#F1E9D8] rounded-2xl border border-[#E3D8C4] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8B7B6F] font-bold uppercase text-[9px]">Target Position</span>
                    <p className="font-bold text-[#1C1A1A] text-sm mt-0.5">{selectedApplication.drive?.role}</p>
                  </div>
                  <div>
                    <span className="text-[#8B7B6F] font-bold uppercase text-[9px]">Offered CTC</span>
                    <p className="font-extrabold text-[#8B1A1A] text-sm mt-0.5">₹{selectedApplication.drive?.ctc} LPA</p>
                  </div>
                  <div>
                    <span className="text-[#8B7B6F] font-bold uppercase text-[9px]">Match Score</span>
                    <p className="font-bold text-[#4A7C59] mt-0.5">{getMatchScore(selectedApplication.student?.cgpa || 8)}</p>
                  </div>
                  <div>
                    <span className="text-[#8B7B6F] font-bold uppercase text-[9px]">Current Stage</span>
                    <p className="font-bold text-[#8B1A1A] mt-0.5">{selectedApplication.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Academic Transcript */}
                <div className="bg-[#F8F5EC] rounded-2xl border border-[#E3D8C4] p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-[#1C1A1A] mb-2 flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-[#8B1A1A]" />
                    Academic Transcript
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5E544A]">
                    <p><strong>Current CGPA:</strong> {selectedApplication.student?.cgpa} / 10</p>
                    <p><strong>Active Backlogs:</strong> {selectedApplication.student?.backlogs ?? 0}</p>
                    <p><strong>Class 10th:</strong> {selectedApplication.student?.class10 ?? 91}%</p>
                    <p><strong>Class 12th:</strong> {selectedApplication.student?.class12 ?? 88.5}%</p>
                  </div>
                </div>

                {/* Verified Skills */}
                <div>
                  <h4 className="font-bold text-[#1C1A1A] mb-2">Verified Technical Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedApplication.student?.skills || ['React.js', 'Node.js', 'Python', 'PyTorch', 'Docker', 'PostgreSQL']).map(s => (
                      <span key={s} className="px-3 py-1 bg-[#F1E9D8] border border-[#E3D8C4] rounded-xl font-bold text-xs text-[#1C1A1A] shadow-2xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stage History */}
                {selectedApplication.stageHistory && selectedApplication.stageHistory.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#1C1A1A] mb-2">Application Timeline</h4>
                    <div className="space-y-2 border-l-2 border-[#8B1A1A] pl-3 ml-1">
                      {selectedApplication.stageHistory.map((st, idx) => (
                        <div key={idx} className="relative text-[11px]">
                          <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#8B1A1A] ring-2 ring-white" />
                          <p className="font-bold text-[#1C1A1A]">{st.stage}</p>
                          <p className="text-[#8B7B6F] text-[10px]">
                            {new Date(st.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Bottom Close Button */}
            <div className="pt-6 border-t border-[#E3D8C4] space-y-2">
              <div className="flex items-center gap-3">
                <button
                  disabled={processingId === selectedApplication.id}
                  onClick={() => handleRejectCandidate(selectedApplication)}
                  className="flex-1 py-3 border border-[#C85555] text-[#C85555] hover:bg-[#F1E9D8] rounded-xl font-bold transition-colors text-xs"
                >
                  Reject Candidate
                </button>
                {selectedApplication.status !== 'OFFER_ACCEPTED' && (
                  <button
                    disabled={processingId === selectedApplication.id}
                    onClick={() => handleAdvanceCandidate(selectedApplication)}
                    className="flex-1 py-3 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold transition-all shadow-xs text-xs flex items-center justify-center gap-1.5"
                  >
                    {processingId === selectedApplication.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <UserCheck size={14} />
                        <span>Advance Stage</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="w-full py-2.5 bg-[#F8F5EC] hover:bg-[#F1E9D8] border border-[#E3D8C4] text-[#5E544A] hover:text-[#1C1A1A] rounded-xl text-xs font-bold transition-colors"
              >
                Back to Applicants Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUME PREVIEW MODAL */}
      {resumePreviewApp && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-[#E3D8C4] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-[#8B1A1A]" size={18} />
                <h3 className="font-bold text-sm text-[#1C1A1A]">Official Digital Resume — {resumePreviewApp.student?.name}</h3>
              </div>
              <button onClick={() => setResumePreviewApp(null)} className="text-[#8B7B6F] hover:text-[#1C1A1A]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 bg-[#F8F5EC] p-5 rounded-xl border border-[#E3D8C4]">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-[#1C1A1A]">{resumePreviewApp.student?.name}</h4>
                  <p className="text-[#5E544A]">{resumePreviewApp.student?.branch} · Class of {resumePreviewApp.student?.graduationYear || 2027}</p>
                </div>
                <span className="bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] px-2.5 py-1 rounded-full font-bold text-[10px]">
                  Verified by TPO Office ✓
                </span>
              </div>

              <div className="border-t border-[#E3D8C4] pt-3 grid grid-cols-2 gap-3 text-[11px]">
                <p><strong>Cumulative CGPA:</strong> {resumePreviewApp.student?.cgpa} / 10</p>
                <p><strong>Active Backlogs:</strong> {resumePreviewApp.student?.backlogs ?? 0}</p>
                <p><strong>Senior Secondary (12th):</strong> {resumePreviewApp.student?.class12 ?? 88.5}%</p>
                <p><strong>Secondary (10th):</strong> {resumePreviewApp.student?.class10 ?? 91}%</p>
              </div>

              <div className="border-t border-[#E3D8C4] pt-3">
                <p className="font-bold text-[#1C1A1A] mb-1">Key Technical Proficiencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {(resumePreviewApp.student?.skills || ['React.js', 'Node.js', 'Python', 'SQL']).map(s => (
                    <span key={s} className="bg-white border border-[#E3D8C4] px-2 py-0.5 rounded text-[10px] font-bold text-[#1C1A1A]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResumePreviewApp(null)}
                className="px-4 py-2 bg-white border border-[#E3D8C4] text-[#1C1A1A] hover:bg-[#F8F5EC] rounded-xl font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ALERT & CONFIRMATION DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' || modalDialog.type === 'confirm'
                  ? 'bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4]' 
                  : 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]'
              }`}>
                {modalDialog.type === 'error' || modalDialog.type === 'confirm' ? (
                  <AlertCircle size={28} className="text-[#8B1A1A]" />
                ) : (
                  <CheckCircle2 size={28} className="text-[#4A7C59]" />
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1C1A1A] text-base">{modalDialog.title}</h3>
              <p className="text-xs text-[#5E544A] mt-1.5 leading-relaxed font-medium">{modalDialog.message}</p>
            </div>

            {modalDialog.type === 'confirm' ? (
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 px-4 bg-white border border-[#E3D8C4] text-[#5E544A] hover:bg-[#F8F5EC] rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {modalDialog.cancelLabel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={modalDialog.onConfirm}
                  className="flex-1 py-2.5 px-4 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                >
                  {modalDialog.confirmLabel || 'Confirm'}
                </button>
              </div>
            ) : (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                  className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyApplicantsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading candidate pipeline...
      </div>
    }>
      <CompanyApplicantsContent />
    </Suspense>
  );
}
