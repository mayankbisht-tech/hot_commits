"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { 
  ChevronRight, X, IndianRupee, AlertTriangle, 
  ChevronDown, Search, Filter, Loader2, CheckCircle2, UserCheck, ShieldAlert, Award, AlertCircle
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface ApplicationItem {
  id: string;
  status: string;
  appliedOn: string;
  student: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
    cgpa: number;
    skills?: string[];
  };
  drive: {
    id: string;
    role: string;
    ctc: number;
    company?: { name: string };
  };
  stageHistory?: any[];
}

export default function CompanyApplicantsPage() {
  const { data: appData, isLoading } = useSWR<{ applications: ApplicationItem[] }>(
    '/api/applications', 
    fetcher, 
    { refreshInterval: 2000 }
  );
  const { data: drivesData } = useSWR<any>('/api/drives', fetcher);

  const [selectedDriveId, setSelectedDriveId] = useState<string>("ALL");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Centered Modal Dialog for Errors & Confirmation (Requirement 5)
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

  const applications = appData?.applications || [];
  const drives = drivesData?.drives || [];

  const stages = [
    { id: "APPLIED", name: "Applied", color: "bg-stone-100 text-stone-700", border: "border-stone-200" },
    { id: "SHORTLISTED", name: "Shortlisted", color: "bg-amber-100 text-amber-800", border: "border-amber-400" },
    { id: "INTERVIEW_SCHEDULED", name: "Interview Scheduled", color: "bg-orange-100 text-orange-800", border: "border-orange-500" },
    { id: "OFFER_EXTENDED", name: "Offers Extended", color: "bg-green-100 text-green-800", border: "border-green-500" },
  ];

  const getNextStage = (current: string): string => {
    switch (current?.toUpperCase()) {
      case 'APPLIED': return 'SHORTLISTED';
      case 'SHORTLISTED': return 'INTERVIEW_SCHEDULED';
      case 'INTERVIEW_SCHEDULED': return 'OFFER_EXTENDED';
      default: return 'OFFER_EXTENDED';
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Move candidate to next stage (Functional Real-time Update)
  const handleUpdateStatus = async (appId: string, nextStatus: string) => {
    setProcessingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: nextStatus,
          note: `Advanced to ${nextStatus.replace(/_/g, ' ')} by recruiter.`
        }),
        credentials: 'include'
      });
      
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to update stage');
      
      await mutate('/api/applications');
      await mutate('/api/reports/stats');
      showToast(`Candidate status updated to ${nextStatus.replace(/_/g, ' ')}!`);
      if (selectedApplication?.id === appId) {
        setSelectedApplication(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err: any) {
      showPopup('error', 'Stage Update Failed', err.message || 'Could not advance candidate stage.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApps = applications.filter(a => {
    if (selectedDriveId !== "ALL" && a.drive?.id !== selectedDriveId) return false;
    return true;
  });

  const getCgpaColor = (cgpa: number) => {
    if (cgpa >= 9) return "bg-green-100 text-green-700";
    if (cgpa >= 8) return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-6 text-stone-800 animate-fade-in select-none">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-scale-in">
          <CheckCircle2 size={15} className="text-green-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Policy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">One-Offer-One-Student Policy Active</h4>
          <p className="text-amber-700 mt-0.5">Students who accept an offer are automatically marked PLACED and gated from conflicting standard drives.</p>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Candidate Pipeline & Shortlisting</h2>
          <p className="text-xs text-stone-500 mt-0.5">Real-time candidate stages, interviews, and offer management</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="ALL">All Active Drives ({drives.length})</option>
            {drives.map((d: any) => (
              <option key={d.id} value={d.id}>{d.role} (₹{d.ctc} LPA)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Loading candidate pipeline...
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage) => {
              const stageApplicants = filteredApps.filter(a => {
                const s = a.status?.toUpperCase();
                if (stage.id === "OFFER_EXTENDED") {
                  return s === "OFFER_EXTENDED" || s === "OFFER_ACCEPTED";
                }
                return s === stage.id;
              });
              
              return (
                <div key={stage.id} className="w-80 flex flex-col bg-stone-50/70 rounded-2xl border border-stone-200 overflow-hidden">
                  <div className={`p-3.5 border-b border-stone-200 bg-white flex justify-between items-center border-t-4 ${stage.border}`}>
                    <h3 className="font-bold text-xs text-stone-800">{stage.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.color}`}>
                      {stageApplicants.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {stageApplicants.map((app) => {
                      const isOfferAccepted = app.status?.toUpperCase() === 'OFFER_ACCEPTED';
                      const isOfferExtended = app.status?.toUpperCase() === 'OFFER_EXTENDED';

                      return (
                        <div 
                          key={app.id} 
                          className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-card hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group text-xs"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="h-8 w-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-xs font-bold text-orange-700">
                                {app.student?.name ? app.student.name.slice(0, 2).toUpperCase() : 'ST'}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 group-hover:text-orange-600 transition-colors">{app.student?.name || 'Student'}</p>
                                <p className="text-[11px] text-stone-400">{app.student?.branch || 'Engineering'} • {app.drive?.role || 'Role'}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getCgpaColor(app.student?.cgpa || 7.5)}`}>
                              {app.student?.cgpa ? app.student.cgpa.toFixed(1) : '7.5'}
                            </span>
                          </div>
                          
                          {/* Skills */}
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {(app.student?.skills || ['React', 'TypeScript']).slice(0, 2).map((skill: string) => (
                              <span key={skill} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-md font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="mt-3 pt-2 border-t border-stone-100 flex justify-between items-center">
                            <span className="text-[10px] text-orange-600 font-bold">
                              ₹{app.drive?.ctc || 10} LPA
                            </span>
                            
                            {!isOfferExtended && !isOfferAccepted && (
                              <div className="flex items-center space-x-1">
                                <button 
                                  disabled={processingId === app.id}
                                  className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(app.id, 'REJECTED');
                                  }}
                                  title="Reject candidate"
                                >
                                  Reject
                                </button>
                                <button 
                                  disabled={processingId === app.id}
                                  className="px-2.5 py-1 text-[11px] bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(app.id, getNextStage(app.status));
                                  }}
                                  title="Advance candidate"
                                >
                                  {processingId === app.id ? <Loader2 size={10} className="animate-spin" /> : <ChevronRight size={12} />}
                                  Next
                                </button>
                              </div>
                            )}

                            {isOfferExtended && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Award size={10} /> Offer Sent (Awaiting)
                              </span>
                            )}

                            {isOfferAccepted && (
                              <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={10} /> Accepted by Student ✓
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {stageApplicants.length === 0 && (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-xl">
                        <p className="text-[11px] text-stone-400">No candidates in {stage.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Detail Drawer (z-[9999]) */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-2xs animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-scale-in text-xs">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/70">
              <h3 className="font-bold text-stone-900 text-sm">Candidate Dossier</h3>
              <button 
                onClick={() => setSelectedApplication(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-base">
                  {selectedApplication.student?.name ? selectedApplication.student.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">{selectedApplication.student?.name || 'Candidate'}</h2>
                  <p className="text-xs text-stone-500">{selectedApplication.student?.rollNo || 'Roll No'} • {selectedApplication.student?.branch || 'Branch'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <p className="text-[10px] text-stone-500 font-bold uppercase">CGPA</p>
                  <p className="font-bold text-sm text-stone-900 mt-0.5">{selectedApplication.student?.cgpa || 8.0} / 10</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <p className="text-[10px] text-stone-500 font-bold uppercase">Drive Role</p>
                  <p className="font-bold text-sm text-orange-600 mt-0.5">{selectedApplication.drive?.role || 'Software Engineer'}</p>
                </div>
              </div>

              <div className="bg-orange-50/60 border border-orange-200 p-3.5 rounded-xl space-y-1">
                <p className="font-bold text-stone-900 text-xs">Current Pipeline Stage</p>
                <p className="text-xs font-semibold text-orange-700 uppercase">
                  ● {selectedApplication.status?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            
            <div className="p-5 border-t border-stone-200 bg-stone-50 flex gap-3">
              <button 
                disabled={processingId === selectedApplication.id}
                onClick={() => handleUpdateStatus(selectedApplication.id, 'REJECTED')}
                className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                disabled={
                  processingId === selectedApplication.id || 
                  selectedApplication.status === 'OFFER_EXTENDED' || 
                  selectedApplication.status === 'OFFER_ACCEPTED'
                }
                onClick={() => handleUpdateStatus(selectedApplication.id, getNextStage(selectedApplication.status))}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {processingId === selectedApplication.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                {selectedApplication.status === 'OFFER_EXTENDED' || selectedApplication.status === 'OFFER_ACCEPTED' ? 'Offer Extended' : 'Advance to Next Stage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Modal Dialog for Errors / Info (Requirement 5, z-[9999]) */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">{modalDialog.title}</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
