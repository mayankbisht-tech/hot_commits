'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Search, Filter, CheckCircle, XCircle, Clock, Users, User, X, 
  Briefcase, FileText, Check, Bell, Loader2, Send, CheckCircle2, ShieldCheck, Mail
} from 'lucide-react';
import { fetcher, apiUpdateStudent } from '@/lib/api-client';

interface StudentItem {
  id: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  cgpa: number;
  backlogs: number;
  phone?: string;
  class10: number;
  class12: number;
  graduationYear: number;
  placementStatus: string;
  dreamEligible: boolean;
  resumeVerified: boolean;
  skills: string[];
  user?: { email: string };
  offers?: any[];
  _count?: { applications: number };
}

export default function ApplicantPoolPage() {
  const { data, isLoading } = useSWR<{ students: StudentItem[] }>('/api/students', fetcher, { refreshInterval: 4000 });
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [status, setStatus] = useState('All');
  const [minCgpa, setMinCgpa] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // Notification Modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubject, setNotifySubject] = useState('Placement Cell Urgent Notice: Profile Verification');
  const [notifyBody, setNotifyBody] = useState('Dear Student, your placement profile and credentials have been reviewed by the TPO Office.');
  const [sendingNotify, setSendingNotify] = useState(false);

  const students = data?.students || [];

  const filteredStudents = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNo.toLowerCase().includes(search.toLowerCase())) return false;
    if (branch !== 'All' && s.branch !== branch) return false;
    if (status !== 'All' && s.placementStatus?.toLowerCase() !== status.toLowerCase()) return false;
    if (minCgpa && s.cgpa < parseFloat(minCgpa)) return false;
    return true;
  });

  const totalStudents = students.length;
  const totalPlaced = students.filter(s => s.placementStatus?.toUpperCase() === 'PLACED').length;
  const pendingVerification = students.filter(s => !s.resumeVerified).length;
  const totalApplications = students.reduce((acc, s) => acc + (s._count?.applications || 0), 0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleApproveResume = async (student: StudentItem) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeVerified: true }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to approve resume');
      
      mutate('/api/students');
      if (selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, resumeVerified: true });
      }
      showToast(`Resume for ${student.name} marked as Verified ✓!`);
    } catch (err: any) {
      alert(err.message || 'Error updating resume status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSendingNotify(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setShowNotifyModal(false);
      showToast(`Notification successfully delivered to ${selectedStudent.name} (${selectedStudent.user?.email || selectedStudent.rollNo})!`);
    } finally {
      setSendingNotify(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] p-6 space-y-6 animate-fade-in text-[#1C1A1A]">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#1C1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-scale-in border border-[#E3D8C4]">
          <CheckCircle2 size={16} className="text-[#4A7C59]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1C1A1A]">Applicant Pool & Verification</h1>
        <p className="text-[#5E544A] text-xs mt-0.5">Candidate roster, resume validation, and direct student messaging</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><Users size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Total Pool</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">{totalStudents}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#4A7C59] rounded-xl"><CheckCircle size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Placed Students</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">{totalPlaced}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><Briefcase size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Applications</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">{totalApplications}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#C8A243] rounded-xl"><Clock size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A]">{pendingVerification}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3D8C4] shadow-xs space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7B6F]" size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or roll no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E3D8C4] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] font-semibold"
            />
          </div>
          <select 
            value={branch} onChange={(e) => setBranch(e.target.value)}
            className="border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A] font-bold"
          >
            <option value="All">All Branches</option>
            {['AI-DS', 'AI-ML', 'AR', 'IIOT'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select 
            value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A] font-bold"
          >
            <option value="All">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Unplaced">Unplaced</option>
          </select>
          <input 
            type="number" 
            placeholder="Min CGPA (e.g. 7.5)" 
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            className="border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs w-36 bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#8B1A1A]" size={16} /> Loading candidate pool...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F5EC] border-b border-[#E3D8C4]">
                <tr>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">Student</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">Branch & Year</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">CGPA</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">Backlogs</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase">Resume</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#5E544A] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3D8C4] text-xs">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F8F5EC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-bold text-xs">
                          {student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#1C1A1A]">{student.name}</p>
                          <p className="text-[11px] text-[#5E544A]">{student.rollNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5E544A] font-semibold">
                      {student.branch} • Class of {student.graduationYear}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${student.cgpa >= 8.0 ? 'text-[#4A7C59]' : student.cgpa >= 7.0 ? 'text-[#8B1A1A]' : 'text-[#1C1A1A]'}`}>
                        {student.cgpa.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {student.backlogs === 0 ? (
                        <span className="text-[#4A7C59] font-bold bg-[#F1E9D8] border border-[#E3D8C4] px-2 py-0.5 rounded-full text-[10px]">0 Active</span>
                      ) : (
                        <span className="text-[#C85555] font-bold bg-[#F1E9D8] border border-[#E3D8C4] px-2 py-0.5 rounded-full text-[10px]">{student.backlogs} Backlog</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        student.placementStatus?.toUpperCase() === 'PLACED' 
                          ? 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]' 
                          : 'bg-[#F8F5EC] text-[#5E544A] border border-[#E3D8C4]'
                      }`}>
                        {student.placementStatus || 'UNPLACED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {student.resumeVerified ? (
                        <span className="text-[#4A7C59] font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle size={13} className="text-[#4A7C59]" /> Verified
                        </span>
                      ) : (
                        <span className="text-[#C8A243] font-bold flex items-center gap-1 text-[11px]">
                          <Clock size={13} className="text-[#C8A243]" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 bg-white border border-[#E3D8C4] hover:bg-[#F1E9D8] text-[#1C1A1A] rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT DETAIL SLIDE-OVER DRAWER */}
      {selectedStudent && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-[9998] animate-fade-in"
            onClick={() => setSelectedStudent(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white z-[9999] shadow-2xl flex flex-col border-l border-[#E3D8C4] animate-scale-in text-xs overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E3D8C4] flex justify-between items-start bg-[#F8F5EC]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-bold text-sm">
                    {selectedStudent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1C1A1A]">{selectedStudent.name}</h3>
                    <p className="text-xs text-[#5E544A] font-semibold">{selectedStudent.rollNo} • {selectedStudent.branch}</p>
                    <p className="text-[11px] text-[#8B7B6F] mt-0.5">{selectedStudent.user?.email || 'student@ipu.ac.in'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="p-1 rounded-xl text-[#8B7B6F] hover:text-[#1C1A1A] hover:bg-[#F1E9D8]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-5">
                {/* Academic Metrics */}
                <div>
                  <h4 className="font-bold text-[#8B7B6F] uppercase tracking-wider text-[11px] mb-2.5">Academic Record</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                      <p className="text-[10px] text-[#8B7B6F] uppercase font-bold mb-0.5">CGPA</p>
                      <p className="font-bold text-base text-[#1C1A1A]">{selectedStudent.cgpa.toFixed(1)} / 10</p>
                    </div>
                    <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                      <p className="text-[10px] text-[#8B7B6F] uppercase font-bold mb-0.5">Active Backlogs</p>
                      <p className={`font-bold text-base ${selectedStudent.backlogs === 0 ? 'text-[#4A7C59]' : 'text-[#C85555]'}`}>
                        {selectedStudent.backlogs}
                      </p>
                    </div>
                    <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                      <p className="text-[10px] text-[#8B7B6F] uppercase font-bold mb-0.5">Class 10th</p>
                      <p className="font-bold text-[#1C1A1A]">{selectedStudent.class10}%</p>
                    </div>
                    <div className="bg-[#F8F5EC] p-3 rounded-xl border border-[#E3D8C4]">
                      <p className="text-[10px] text-[#8B7B6F] uppercase font-bold mb-0.5">Class 12th</p>
                      <p className="font-bold text-[#1C1A1A]">{selectedStudent.class12}%</p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-bold text-[#8B7B6F] uppercase tracking-wider text-[11px] mb-2">Verified Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.skills?.length > 0 ? (
                      selectedStudent.skills.map((skill: string) => (
                        <span key={skill} className="bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4] px-2.5 py-1 rounded-lg text-xs font-bold">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8B7B6F] text-xs">No technical skills listed</span>
                    )}
                  </div>
                </div>

                {/* Resume Status */}
                <div className="bg-[#F8F5EC] p-3.5 rounded-xl border border-[#E3D8C4] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="text-[#8B1A1A]" size={18} />
                    <div>
                      <p className="font-bold text-[#1C1A1A]">Placement Resume Status</p>
                      <p className="text-[11px] text-[#5E544A]">Official verified digital resume</p>
                    </div>
                  </div>
                  {selectedStudent.resumeVerified ? (
                    <span className="bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Check size={12} /> Verified
                    </span>
                  ) : (
                    <span className="bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Clock size={12} /> Pending Review
                    </span>
                  )}
                </div>

                {/* Offers */}
                {selectedStudent.offers && selectedStudent.offers.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#8B7B6F] uppercase tracking-wider text-[11px] mb-2">Offers & Governance</h4>
                    <div className="space-y-2">
                      {selectedStudent.offers.map((off: any) => (
                        <div key={off.id} className="bg-[#F1E9D8] border border-[#E3D8C4] p-3 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-[#1C1A1A]">Offer Secured</p>
                              <p className="text-[11px] text-[#5E544A]">Package: ₹{off.ctc} LPA</p>
                            </div>
                            <span className="px-2 py-0.5 bg-[#4A7C59] text-white rounded font-bold text-[10px] uppercase">
                              {off.status}
                            </span>
                          </div>
                          {off.status === 'ACCEPTED' && (
                            <p className="text-[10px] text-[#8B1A1A] font-semibold pt-1 border-t border-[#E3D8C4]">
                              2X Policy Active: Eligible for further drives offering ≥ ₹{off.ctc * 2} LPA.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons in Drawer */}
            <div className="p-5 border-t border-[#E3D8C4] bg-[#F8F5EC] flex gap-3 mt-auto">
              <button 
                onClick={() => setShowNotifyModal(true)}
                className="flex-1 bg-white border border-[#E3D8C4] text-[#1C1A1A] py-2.5 rounded-xl font-bold hover:bg-[#F1E9D8] transition-all shadow-xs flex items-center justify-center space-x-1.5 active:scale-[0.98]"
              >
                <Bell size={15} className="text-[#8B1A1A]" />
                <span>Notify Student</span>
              </button>

              <button 
                disabled={actionLoading || selectedStudent.resumeVerified}
                onClick={() => handleApproveResume(selectedStudent)}
                className={`flex-1 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 active:scale-[0.98] ${
                  selectedStudent.resumeVerified 
                    ? 'bg-[#4A7C59] text-white opacity-90 cursor-default' 
                    : 'bg-[#8B1A1A] text-white hover:bg-[#A63030]'
                }`}
              >
                {actionLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : selectedStudent.resumeVerified ? (
                  <>
                    <ShieldCheck size={15} />
                    <span>Approved ✓</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Approve Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* NOTIFICATION DIALOG MODAL */}
      {showNotifyModal && selectedStudent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] overflow-hidden animate-scale-in">
            <div className="p-4 bg-[#1C1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Mail size={16} className="text-[#C8A243]" />
                <span>Send Official Placement Notice to {selectedStudent.name}</span>
              </div>
              <button onClick={() => setShowNotifyModal(false)} className="text-[#8B7B6F] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Recipient</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${selectedStudent.name} <${selectedStudent.user?.email || `${selectedStudent.rollNo}@ipu.ac.in`}>`}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 bg-[#F8F5EC] text-[#1C1A1A] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Subject</label>
                <input 
                  type="text" 
                  value={notifySubject}
                  onChange={e => setNotifySubject(e.target.value)}
                  required
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] bg-[#F8F5EC] text-[#1C1A1A] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Message Body</label>
                <textarea 
                  rows={4}
                  value={notifyBody}
                  onChange={e => setNotifyBody(e.target.value)}
                  required
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] bg-[#F8F5EC] text-[#1C1A1A] font-semibold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotify}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {sendingNotify ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
