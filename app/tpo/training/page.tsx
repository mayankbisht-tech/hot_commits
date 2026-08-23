'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Download, TrendingUp, Calendar, BookOpen, Brain, MessageSquare, 
  Award, Plus, FileText, X, CheckCircle2, Loader2, Users, MapPin, Clock, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetcher, downloadCSV, apiCreateTraining } from '@/lib/api-client';
import { trainingPrograms as fallbackPrograms } from '@/lib/data';

interface TrainingItem {
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
  _count?: { enrollments: number };
  enrollments?: any[];
}

export default function TrainingAnalyticsPage() {
  const { data: programsData, isLoading } = useSWR<any>('/api/training', fetcher);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Add Training Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TECHNICAL');
  const [date, setDate] = useState('2026-09-15');
  const [time, setTime] = useState('10:00 AM');
  const [venue, setVenue] = useState('Seminar Hall A');
  const [mode, setMode] = useState('OFFLINE');
  const [capacity, setCapacity] = useState('200');
  const [facilitator, setFacilitator] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Java, Spring, System Design');

  const rawPrograms: TrainingItem[] = Array.isArray(programsData) 
    ? programsData 
    : programsData?.programs || fallbackPrograms.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type.toUpperCase(),
        date: p.date,
        time: p.time,
        venue: p.venue,
        mode: p.mode,
        capacity: p.capacity,
        facilitator: p.facilitator,
        tags: p.tags,
        _count: { enrollments: p.registeredCount }
      }));

  const programs = [...rawPrograms].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeA - timeB;
  });

  const chartData = [
    { name: 'Technical', participants: 450, color: '#8B1A1A' },
    { name: 'Aptitude', participants: 620, color: '#C8A243' },
    { name: 'Soft Skills', participants: 380, color: '#4A7C59' },
    { name: 'Certification', participants: 210, color: '#8B1A1A' },
  ];

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await apiCreateTraining({
        title: title.trim(),
        type,
        date: new Date(date).toISOString(),
        time,
        venue,
        mode,
        capacity: Number(capacity) || 100,
        facilitator: facilitator.trim() || 'TPO Faculty',
        description,
        tags,
      });

      setSuccessMsg('Training Program added and opened for student registration!');
      setIsAddModalOpen(false);
      mutate('/api/training');
      setTitle('');
      setFacilitator('');
      setDescription('');
    } catch (e: any) {
      alert(e.message || 'Failed to add training program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const rows = programs.map(p => ({
      Title: p.title,
      Category: p.type,
      Date: p.date.split('T')[0],
      Time: p.time,
      Venue: p.venue,
      Mode: p.mode,
      Capacity: p.capacity,
      Registered_Attendees: p._count?.enrollments || p.enrollments?.length || 0,
      Facilitator: p.facilitator,
    }));

    downloadCSV('GGSIPU_Training_Programs_Report.csv', rows);
  };

  const getTypeIcon = (t: string) => {
    switch (t?.toUpperCase()) {
      case 'TECHNICAL': return <BookOpen size={16} className="text-[#8B1A1A]" />;
      case 'APTITUDE': return <Brain size={16} className="text-[#C8A243]" />;
      case 'SOFT_SKILLS': return <MessageSquare size={16} className="text-[#4A7C59]" />;
      default: return <Award size={16} className="text-[#8B1A1A]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] p-6 space-y-6 animate-fade-in text-[#1C1A1A] select-none">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#1C1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-scale-in border border-[#E3D8C4]">
          <CheckCircle2 size={16} className="text-[#4A7C59]" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-2 text-[#8B7B6F] hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1A1A]">Training Programs & Employability Analytics</h1>
          <p className="text-[#5E544A] text-xs mt-0.5">Manage skill development workshops, track student participation, and compile training audits</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-[#E3D8C4] text-[#1C1A1A] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#F1E9D8] flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={14} className="text-[#8B1A1A]" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#8B1A1A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#A63030] flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Add Training Program</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><BookOpen size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Active Modules</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">{programs.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#C8A243] rounded-xl"><Brain size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Aptitude Trainees</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">620</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#4A7C59] rounded-xl"><MessageSquare size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Soft Skills Certified</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">380</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><Award size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Readiness Rate</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">91.4%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Training Programs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden">
            <div className="p-5 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F8F5EC]">
              <h2 className="text-sm font-bold text-[#1C1A1A] flex items-center gap-2">
                <Calendar size={16} className="text-[#8B1A1A]" />
                <span>Upcoming Scheduled Programs ({programs.length})</span>
              </h2>
              <span className="text-[11px] text-[#8B7B6F] font-semibold">Real-time Student Enrolments</span>
            </div>

            <div className="divide-y divide-[#E3D8C4]">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading training calendar...
                </div>
              ) : programs.length > 0 ? (
                programs.map((prog) => {
                  const regCount = prog._count?.enrollments ?? prog.enrollments?.length ?? 0;
                  const capacity = prog.capacity || 100;
                  const capacityPct = Math.min(100, Math.round((regCount / capacity) * 100));

                  return (
                    <div key={prog.id} className="p-5 hover:bg-[#F8F5EC] transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center shrink-0">
                            {getTypeIcon(prog.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1C1A1A] text-xs">{prog.title}</h3>
                            <p className="text-[11px] text-[#5E544A]">{prog.facilitator} • {prog.venue} ({prog.mode})</p>
                          </div>
                        </div>

                        <span className="bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase">
                          {prog.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                        <div className="flex items-center gap-2 text-[#5E544A]">
                          <Clock size={13} className="text-[#8B7B6F]" />
                          <span className="font-bold text-[#1C1A1A]">{new Date(prog.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} @ {prog.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#5E544A] font-semibold">Enrolled: {regCount} / {capacity}</span>
                          <span className="text-[11px] font-extrabold text-[#8B1A1A]">{capacityPct}% Full</span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-[#F1E9D8] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${capacityPct >= 90 ? 'bg-[#C85555]' : 'bg-[#8B1A1A]'}`} 
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-[#8B7B6F]">
                  No training programs scheduled yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Analytics Breakdown & Reporting Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card space-y-4">
            <h2 className="text-sm font-bold text-[#1C1A1A]">Participation by Domain</h2>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E9D8" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5E544A' }} stroke="#E3D8C4" />
                <YAxis tick={{ fontSize: 10, fill: '#5E544A' }} stroke="#E3D8C4" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }} />
                <Bar dataKey="participants" fill="#8B1A1A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#F1E9D8] p-5 rounded-2xl border border-[#E3D8C4] space-y-3">
            <h3 className="font-bold text-[#1C1A1A] text-xs flex items-center gap-2">
              <Award size={16} className="text-[#8B1A1A]" /> Skill Development Policy
            </h3>
            <p className="text-[11px] text-[#5E544A] leading-relaxed">
              Students must complete at least 2 Technical and 1 Aptitude module to achieve Placement Readiness certification.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Schedule New Workshop
            </button>
          </div>
        </div>
      </div>

      {/* ADD TRAINING PROGRAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] my-8 overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F8F5EC]">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[#8B1A1A]" size={18} />
                <h3 className="font-bold text-[#1C1A1A] text-sm">Add Training Program</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#8B7B6F] hover:text-[#1C1A1A] p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Program Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Java & Spring Boot Masterclass"
                  required
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A] focus:border-[#8B1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Category Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  >
                    <option value="TECHNICAL">Technical Workshop</option>
                    <option value="APTITUDE">Quantitative Aptitude</option>
                    <option value="SOFT_SKILLS">Soft Skills & HR</option>
                    <option value="CERTIFICATION">Certification Prep</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Delivery Mode</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  >
                    <option value="OFFLINE">Offline (On-Campus)</option>
                    <option value="ONLINE">Online (Virtual)</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Venue / Platform</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Seminar Hall B / Zoom"
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5E544A] mb-1">Facilitator / Speaker</label>
                  <input
                    type="text"
                    value={facilitator}
                    onChange={e => setFacilitator(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar (Ex-Google)"
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Skills & Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Java, React, System Design"
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] hover:bg-[#F8F5EC] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Publish Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
