"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { 
  Plus, Search, MapPin, Briefcase, Calendar, 
  Users, CheckCircle2, Clock, IndianRupee, X,
  Building2, Building, AlertCircle, Loader2, Edit3, Trash2, Check, Sparkles, Activity, ArrowRight, FileText
} from "lucide-react";
import { fetcher, apiCreateDrive, apiUpdateDrive } from "@/lib/api-client";

interface DriveItem {
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
  company: {
    name: string;
    tier: string;
    logo?: string;
  };
  _count?: {
    applications: number;
  };
}

export default function CompanyDrivesPage() {
  const { data, isLoading } = useSWR<{ drives: DriveItem[] }>('/api/drives', fetcher, { refreshInterval: 2000 });
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<DriveItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [roleTitle, setRoleTitle] = useState("");
  const [ctc, setCtc] = useState("12.0");
  const [location, setLocation] = useState("Bengaluru, India");
  const [mode, setMode] = useState("Hybrid");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [deadline, setDeadline] = useState("2026-08-28");
  const [driveDate, setDriveDate] = useState("2026-09-02");
  const [description, setDescription] = useState("We are looking for passionate engineers to join our high-growth engineering organization.");
  const [openings, setOpenings] = useState<number>(5);
  const [minCGPA, setMinCGPA] = useState<number>(7.5);
  const [maxBacklogs, setMaxBacklogs] = useState<number>(0);
  
  const { data: branchesData } = useSWR<{ branches: string[] }>('/api/branches', fetcher);
  const availableBranchesList = branchesData?.branches || ['AI-DS', 'AI-ML', 'AR', 'IIOT'];
  const [branches, setBranches] = useState<string[]>(['AI-DS', 'AI-ML', 'AR', 'IIOT']);
  const [offerPolicy, setOfferPolicy] = useState("STANDARD");

  // Centered Dialog State
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const tabs = ["All", "Active", "Pending", "Upcoming", "Completed"];
  const drives = data?.drives || [];

  const toggleBranch = (b: string) => {
    setBranches(prev => 
      prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]
    );
  };

  const openEditModal = (drive: DriveItem) => {
    setEditingDrive(drive);
    setRoleTitle(drive.role);
    setCtc(String(drive.ctc));
    setLocation(drive.location || 'Bengaluru');
    setMode(drive.mode || 'Hybrid');
    setJobType(drive.jobType || 'FULL_TIME');
    setDeadline(drive.deadline ? drive.deadline.split('T')[0] : '2026-08-28');
    setDriveDate(drive.driveDate ? drive.driveDate.split('T')[0] : '2026-09-02');
    setDescription(drive.description || "We are looking for passionate engineers to join our engineering team.");
    setOpenings(drive.openings || 5);
    setMinCGPA(drive.minCGPA || 7.5);
    setMaxBacklogs(drive.maxBacklogs || 0);
    setBranches(Array.isArray(drive.branches) && drive.branches.length > 0 ? drive.branches : ['AI-DS', 'AI-ML', 'AR', 'IIOT']);
    setIsEditModalOpen(true);
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();

    // Date validation: No dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineD = new Date(deadline);
    deadlineD.setHours(0, 0, 0, 0);

    const driveD = new Date(driveDate);
    driveD.setHours(0, 0, 0, 0);

    if (deadlineD < today || driveD < today) {
      showPopup('error', 'Invalid Date', 'It is not possible to post a drive before the current date (in the past). Please select today or a future date.');
      return;
    }

    if (Number(openings) <= 0) {
      showPopup('error', 'Invalid Openings', 'Number of job openings / positions cannot be zero. Please specify at least 1 opening.');
      return;
    }

    if (!description.trim()) {
      showPopup('error', 'Missing Description', 'Please provide a job description for the recruitment drive.');
      return;
    }

    setSubmitting(true);

    try {
      await apiCreateDrive({
        role: roleTitle.trim(),
        ctc: parseFloat(ctc) || 10,
        location,
        mode,
        jobType,
        deadline,
        driveDate,
        description: description.trim(),
        openings: Number(openings) || 1,
        minCGPA,
        maxBacklogs,
        branches,
        rounds: ["Online Assessment", "Technical Interview", "Managerial / HR"],
        offerPolicy,
      });

      await mutate('/api/drives');
      await mutate('/api/notifications');
      setIsModalOpen(false);
      showPopup('success', 'Drive Submitted Successfully', 'Your placement drive has been submitted to the TPO admin for approval. It is synced with the admin and student dashboards.');
    } catch (err: any) {
      showPopup('error', 'Submission Failed', err.message || 'Could not submit recruitment drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrive) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const driveD = new Date(driveDate);
    driveD.setHours(0, 0, 0, 0);

    if (driveD < today) {
      showPopup('error', 'Invalid Date', 'Drive assessment date cannot be set before the current date.');
      return;
    }

    if (Number(openings) <= 0) {
      showPopup('error', 'Invalid Openings', 'Number of job openings cannot be zero.');
      return;
    }

    setSubmitting(true);

    try {
      await apiUpdateDrive(editingDrive.id, {
        role: roleTitle.trim(),
        ctc: parseFloat(ctc) || 10,
        location,
        mode,
        jobType,
        deadline,
        driveDate,
        description: description.trim(),
        openings: Number(openings) || 1,
        minCGPA,
        maxBacklogs,
        branches,
      });

      await mutate('/api/drives');
      await mutate('/api/notifications');
      setIsEditModalOpen(false);
      showPopup('success', 'Drive Updated', 'Placement drive details updated successfully.');
    } catch (err: any) {
      showPopup('error', 'Update Failed', err.message || 'Could not update drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const promptDeleteDrive = (drive: DriveItem) => {
    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Placement Drive?',
      message: `Are you sure you want to permanently delete "${drive.role}" from our posted drives? All associated applicant records will also be removed.`,
      onConfirm: async () => {
        try {
          if (data?.drives) {
            mutate('/api/drives', {
              drives: data.drives.filter(d => d.id !== drive.id)
            }, false);
          }

          const res = await fetch(`/api/drives/${drive.id}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) throw new Error('Failed to delete drive');
          
          mutate('/api/drives');
          mutate('/api/notifications');
          showPopup('success', 'Drive Deleted', 'Our recruitment drive has been successfully removed.');
        } catch (err: any) {
          showPopup('error', 'Delete Failed', err.message || 'Could not delete drive.');
        }
      }
    });
  };

  const filteredDrives = drives.filter(drive => {
    if (searchTerm && !drive.role.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeTab === "Active" && drive.approvalStatus?.toLowerCase() !== "approved") return false;
    if (activeTab === "Pending" && drive.approvalStatus?.toLowerCase() !== "pending") return false;
    if (activeTab === "Completed" && drive.status?.toLowerCase() !== "completed") return false;
    if (activeTab === "Upcoming" && drive.status?.toLowerCase() !== "upcoming") return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-[#1C1A1A] animate-fade-in select-none bg-[#F8F5EC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs select-none">
        <div>
          <h2 className="text-xl font-bold text-[#1C1A1A]">Our Placement Drives</h2>
          <p className="text-xs text-[#5E544A] mt-0.5 font-medium">Create, edit, schedule, and track our company recruitment drives</p>
        </div>
        <button 
          onClick={() => {
            setRoleTitle("");
            setDescription("We are looking for passionate engineers to join our high-growth engineering organization.");
            setOpenings(5);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2.5 bg-[#8B1A1A] text-white text-xs font-bold rounded-xl hover:bg-[#A63030] shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create New Drive
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex bg-[#F1E9D8] p-1 rounded-xl w-fit border border-[#E3D8C4]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-[#8B1A1A] shadow-xs"
                  : "text-[#5E544A] hover:text-[#1C1A1A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8B7B6F]" />
          <input
            type="text"
            placeholder="Search role title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold select-text"
          />
        </div>
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading our recruitment drives...
          </div>
        ) : filteredDrives.length > 0 ? (
          filteredDrives.map((drive) => {
            const isApproved = drive.approvalStatus?.toLowerCase() === "approved";
            const isPending = drive.approvalStatus?.toLowerCase() === "pending";

            return (
              <div 
                key={drive.id} 
                className="bg-white border border-[#E3D8C4] rounded-2xl p-6 shadow-card hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center font-extrabold text-[#8B1A1A] text-sm">
                        {drive.role.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1C1A1A] text-sm">{drive.role}</h3>
                        <p className="text-xs text-[#5E544A] flex items-center gap-2 mt-0.5 font-medium">
                          <span>{drive.location}</span>
                          <span>•</span>
                          <span className="bg-[#F8F5EC] border border-[#E3D8C4] px-1.5 py-0.2 rounded font-semibold">{drive.mode}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {isApproved ? (
                        <span className="bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Approved
                        </span>
                      ) : isPending ? (
                        <span className="bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4] px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock size={11} /> Pending TPO Approval
                        </span>
                      ) : (
                        <span className="bg-[#F8F5EC] text-[#5E544A] border border-[#E3D8C4] px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {drive.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Job Description & Openings Snippet */}
                  {drive.description && (
                    <p className="mt-3 text-xs text-[#5E544A] line-clamp-2 leading-relaxed bg-[#F8F5EC] p-2.5 rounded-xl border border-[#E3D8C4]/60 font-medium">
                      {drive.description}
                    </p>
                  )}

                  {/* Key Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] text-center text-xs">
                    <div>
                      <span className="text-[#8B7B6F] text-[10px] uppercase font-bold block">Package</span>
                      <span className="font-extrabold text-[#8B1A1A] text-sm">₹{drive.ctc} LPA</span>
                    </div>
                    <div>
                      <span className="text-[#8B7B6F] text-[10px] uppercase font-bold block">Openings</span>
                      <span className="font-bold text-[#1C1A1A] text-sm">{drive.openings || 5} Positions</span>
                    </div>
                    <div>
                      <span className="text-[#8B7B6F] text-[10px] uppercase font-bold block">Applicants</span>
                      <span className="font-bold text-[#4A7C59] text-sm">{drive._count?.applications || 0}</span>
                    </div>
                  </div>

                  {/* Criteria row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#5E544A] font-medium">
                    <span>Min CGPA: <strong className="text-[#1C1A1A]">{drive.minCGPA}</strong></span>
                    <span>•</span>
                    <span>Max Backlogs: <strong className="text-[#1C1A1A]">{drive.maxBacklogs}</strong></span>
                    <span>•</span>
                    <span>Branches: <strong className="text-[#1C1A1A]">{(drive.branches || []).join(', ')}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E3D8C4] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(drive)}
                      className="p-1.5 text-[#5E544A] hover:text-[#1C1A1A] hover:bg-[#F1E9D8] rounded-lg transition-colors border border-[#E3D8C4]"
                      title="Edit Drive"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => promptDeleteDrive(drive)}
                      className="p-1.5 text-[#8B7B6F] hover:text-[#C85555] hover:bg-[#F1E9D8] rounded-lg transition-colors border border-[#E3D8C4]"
                      title="Delete Drive"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <Link
                    href={`/company/applicants?driveId=${drive.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3D8C4] hover:bg-[#F1E9D8] text-[#8B1A1A] rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>View Applicants</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-xs text-[#8B7B6F] bg-white rounded-2xl border border-[#E3D8C4] p-8 space-y-2">
            <p className="font-bold text-sm text-[#1C1A1A]">No placement drives posted in "{activeTab}".</p>
            <p className="text-[11px]">Click "Create New Drive" to post a new opening for GGSIPU candidates.</p>
          </div>
        )}
      </div>

      {/* CREATE DRIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-[#1C1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Briefcase size={16} className="text-[#C8A243]" />
                <span>Post New Placement Drive</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8B7B6F] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Job Role Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. SDE-1 (Full Stack)"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] font-semibold select-text"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Job Description *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Detail the job responsibilities, required qualifications, and technology stack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] font-semibold select-text leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">CTC Package (LPA) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] font-bold text-[#8B1A1A] select-text"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Job Openings *</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={openings}
                    onChange={(e) => setOpenings(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] font-bold text-[#1C1A1A] select-text"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Work Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] font-semibold"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Application Deadline</label>
                  <input 
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Drive Assessment Date</label>
                  <input 
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A]"
                  />
                </div>
              </div>

              <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4] space-y-3">
                <span className="font-bold text-[#5E544A] uppercase text-[10px]">Academic Eligibility Rules</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#5E544A] mb-1">Min CGPA ({minCGPA})</label>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      value={minCGPA}
                      onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                      className="w-full accent-[#8B1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#5E544A] mb-1">Max Active Backlogs</label>
                    <input 
                      type="number" min="0"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full border border-[#E3D8C4] rounded-xl px-3 py-1.5 text-xs bg-white text-[#1C1A1A] select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Eligible Branches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBranchesList.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          branches.includes(b)
                            ? 'bg-[#8B1A1A] text-white border-[#8B1A1A]'
                            : 'bg-white text-[#5E544A] border-[#E3D8C4]'
                        }`}
                      >
                        {b} {branches.includes(b) ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Submit Drive for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVE MODAL */}
      {isEditModalOpen && editingDrive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-[#1C1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Edit3 size={16} className="text-[#C8A243]" />
                <span>Edit Placement Drive — {editingDrive.role}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#8B7B6F] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDrive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Job Role Title *</label>
                <input 
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] font-semibold select-text"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Job Description *</label>
                <textarea 
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] font-semibold select-text leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">CTC Package (LPA) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] font-bold text-[#8B1A1A] select-text"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Openings *</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={openings}
                    onChange={(e) => setOpenings(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] font-bold text-[#1C1A1A] select-text"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Work Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] font-semibold"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Application Deadline</label>
                  <input 
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Drive Date</label>
                  <input 
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A]"
                  />
                </div>
              </div>

              <div className="bg-[#F8F5EC] p-3.5 rounded-xl border border-[#E3D8C4] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#5E544A] mb-1">Min CGPA ({minCGPA})</label>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      value={minCGPA}
                      onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                      className="w-full accent-[#8B1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#5E544A] mb-1">Max Backlogs</label>
                    <input 
                      type="number" min="0"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full border border-[#E3D8C4] rounded-xl px-3 py-1.5 text-xs bg-white text-[#1C1A1A] select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Eligible Branches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBranchesList.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          branches.includes(b)
                            ? 'bg-[#8B1A1A] text-white border-[#8B1A1A]'
                            : 'bg-white text-[#5E544A] border-[#E3D8C4]'
                        }`}
                      >
                        {b} {branches.includes(b) ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP ALERT & DELETE CONFIRMATION DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]' :
                modalDialog.type === 'confirm' ? 'bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4]' : 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> :
                 modalDialog.type === 'confirm' ? <Trash2 size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1C1A1A] text-base">{modalDialog.title}</h3>
              <p className="text-xs text-[#5E544A] mt-1.5 leading-relaxed font-medium">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              {modalDialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                    className="px-4 py-2 border border-[#E3D8C4] hover:bg-[#F8F5EC] rounded-xl text-xs font-bold text-[#5E544A]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modalDialog.onConfirm) modalDialog.onConfirm();
                      setModalDialog({ ...modalDialog, isOpen: false });
                    }}
                    className="px-5 py-2 bg-[#C85555] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Yes, Delete Drive
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                  className="px-6 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
