'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  BookOpen, Calendar, MapPin, Users, CheckCircle, Clock, 
  Brain, MessageSquare, Award, Loader2, CheckCircle2, X 
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
    { refreshInterval: 3000 }
  );

  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'programs' | 'schedule'>('programs');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const rawPrograms: TrainingProgramItem[] = Array.isArray(programsData) 
    ? programsData 
    : programsData?.programs || [];

  // Filter out past events
  const programs = rawPrograms.filter(p => {
    const pDate = new Date(p.date).getTime();
    return pDate >= Date.now() - 24 * 60 * 60 * 1000;
  });

  const filterTabs = ['All', 'Technical', 'Aptitude', 'Soft Skills', 'Certification'];

  const filteredPrograms = programs.filter(p => {
    if (activeTab === 'All') return true;
    const typeUpper = p.type?.toUpperCase();
    if (activeTab === 'Technical') return typeUpper === 'TECHNICAL';
    if (activeTab === 'Aptitude') return typeUpper === 'APTITUDE';
    if (activeTab === 'Soft Skills') return typeUpper === 'SOFT_SKILLS';
    if (activeTab === 'Certification') return typeUpper === 'CERTIFICATION';
    return true;
  });

  const enrolledPrograms = programs.filter(p => p.enrolledByMe).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Permanent Workshop Enrollment Toggle
  const handleToggleEnroll = async (program: TrainingProgramItem) => {
    setEnrollingId(program.id);
    const isEnrolling = !program.enrolledByMe;

    // Optimistic UI state update
    if (programsData) {
      const updatedList = rawPrograms.map(p => {
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
      
      if (isEnrolling) {
        showToast(`Successfully enrolled in "${program.title}"!`);
      } else {
        showToast(`Un-enrolled from "${program.title}".`);
      }
    } catch (err: any) {
      await mutate('/api/training');
      alert(err.message || 'Error updating enrollment');
    } finally {
      setEnrollingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type?.toUpperCase();
    switch (t) {
      case 'TECHNICAL': return <BookOpen size={16} className="text-orange-600" />;
      case 'APTITUDE': return <Brain size={16} className="text-amber-600" />;
      case 'SOFT_SKILLS': return <MessageSquare size={16} className="text-green-600" />;
      case 'CERTIFICATION': return <Award size={16} className="text-purple-600" />;
      default: return <BookOpen size={16} className="text-orange-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-stone-800 select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-scale-in">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Skill Development & Training</h1>
          <p className="text-stone-500 text-xs mt-0.5">Prepare for technical, aptitude, and HR interview rounds with university prep modules</p>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('programs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'programs' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Browse Modules ({programs.length})
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'schedule' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            My Schedule ({enrolledPrograms.length})
          </button>
        </div>
      </div>

      {viewMode === 'programs' ? (
        <div className="space-y-5">
          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Loading training workshops...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPrograms.map(program => {
                const enrolled = program.enrollmentCount ?? program._count?.enrollments ?? program.registeredCount ?? 0;
                const isEnrolled = !!program.enrolledByMe;
                const capacity = program.capacity || 100;
                const pct = Math.min(100, Math.round((enrolled / capacity) * 100));

                return (
                  <div key={program.id} className="bg-white rounded-2xl shadow-card border border-stone-200 p-5 flex flex-col justify-between text-xs hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                            {getTypeIcon(program.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-900 text-sm">{program.title}</h3>
                            <p className="text-[11px] text-stone-500 font-medium">{program.facilitator}</p>
                          </div>
                        </div>
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {program.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 mb-3 text-[11px] text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-stone-400" />
                          <span>{typeof program.date === 'string' && program.date.includes('T') ? new Date(program.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : program.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-stone-400" />
                          <span>{program.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <MapPin size={12} className="text-stone-400" />
                          <span className="truncate">{program.venue} ({program.mode})</span>
                        </div>
                      </div>

                      {/* Capacity Bar (Requirement 1 & 4) */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-stone-500">Seats Reserved</span>
                          <span className="font-bold text-stone-800">{enrolled} / {capacity} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100">
                      {isEnrolled ? (
                        <button
                          disabled={enrollingId === program.id}
                          onClick={() => handleToggleEnroll(program)}
                          className="w-full py-2 bg-green-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-green-200 text-green-800 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition-colors group"
                          title="Click to un-enroll"
                        >
                          <CheckCircle2 size={14} className="text-green-600 group-hover:hidden" />
                          <X size={14} className="text-red-600 hidden group-hover:inline" />
                          <span className="group-hover:hidden">Enrolled in Program ✓</span>
                          <span className="hidden group-hover:inline">Click to Cancel Enrollment</span>
                        </button>
                      ) : (
                        <button
                          disabled={enrollingId === program.id || enrolled >= capacity}
                          onClick={() => handleToggleEnroll(program)}
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
                        >
                          {enrollingId === program.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Register for Workshop'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-bold text-stone-900 text-sm">Your Enrolled Prep Workshops ({enrolledPrograms.length})</h2>
          {enrolledPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledPrograms.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card text-xs flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-bold text-[10px] uppercase">{p.type}</span>
                      <h3 className="font-bold text-stone-900">{p.title}</h3>
                    </div>
                    <p className="text-stone-500 text-[11px]">{typeof p.date === 'string' && p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : p.date} • {p.time}</p>
                    <p className="text-stone-400 text-[10px]">{p.venue}</p>
                  </div>
                  <button
                    onClick={() => handleToggleEnroll(p)}
                    className="px-3 py-1.5 border border-stone-200 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-[11px] transition-colors"
                  >
                    Un-enroll
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              You haven't enrolled in any training workshops yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
