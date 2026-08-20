"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { 
  Plus, Search, MapPin, Briefcase, Calendar, 
  Users, CheckCircle2, Clock, IndianRupee, X,
  Building2, Building, AlertCircle, Loader2, Edit3, Trash2, Check, Sparkles, Activity
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

  // Real-time Optimization Progress Indicator (Requirement 5)
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Form State
  const [roleTitle, setRoleTitle] = useState("");
  const [ctc, setCtc] = useState("12.0");
  const [location, setLocation] = useState("Bengaluru, India");
  const [mode, setMode] = useState("Hybrid");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [deadline, setDeadline] = useState("2026-08-28");
  const [driveDate, setDriveDate] = useState("2026-09-02");
  const [description, setDescription] = useState("");
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
    setMode(drive.mode || 'HYBRID');
    setJobType(drive.jobType || 'FULL_TIME');
    setDeadline(drive.deadline ? drive.deadline.split('T')[0] : '2024-11-15');
    setDriveDate(drive.driveDate ? drive.driveDate.split('T')[0] : '2024-11-20');
    setMinCGPA(drive.minCGPA || 7.0);
    setMaxBacklogs(drive.maxBacklogs || 0);
    setBranches(drive.branches || ['CSE', 'IT']);
    setIsEditModalOpen(true);
  };

  // Optimized Fast Create Drive (Requirement 1 & 5)
  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSyncStatus("Creating and syncing our drive in real-time...");

    try {
      if (!roleTitle.trim()) throw new Error("Role title is required");

      const payload = {
        role: roleTitle.trim(),
        ctc: parseFloat(ctc) || 10,
        location: location.trim() || 'New Delhi',
        mode: mode.toUpperCase(),
        jobType,
        deadline: new Date(deadline).toISOString(),
        driveDate: new Date(driveDate).toISOString(),
        description: description.trim(),
        minCGPA: Number(minCGPA),
        maxBacklogs: Number(maxBacklogs),
        minClass10: 75,
        minClass12: 75,
        offerPolicy,
        branches,
        rounds: ["Online Assessment", "Technical Interview 1", "HR Interview"],
      };

      setIsModalOpen(false);
      await apiCreateDrive(payload);
      
      // Fast parallel mutations
      mutate('/api/drives');
      mutate('/api/notifications');
      setSyncStatus(null);
      showPopup('success', 'Drive Submitted for Verification', 'Our recruitment drive has been created and submitted to TPO Admin. Once verified, it will be published to eligible students.');
      
      setRoleTitle("");
      setCtc("12.0");
    } catch (err: any) {
      setSyncStatus(null);
      showPopup('error', 'Submission Failed', err.message || 'Could not submit drive.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ultra-Fast Optimized Edit Drive (Requirement 1 & 5)
  const handleUpdateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrive) return;
    setSubmitting(true);
    setSyncStatus("Updating drive changes in real-time...");

    try {
      const updatedData = {
        role: roleTitle.trim(),
        ctc: parseFloat(ctc) || 10,
        location: location.trim(),
        mode: mode.toUpperCase(),
        jobType,
        deadline: new Date(deadline).toISOString(),
        driveDate: new Date(driveDate).toISOString(),
        minCGPA: Number(minCGPA),
        maxBacklogs: Number(maxBacklogs),
        branches,
      };

      // Close modal immediately for zero-lag feeling
      setIsEditModalOpen(false);

      // Optimistic cache update
      if (data?.drives) {
        mutate('/api/drives', {
          drives: data.drives.map(d => d.id === editingDrive.id ? { ...d, ...updatedData } : d)
        }, false);
      }

      await apiUpdateDrive(editingDrive.id, updatedData);
      mutate('/api/drives');
      mutate('/api/notifications');
      setSyncStatus(null);
      setEditingDrive(null);
      showPopup('success', 'Drive Updated', 'Our recruitment drive details have been updated and synced.');
    } catch (err: any) {
      setSyncStatus(null);
      showPopup('error', 'Update Failed', err.message || 'Could not update drive.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ultra-Fast Optimized Delete Drive (Requirement 1 & 5)
  const promptDeleteDrive = (drive: DriveItem) => {
    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Placement Drive?',
      message: `Are you sure you want to permanently delete "${drive.role}" from our posted drives? All associated applicant records will also be removed.`,
      onConfirm: async () => {
        setSyncStatus("Deleting drive and purging records in real-time...");
        try {
          // Optimistic instant UI removal
          if (data?.drives) {
            mutate('/api/drives', {
              drives: data.drives.filter(d => d.id !== drive.id)
            }, false);
          }

          const res = await fetch(`/api/drives/${drive.id}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) throw new Error('Failed to delete drive');
          
          mutate('/api/drives');
          mutate('/api/notifications');
          setSyncStatus(null);
          showPopup('success', 'Drive Deleted', 'Our recruitment drive has been successfully removed.');
        } catch (err: any) {
          setSyncStatus(null);
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
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-stone-800 animate-fade-in select-none">
      {/* Real-time Status Sync Banner (Requirement 5) */}
      {syncStatus && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-scale-in">
          <div className="flex items-center gap-2">
            <Activity size={14} className="animate-spin text-orange-600" />
            <span>{syncStatus}</span>
          </div>
          <span className="text-[10px] bg-orange-100 px-2 py-0.5 rounded-full font-bold">Fast-Sync</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs select-none">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Our Placement Drives</h2>
          <p className="text-xs text-stone-500 mt-0.5">Create, edit, schedule, and track our company recruitment drives</p>
        </div>
        <button 
          onClick={() => {
            setRoleTitle("");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create New Drive
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Search our drives by role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 select-text"
          />
        </div>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Loading our placement drives...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDrives.map((drive) => {
            const isApproved = drive.approvalStatus?.toLowerCase() === 'approved';
            const isPending = drive.approvalStatus?.toLowerCase() === 'pending';

            return (
              <div 
                key={drive.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card hover:shadow-md transition-all flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {drive.jobType?.replace(/_/g, ' ') || 'FULL TIME'}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 mt-1.5">{drive.role}</h3>
                      <p className="text-xs text-stone-500 font-semibold">{drive.company?.name}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isApproved ? (
                        <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      ) : isPending ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Clock size={11} /> Pending TPO
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {drive.approvalStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 mb-3 text-[11px]">
                    <div>
                      <p className="text-stone-400 font-bold uppercase text-[9px]">Compensation</p>
                      <p className="text-sm font-extrabold text-orange-600">₹{drive.ctc} LPA</p>
                    </div>
                    <div>
                      <p className="text-stone-400 font-bold uppercase text-[9px]">Location & Mode</p>
                      <p className="font-semibold text-stone-700 truncate">{drive.location} ({drive.mode})</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-stone-500 text-[11px] mb-3">
                    <p><strong>Min CGPA:</strong> {drive.minCGPA} | <strong>Max Backlogs:</strong> {drive.maxBacklogs}</p>
                    <p><strong>Drive Date:</strong> {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Card Actions: Edit, Delete, View Applicants */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(drive)}
                      className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors active:scale-95"
                      title="Edit this drive"
                    >
                      <Edit3 size={13} className="text-stone-500" />
                      Edit
                    </button>
                    <button
                      onClick={() => promptDeleteDrive(drive)}
                      className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                      title="Delete this drive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <span className="text-[11px] text-stone-500 font-semibold">
                    {drive._count?.applications || 0} Registered
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DRIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Briefcase size={16} className="text-orange-400" />
                <span>Post New Placement Drive</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Job Role Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. SDE-1 (Full Stack)"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 focus:ring-1 focus:ring-orange-500 font-semibold select-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">CTC Package (LPA) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 font-bold text-orange-600 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Work Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Application Deadline</label>
                  <input 
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Drive Assessment Date</label>
                  <input 
                    type="date"
                    required
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50"
                  />
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">Academic Eligibility Rules</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Min CGPA ({minCGPA})</label>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      value={minCGPA}
                      onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Max Active Backlogs</label>
                    <input 
                      type="number" min="0"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 mb-1">Eligible Branches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBranchesList.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          branches.includes(b)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-stone-600 border-stone-200'
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
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Edit3 size={16} className="text-orange-400" />
                <span>Edit Placement Drive — {editingDrive.role}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDrive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Job Role Title</label>
                <input 
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 font-semibold select-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">CTC Package (LPA)</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 font-bold text-orange-600 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Work Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Application Deadline</label>
                  <input 
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Drive Date</label>
                  <input 
                    type="date"
                    required
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50"
                  />
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Min CGPA ({minCGPA})</label>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      value={minCGPA}
                      onChange={(e) => setMinCGPA(parseFloat(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Max Active Backlogs</label>
                    <input 
                      type="number" min="0"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 mb-1">Eligible Branches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBranchesList.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          branches.includes(b)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-stone-600 border-stone-200'
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
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED POPUP DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' :
                modalDialog.type === 'confirm' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-600'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> :
                 modalDialog.type === 'confirm' ? <Trash2 size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">{modalDialog.title}</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              {modalDialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modalDialog.onConfirm) modalDialog.onConfirm();
                      setModalDialog({ ...modalDialog, isOpen: false });
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Yes, Delete Drive
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
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
