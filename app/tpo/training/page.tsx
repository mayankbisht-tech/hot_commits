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
  const [date, setDate] = useState('2024-11-10');
  const [time, setTime] = useState('10:00 AM');
  const [venue, setVenue] = useState('Seminar Hall A');
  const [mode, setMode] = useState('OFFLINE');
  const [capacity, setCapacity] = useState('200');
  const [facilitator, setFacilitator] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Java, Spring, System Design');

  const programs: TrainingItem[] = Array.isArray(programsData) 
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

  const chartData = [
    { name: 'Technical', participants: 450, color: '#F97316' },
    { name: 'Aptitude', participants: 620, color: '#F59E0B' },
    { name: 'Soft Skills', participants: 380, color: '#10B981' },
    { name: 'Certification', participants: 210, color: '#8B5CF6' },
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
      // Reset
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
      Type: p.type,
      Date: p.date,
      Time: p.time,
      Venue: p.venue,
      Mode: p.mode,
      Capacity: p.capacity,
      Registered: p._count?.enrollments || p.enrollments?.length || 0,
      Facilitator: p.facilitator
    }));
    downloadCSV('training_programs_report.csv', rows);
  };

  const getIconForType = (t: string) => {
    const typeUpper = t?.toUpperCase();
    switch (typeUpper) {
      case 'TECHNICAL': return <BookOpen size={18} className="text-orange-600" />;
      case 'APTITUDE': return <Brain size={18} className="text-amber-600" />;
      case 'SOFT_SKILLS': return <MessageSquare size={18} className="text-green-600" />;
      case 'CERTIFICATION': return <Award size={18} className="text-purple-600" />;
      default: return <BookOpen size={18} className="text-orange-600" />;
    }
  };

  const getBadgeColor = (t: string) => {
    const typeUpper = t?.toUpperCase();
    switch (typeUpper) {
      case 'TECHNICAL': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'APTITUDE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SOFT_SKILLS': return 'bg-green-100 text-green-700 border-green-200';
      case 'CERTIFICATION': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF6] p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Training & Skill Analytics</h1>
          <p className="text-stone-500 text-xs mt-0.5">Manage skill development workshops, technical prep, and student participation</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-stone-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>Export Analytics</span>
          </button>
          <button 
            onClick={() => setIsPreviewModalOpen(true)}
            className="bg-white border border-orange-200 text-orange-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-orange-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Eye size={14} />
            <span>Preview Report</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Add Training Program</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-700 hover:text-green-900"><X size={14} /></button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Aptitude Training</p>
            <h3 className="text-3xl font-bold text-stone-900">85%</h3>
            <p className="text-green-600 text-xs font-semibold mt-1">↑ +5% participation</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Brain size={28} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Soft Skills & GD</p>
            <h3 className="text-3xl font-bold text-stone-900">92%</h3>
            <p className="text-green-600 text-xs font-semibold mt-1">↑ +2% completion</p>
          </div>
          <div className="p-3 bg-green-50 rounded-2xl text-green-600 border border-green-100">
            <MessageSquare size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Tech Certifications</p>
            <h3 className="text-3xl font-bold text-stone-900">64%</h3>
            <p className="text-orange-600 text-xs font-semibold mt-1">AWS / Java / ML</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
            <Award size={28} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Training Programs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" /> Active & Upcoming Programs ({programs.length})
            </h2>
            <span className="text-xs text-stone-500 font-medium">Auto-synced with student portal</span>
          </div>

          <div className="space-y-3">
            {programs.map((program) => {
              const enrolled = program._count?.enrollments || program.enrollments?.length || 0;
              const cap = program.capacity || 100;
              const pct = Math.min(100, Math.round((enrolled / cap) * 100));

              return (
                <div key={program.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                        {getIconForType(program.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">{program.title}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">Facilitator: <span className="text-stone-700 font-medium">{program.facilitator}</span></p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(program.type)} self-start sm:self-auto`}>
                      {program.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-stone-600 bg-stone-50/70 p-3 rounded-xl mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-stone-400" />
                      <span>{typeof program.date === 'string' && program.date.includes('T') ? new Date(program.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : program.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-stone-400" />
                      <span>{program.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <MapPin size={13} className="text-stone-400" />
                      <span className="truncate">{program.venue} ({program.mode})</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500 font-medium">Student Registration</span>
                      <span className="font-bold text-stone-800">{enrolled} / {cap} Seats ({pct}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Category Participation Chart */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card">
            <h2 className="text-sm font-bold text-stone-900 mb-3">Participation by Category</h2>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="participants" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-orange-50/70 p-5 rounded-2xl border border-orange-200 space-y-3">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-2">
              <Award size={16} className="text-orange-600" /> Skill Development Policy
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Students must complete at least 2 Technical and 1 Aptitude module to achieve Placement Readiness certification.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Schedule New Workshop
            </button>
          </div>
        </div>
      </div>

      {/* ADD TRAINING PROGRAM MODAL (Requirement 8) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 my-8 overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <BookOpen className="text-orange-500" size={18} />
                <h3 className="font-bold text-stone-900 text-sm">Add Training Program</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Program Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Java & Spring Boot Masterclass"
                  required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="TECHNICAL">Technical Workshop</option>
                    <option value="APTITUDE">Quantitative Aptitude</option>
                    <option value="SOFT_SKILLS">Soft Skills & HR</option>
                    <option value="CERTIFICATION">Certification Prep</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Delivery Mode</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="OFFLINE">Offline (On-Campus)</option>
                    <option value="ONLINE">Online (Virtual)</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Venue / Platform</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Seminar Hall B / Zoom"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Facilitator / Speaker</label>
                  <input
                    type="text"
                    value={facilitator}
                    onChange={e => setFacilitator(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar (Ex-Google)"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Skills & Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Java, React, System Design"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Publish Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW REPORT MODAL (Requirement 8) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 my-8 overflow-hidden animate-scale-in">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-orange-400" size={18} />
                <span className="font-bold text-xs">Training & Skill Development Audit Preview</span>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-stone-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="p-8 space-y-6 text-stone-900">
              <div className="border-b border-stone-200 pb-3 text-center">
                <h2 className="text-base font-bold uppercase">GGSIPU Training & Placement Cell</h2>
                <p className="text-xs text-stone-500">Skill Development & Employability Enhancement Report (2023–24)</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <p className="text-[10px] text-stone-500 uppercase font-bold">Programs Conducted</p>
                  <p className="text-xl font-bold text-stone-900">{programs.length}</p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <p className="text-[10px] text-stone-500 uppercase font-bold">Total Registrations</p>
                  <p className="text-xl font-bold text-green-700">1,660</p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <p className="text-[10px] text-stone-500 uppercase font-bold">Avg Attendance</p>
                  <p className="text-xl font-bold text-orange-600">88.2%</p>
                </div>
              </div>

              <table className="w-full border border-stone-200 text-xs">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="p-2 text-left border-b">Module Title</th>
                    <th className="p-2 text-center border-b">Domain</th>
                    <th className="p-2 text-center border-b">Capacity</th>
                    <th className="p-2 text-center border-b">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {programs.map((p, i) => (
                    <tr key={i} className="even:bg-stone-50/50">
                      <td className="p-2 font-medium">{p.title}</td>
                      <td className="p-2 text-center">{p.type}</td>
                      <td className="p-2 text-center">{p.capacity || 100}</td>
                      <td className="p-2 text-center font-bold text-green-700">{p._count?.enrollments || p.enrollments?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Close Preview
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download Audit CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
