'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { 
  Building2, Clock, CheckCircle2, XCircle, AlertCircle, 
  Award, ShieldCheck, ArrowRight, Loader2, FileText, ChevronDown, ChevronUp,
  Sparkles, BookOpen, Target, AlertTriangle
} from 'lucide-react';
import { fetcher } from '@/lib/api-client';

interface ApplicationItem {
  id: string;
  status: string;
  appliedOn: string;
  placementProbability?: number;
  missingSkills?: string[];
  missingSkillsDetailed?: { skill: string; programId: string | null }[];
  mlEligible?: boolean;
  drive: {
    id: string;
    role: string;
    ctc: number;
    company?: {
      name: string;
      tier?: string;
      logo?: string;
    };
  };
  stageHistory?: {
    id?: string;
    stage: string;
    date: string;
    note?: string;
  }[];
}

export default function StudentApplicationsPage() {
  const { data, isLoading } = useSWR<{ applications: ApplicationItem[] }>(
    '/api/applications', 
    fetcher, 
    { refreshInterval: 2000 }
  );

  const [activeTab, setActiveTab] = useState('All');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Collapsible flowchart map & skills dropdown map
  const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  // Close missing skills dropdown when tapping anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-skills-dropdown="true"]')) {
        setExpandedSkills({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFlow = (appId: string) => {
    setExpandedFlows(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const toggleSkills = (appId: string) => {
    setExpandedSkills(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  // Centered Modal Dialog State
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const myApps = data?.applications || [];

  const filteredApps = myApps.filter(app => {
    const s = app.status?.toUpperCase();
    if (activeTab === 'Active') return ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(s);
    if (activeTab === 'Offers') return ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(s);
    if (activeTab === 'Rejected') return s === 'REJECTED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'INTERVIEW_SCHEDULED': return 'bg-[#F1E9D8] text-[#C8A243] border-[#E3D8C4]';
      case 'OFFER_EXTENDED': return 'bg-[#F1E9D8] text-[#4A7C59] border-[#E3D8C4]';
      case 'OFFER_ACCEPTED': return 'bg-[#F1E9D8] text-[#4A7C59] border-[#E3D8C4]';
      case 'REJECTED': return 'bg-[#F1E9D8] text-[#C85555] border-[#E3D8C4]';
      case 'SHORTLISTED': return 'bg-[#F1E9D8] text-[#8B1A1A] border-[#E3D8C4]';
      default: return 'bg-[#F8F5EC] text-[#5E544A] border-[#E3D8C4]';
    }
  };

  const cleanStageText = (rawStage: string) => {
    if (!rawStage) return 'Applied';
    const cleaned = rawStage.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    return cleaned.replace(/_/g, ' ');
  };

  // Real-time Accept / Decline Offer
  const handleOfferAction = async (appId: string, newStatus: 'OFFER_ACCEPTED' | 'WITHDRAWN') => {
    setProcessingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          note: newStatus === 'OFFER_ACCEPTED' ? 'Offer officially accepted by student.' : 'Offer declined by student.'
        }),
        credentials: 'include'
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to process offer action');

      await mutate('/api/applications');
      await mutate('/api/students/me');
      await mutate('/api/reports/stats');
      await mutate('/api/notifications');

      if (newStatus === 'OFFER_ACCEPTED') {
        showPopup('success', 'Offer Accepted!', 'Congratulations! You have accepted the offer. Your placement status is now PLACED and locked to prevent duplicate offers under the One-Offer Policy.');
      } else {
        showPopup('success', 'Offer Declined', 'You have declined this placement offer.');
      }
    } catch (err: any) {
      showPopup('error', 'Action Failed', err.message || 'Could not process offer status change.');
    } finally {
      setProcessingId(null);
    }
  };

  const tabs = [
    { name: 'All', count: myApps.length },
    { name: 'Active', count: myApps.filter(a => ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status?.toUpperCase())).length },
    { name: 'Offers', count: myApps.filter(a => ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(a.status?.toUpperCase())).length },
    { name: 'Rejected', count: myApps.filter(a => a.status?.toUpperCase() === 'REJECTED').length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in select-none bg-[#F8F5EC] text-[#1C1A1A]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C1A1A]">My Applications</h1>
        <p className="text-[#5E544A] text-xs mt-0.5">Track your recruitment milestones, interview rounds, and placement predictions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E3D8C4] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.name
                ? 'bg-[#8B1A1A] text-white shadow-xs'
                : 'text-[#5E544A] hover:bg-[#F1E9D8] hover:text-[#1C1A1A]'
            }`}
          >
            <span>{tab.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === tab.name ? 'bg-white/20 text-white' : 'bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading application data...
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isOfferExtended = app.status?.toUpperCase() === 'OFFER_EXTENDED';
            const isOfferAccepted = app.status?.toUpperCase() === 'OFFER_ACCEPTED';
            const isRejected = app.status?.toUpperCase() === 'REJECTED';
            const isFlowExpanded = expandedFlows[app.id] ?? false;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card space-y-4 transition-all hover:shadow-md"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-extrabold text-sm">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#1C1A1A] text-sm">{app.drive?.role}</h3>

                        {/* ML Placement Prediction Score Pill */}
                        {typeof app.placementProbability === 'number' && (
                          <span 
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 shadow-2xs ${
                              app.placementProbability >= 70
                                ? 'bg-[#EBF7EE] text-[#2E7D32] border-[#C8E6C9]'
                                : app.placementProbability >= 40
                                ? 'bg-[#FFF8E1] text-[#B78103] border-[#FFE082]'
                                : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                            }`}
                            title="ML Predicted Placement Probability"
                          >
                            <Sparkles size={12} className="animate-pulse" />
                            <span>{app.placementProbability.toFixed(1)}% Placement Probability</span>
                          </span>
                        )}

                        {/* Missing Skills Dropdown Button */}
                        {app.missingSkills && (
                          <div className="relative inline-block" data-skills-dropdown="true">
                            <button
                              onClick={() => toggleSkills(app.id)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                (app.missingSkills.length || 0) > 0
                                  ? 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2] hover:bg-[#FFE0B2]'
                                  : 'bg-[#EBF7EE] text-[#2E7D32] border-[#C8E6C9]'
                              }`}
                            >
                              <BookOpen size={12} />
                              <span>Missing Skills ({app.missingSkills.length})</span>
                              {expandedSkills[app.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Dropdown Popover */}
                            {expandedSkills[app.id] && (
                              <div className="absolute left-0 mt-1 z-30 w-72 bg-white rounded-xl shadow-xl border border-[#E3D8C4] p-3 space-y-2.5 animate-scale-in select-text">
                                <div className="flex items-center justify-between border-b border-[#E3D8C4] pb-1.5">
                                  <span className="font-bold text-xs text-[#1C1A1A] flex items-center gap-1">
                                    <Target size={13} className="text-[#8B1A1A]" /> Skill Gaps to Improve
                                  </span>
                                  <span className="text-[10px] text-[#8B7B6F] font-semibold">ML Engine</span>
                                </div>

                                {app.missingSkills.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-[#5E544A]">
                                      Acquiring these missing skills will update your profile and boost your placement prediction score:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(app.missingSkillsDetailed || app.missingSkills?.map(s => ({ skill: s, programId: null })) || []).map((item, sIdx) => {
                                        const href = `/student/training?skill=${encodeURIComponent(item.skill)}${item.programId ? `&programId=${item.programId}#program-${item.programId}` : ''}`;
                                        return (
                                          <Link
                                            key={sIdx}
                                            href={href}
                                            className="px-2.5 py-1 bg-[#F1E9D8] hover:bg-[#8B1A1A] text-[#8B1A1A] hover:text-white border border-[#E3D8C4] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 group shadow-2xs"
                                            title={item.programId ? `Go to exact training program for ${item.skill}` : `Search training for ${item.skill}`}
                                          >
                                            <span>{item.skill}</span>
                                            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                          </Link>
                                        );
                                      })}
                                    </div>
                                    <div className="pt-1">
                                      {(() => {
                                        const firstItem = app.missingSkillsDetailed?.[0] || { skill: app.missingSkills?.[0] || '', programId: null };
                                        const btnHref = `/student/training?skill=${encodeURIComponent(firstItem.skill)}${firstItem.programId ? `&programId=${firstItem.programId}#program-${firstItem.programId}` : ''}`;
                                        return (
                                          <Link
                                            href={btnHref}
                                            className="w-full text-center block px-3 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                                          >
                                            Enroll in {firstItem.skill || 'Skill'} Training →
                                          </Link>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2 text-xs text-[#2E7D32] font-semibold flex items-center justify-center gap-1">
                                    <CheckCircle2 size={14} /> Great job! No missing required skills.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#5E544A] font-semibold">{app.drive?.company?.name || 'Company'} • ₹{app.drive?.ctc} LPA</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                      {cleanStageText(app.status)}
                    </span>
                    
                    {/* Collapsible Flowchart Trigger Button */}
                    <button
                      onClick={() => toggleFlow(app.id)}
                      className="px-2.5 py-1 text-xs border border-[#E3D8C4] rounded-xl hover:bg-[#F1E9D8] text-[#5E544A] hover:text-[#1C1A1A] font-bold flex items-center gap-1 transition-colors"
                      title="Toggle flowchart view"
                    >
                      <span>Progress</span>
                      {isFlowExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Flowchart */}
                {isFlowExpanded && (
                  <div className="p-4 bg-[#F8F5EC] rounded-2xl border border-[#E3D8C4] space-y-3 animate-fade-in">
                    <p className="text-[11px] font-bold text-[#8B7B6F] uppercase tracking-wider">Recruitment Progress Flow</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {['Applied', 'Shortlisted', 'Interview Scheduled', 'Offer Extended'].map((stageName, idx, arr) => {
                        const isCurrent = cleanStageText(app.status).toLowerCase() === stageName.toLowerCase();
                        const isPassed = app.stageHistory?.some(h => cleanStageText(h.stage).toLowerCase() === stageName.toLowerCase());

                        return (
                          <React.Fragment key={stageName}>
                            <div className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                              isCurrent
                                ? 'bg-[#8B1A1A] text-white shadow-xs'
                                : isPassed
                                ? 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]'
                                : 'bg-white text-[#8B7B6F] border border-[#E3D8C4]'
                            }`}>
                              {stageName}
                            </div>
                            {idx < arr.length - 1 && (
                              <ArrowRight size={13} className="text-[#8B7B6F]" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions Row */}
                {isOfferExtended && (
                  <div className="pt-2 border-t border-[#E3D8C4] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#4A7C59] font-bold">
                      <Award size={16} />
                      <span>Official Placement Offer Extended! Please review and take action.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={processingId === app.id}
                        onClick={() => handleOfferAction(app.id, 'WITHDRAWN')}
                        className="px-4 py-2 border border-[#C85555] text-[#C85555] hover:bg-[#F1E9D8] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Decline Offer
                      </button>
                      <button
                        disabled={processingId === app.id}
                        onClick={() => handleOfferAction(app.id, 'OFFER_ACCEPTED')}
                        className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {processingId === app.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Accept Offer
                      </button>
                    </div>
                  </div>
                )}

                {isOfferAccepted && (
                  <div className="p-3 bg-[#F1E9D8] border border-[#E3D8C4] rounded-xl flex items-center gap-2 text-xs text-[#4A7C59] font-bold">
                    <ShieldCheck size={16} />
                    <span>Offer Accepted · Officially Placed with {app.drive?.company?.name} (₹{app.drive?.ctc} LPA)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-[#8B7B6F] bg-white rounded-2xl border border-[#E3D8C4]">
          No applications found under "{activeTab}".
        </div>
      )}

      {/* Pop-up Alert Dialog */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 text-center animate-scale-in text-xs">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]' : 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]'
              }`}>
                {modalDialog.type === 'error' ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1C1A1A] text-sm">{modalDialog.title}</h3>
              <p className="text-[#5E544A] mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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
