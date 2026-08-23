'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  BookOpen, Calendar, MapPin, Users, CheckCircle, Clock, 
  Brain, MessageSquare, Award, Loader2, CheckCircle2, X, AlertCircle 
} from 'lucide-react';
import { fetcher } from '@/lib/api-client';

interface TrainingProgramItem {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  mode: string;
  capacity: number;
  facilitator: string;
  description?: string;
  tags?: string[];
  enrolledByMe?: boolean;
  enrollmentCount?: number;
  registeredCount?: number;
  _count?: { enrollments: number };
}

export default function TrainingProgramsPage() {
  const { data: programsData, isLoading } = useSWR<any>(
    '/api/training', 
    fetcher, 
    { refreshInterval: 2000 }
  );

  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'programs' | 'schedule'>('programs');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const programs: TrainingProgramItem[] = Array.isArray(programsData) 
    ? programsData 
    : programsData?.programs || [];

  const filterTabs = ['All', 'Technical', 'Aptitude', 'Soft Skills', 'Certification'];

  const filteredPrograms = programs
    .filter(p => {
      if (activeTab === 'All') return true;
      const typeUpper = p.type?.toUpperCase();
      if (activeTab === 'Technical') return typeUpper === 'TECHNICAL';
      if (activeTab === 'Aptitude') return typeUpper === 'APTITUDE';
      if (activeTab === 'Soft Skills') return typeUpper === 'SOFT_SKILLS';
      if (activeTab === 'Certification') return typeUpper === 'CERTIFICATION';
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const enrolledPrograms = programs.filter(p => p.enrolledByMe).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
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

  const handleToggleEnroll = async (program: TrainingProgramItem) => {
    setEnrollingId(program.id);
    const isEnrolling = !program.enrolledByMe;

    if (programsData) {
      const updatedList = programs.map(p => {
        if (p.id === program.id) {
          const currentCount = p.enrollmentCount ?? p._count?.enrollments ?? p.registeredCount ?? 0;
          const newCount = isEnrolling ? currentCount + 1 : Math.max(0, currentCount - 1);
          return {
            ...p,
            enrolledByMe: isEnrolling,
            enrollmentCount: newCount,
            registeredCount: newCount,
            _count: { enrollments: newCount }
          };
        }
        return p;
      });
      mutate('/api/training', { programs: updatedList }, false);
    }

    try {
      const endpoint = `/api/training/${program.id}/enroll`;
      const method = isEnrolling ? 'POST' : 'DELETE';
      const res = await fetch(endpoint, { method, credentials: 'include' });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update enrollment');
      }

      await mutate('/api/training');
      await mutate('/api/reports/stats');
      showToast(isEnrolling ? `Successfully enrolled in ${program.title}!` : `Unenrolled from ${program.title}.`);
    } catch (err: any) {
      showPopup('error', 'Enrollment Notice', err.message || 'Could not update workshop enrollment. Please try again.');
      await mutate('/api/training');
    } finally {
      setEnrollingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'TECHNICAL': return <BookOpen size={16} />;
      case 'APTITUDE': return <Brain size={16} />;
      case 'SOFT_SKILLS': return <MessageSquare size={16} />;
      default: return <Award size={16} />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in select-none bg-[#F8F5EC] text-[#1C1A1A]">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-[999999] bg-[#1C1A1A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-scale-in border border-[#E3D8C4]">
          <CheckCircle2 size={16} className="text-[#4A7C59]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1A1A]">Training & Skill Development</h1>
          <p className="text-[#5E544A] text-xs mt-0.5">Participate in university placement bootcamps, mock interviews, and certification preps</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-[#F1E9D8] p-1 rounded-xl border border-[#E3D8C4] text-xs font-bold">
          <button
            onClick={() => setViewMode('programs')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'programs' ? 'bg-white text-[#8B1A1A] shadow-xs' : 'text-[#5E544A]'
            }`}
          >
            All Programs ({programs.length})
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'schedule' ? 'bg-white text-[#8B1A1A] shadow-xs' : 'text-[#5E544A]'
            }`}
          >
            My Schedule ({enrolledPrograms.length})
          </button>
        </div>
      </div>

      {viewMode === 'programs' ? (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-[#E3D8C4] pb-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8B1A1A] text-white shadow-xs'
                    : 'text-[#5E544A] hover:bg-[#F1E9D8] hover:text-[#1C1A1A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Programs Grid */}
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading training schedule...
            </div>
          ) : filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrograms.map((p) => {
                const regCount = p.enrollmentCount ?? p._count?.enrollments ?? p.registeredCount ?? 0;
                const capacity = p.capacity || 100;
                const capacityPct = Math.min(100, Math.round((regCount / capacity) * 100));
                const isFull = regCount >= capacity;
                const isProcessing = enrollingId === p.id;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card flex flex-col justify-between space-y-4 transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] shrink-0">
                            {getTypeIcon(p.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1C1A1A] text-sm">{p.title}</h3>
                            <p className="text-[11px] text-[#5E544A] font-semibold">{p.facilitator}</p>
                          </div>
                        </div>

                        <span className="bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          {p.type?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                        <div className="flex items-center gap-1.5 text-[#5E544A]">
                          <Calendar size={13} className="text-[#8B7B6F]" />
                          <span className="font-bold text-[#1C1A1A]">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {p.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#5E544A]">
                          <MapPin size={13} className="text-[#8B7B6F]" />
                          <span className="font-semibold text-[#1C1A1A]">{p.venue} ({p.mode})</span>
                        </div>
                      </div>

                      {/* Seats Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#5E544A] font-semibold">Registered Attendees</span>
                          <span className="font-extrabold text-[#1C1A1A]">{regCount} / {capacity} seats ({capacityPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[#F1E9D8] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              capacityPct >= 90 ? 'bg-[#C85555]' : 'bg-[#8B1A1A]'
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E3D8C4] flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || ['Workshop', 'Skill']).slice(0, 2).map((t, idx) => (
                          <span key={idx} className="bg-[#F1E9D8] text-[#5E544A] border border-[#E3D8C4] text-[10px] px-2 py-0.5 rounded-md font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>

                      <button
                        disabled={isProcessing || (!p.enrolledByMe && isFull)}
                        onClick={() => handleToggleEnroll(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                          p.enrolledByMe
                            ? 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] hover:bg-[#F8F5EC]'
                            : isFull
                            ? 'bg-[#F8F5EC] text-[#8B7B6F] border border-[#E3D8C4] cursor-not-allowed'
                            : 'bg-[#8B1A1A] hover:bg-[#A63030] text-white active:scale-95'
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : p.enrolledByMe ? (
                          <>
                            <CheckCircle size={13} />
                            <span>Enrolled (Click to Leave)</span>
                          </>
                        ) : isFull ? (
                          <span>Batch Full</span>
                        ) : (
                          <span>Register Workshop</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-[#8B7B6F] bg-white rounded-2xl border border-[#E3D8C4]">
              No training programs found under "{activeTab}".
            </div>
          )}
        </>
      ) : (
        /* My Schedule View */
        <div className="space-y-4">
          {enrolledPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledPrograms.map((prog) => (
                <div key={prog.id} className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] font-bold px-2 py-0.5 rounded-full">
                        Enrolled Workshop
                      </span>
                      <h3 className="font-bold text-[#1C1A1A] text-sm mt-1">{prog.title}</h3>
                      <p className="text-xs text-[#5E544A]">{prog.facilitator} • {prog.venue}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] text-xs flex items-center justify-between">
                    <span className="text-[#5E544A]">Date & Time</span>
                    <span className="font-bold text-[#1C1A1A]">{new Date(prog.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} @ {prog.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-[#8B7B6F] bg-white rounded-2xl border border-[#E3D8C4]">
              You haven't enrolled in any training programs yet.
            </div>
          )}
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
