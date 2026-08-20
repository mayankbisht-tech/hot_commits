'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Building2, Clock, CheckCircle2, XCircle, AlertCircle, 
  Award, ShieldCheck, ArrowRight, Loader2, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { fetcher } from '@/lib/api-client';

interface ApplicationItem {
  id: string;
  status: string;
  appliedOn: string;
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
  
  // Collapsible flowchart map (Issue 2)
  const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});

  const toggleFlow = (appId: string) => {
    setExpandedFlows(prev => ({
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
      case 'INTERVIEW_SCHEDULED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OFFER_EXTENDED': return 'bg-green-100 text-green-800 border-green-200';
      case 'OFFER_ACCEPTED': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SHORTLISTED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const cleanStageText = (rawStage: string) => {
    if (!rawStage) return 'Applied';
    // Strip everything in parentheses/brackets (Issue 2)
    const cleaned = rawStage.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    return cleaned.replace(/_/g, ' ');
  };

  // Real-time Accept / Decline Offer
  const handleOfferAction = async (appId: string, newStatus: 'OFFER_ACCEPTED' | 'WITHDRAWN') => {
    setProcessingId(appId);
    try {
      if (data?.applications) {
        mutate('/api/applications', {
          applications: data.applications.map(a => 
            a.id === appId ? { ...a, status: newStatus } : a
          )
        }, false);
      }

      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update offer status');
      }

      await mutate('/api/applications');
      await mutate('/api/drives/eligible');
      await mutate('/api/reports/stats');
      await mutate('/api/notifications');
      
      if (newStatus === 'OFFER_ACCEPTED') {
        showPopup('success', '🎉 Offer Accepted Successfully!', 'Congratulations! You have accepted the placement offer. Your profile has been updated to PLACED.');
      } else {
        showPopup('success', 'Offer Declined', 'You have declined this placement offer. Your decision has been notified to the recruiting company.');
      }
    } catch (err: any) {
      mutate('/api/applications');
      showPopup('error', 'Action Failed', err.message || 'Error updating offer status');
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
    <div className="p-8 animate-fade-in text-stone-800 space-y-6 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900">My Applications & Offer Tracker</h1>
          <p className="text-stone-500 text-xs mt-0.5">Real-time status updates, interview schedules, and offer letters</p>
        </div>
        <div className="flex gap-6 bg-stone-50 border border-stone-200 px-5 py-2.5 rounded-2xl">
          {[
            { label: 'Total Applied', value: myApps.length, color: 'text-stone-900' },
            { label: 'In Progress', value: tabs[1].count, color: 'text-orange-600' },
            { label: 'Offers Secured', value: tabs[2].count, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.name
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.name} ({tab.count})
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading your applications...
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="space-y-4">
          {filteredApps.map(app => {
            const isOfferExtended = app.status?.toUpperCase() === 'OFFER_EXTENDED';
            const isOfferAccepted = app.status?.toUpperCase() === 'OFFER_ACCEPTED';
            const isRejected = app.status?.toUpperCase() === 'REJECTED';
            const isFlowOpen = !!expandedFlows[app.id];

            const stages = app.stageHistory && app.stageHistory.length > 0
              ? app.stageHistory
              : [{ stage: 'Applied', date: app.appliedOn }];

            return (
              <div
                key={app.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card hover:shadow-md transition-all text-xs"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Left Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {app.drive?.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-stone-900 text-sm">{app.drive?.role}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                            ● {app.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-semibold mt-0.5">{app.drive?.company?.name}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Applied on {new Date(app.appliedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* COLLAPSIBLE FLOWCHART TOGGLE (Issue 2) */}
                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                      <button
                        onClick={() => toggleFlow(app.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50/70 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-all border border-orange-200"
                      >
                        <span>Recruitment Progress Flow ({stages.length} Stages)</span>
                        {isFlowOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {/* Visible only when clicking arrow button */}
                      {isFlowOpen && (
                        <div className="flex items-center flex-wrap gap-1.5 pt-2 animate-fade-in">
                          {stages.map((st, idx) => {
                            const stageName = st.stage?.toUpperCase();
                            const isStageRejected = stageName === 'REJECTED' || isRejected;
                            const isLastStage = idx === stages.length - 1;
                            const cleanText = cleanStageText(st.stage);

                            return (
                              <React.Fragment key={idx}>
                                <div
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    isStageRejected && isLastStage
                                      ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs'
                                      : isLastStage
                                        ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-2xs'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {isStageRejected && isLastStage ? (
                                    <XCircle size={13} className="text-red-600 shrink-0" />
                                  ) : (
                                    <CheckCircle2 size={13} className={isLastStage ? 'text-orange-600 shrink-0' : 'text-emerald-600 shrink-0'} />
                                  )}
                                  {/* Clean bold text without brackets (Issue 2) */}
                                  <span className="font-extrabold">{cleanText}</span>
                                </div>

                                {idx < stages.length - 1 && (
                                  <ArrowRight size={13} className="text-stone-400 shrink-0 mx-0.5" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Compensation & Actions */}
                  <div className="flex flex-col justify-between items-start md:items-end gap-3 min-w-48 pt-2 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Package Offered</p>
                      <p className="text-xl font-extrabold text-orange-600">₹{app.drive?.ctc} LPA</p>
                    </div>

                    {isOfferExtended && (
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          disabled={processingId === app.id}
                          onClick={() => handleOfferAction(app.id, 'WITHDRAWN')}
                          className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl font-bold transition-colors disabled:opacity-50 text-xs"
                        >
                          Decline
                        </button>
                        <button
                          disabled={processingId === app.id}
                          onClick={() => handleOfferAction(app.id, 'OFFER_ACCEPTED')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 text-xs"
                        >
                          {processingId === app.id ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                          Accept Offer
                        </button>
                      </div>
                    )}

                    {isOfferAccepted && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-green-600" />
                        Offer Accepted & Locked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200 space-y-2">
          <FileText size={24} className="mx-auto text-stone-300" />
          <p>No applications found in this category.</p>
        </div>
      )}

      {/* CENTERED POPUP DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
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
