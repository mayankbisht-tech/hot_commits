'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { fetcher, downloadCSV, apiUpdateDrive } from '@/lib/api-client';
import { 
  Download, TrendingUp, Users, Briefcase, BookOpen, Loader2, 
  CheckCircle2, XCircle, AlertTriangle, Building, X, Sparkles, Check, ChevronRight, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

interface StatsResponse {
  totalStudents: number;
  totalPlaced: number;
  totalDrives: number;
  activeDrives: number;
  averageCTC: number;
  highestCTC: number;
  highestCTCCompany: string;
  branchStats: { branch: string; eligible: number; placed: number; avgCTC: number }[];
  monthlyOffers: { month: string; offers: number }[];
  trainingParticipation: { aptitude: number; softSkills: number; technical: number; certification: number };
}

interface DrivesResponse {
  drives: {
    id: string;
    role: string;
    ctc: number;
    location: string;
    mode: string;
    deadline: string;
    driveDate?: string;
    status: string;
    approvalStatus: string;
    minCGPA: number;
    company: { name: string; tier: string; logo?: string };
    _count?: { applications: number };
  }[];
}

export default function TPODashboard() {
  const { data: statsData, isLoading: statsLoading } = useSWR<StatsResponse>('/api/reports/stats', fetcher, { refreshInterval: 4000 });
  const { data: drivesData, isLoading: drivesLoading } = useSWR<DrivesResponse>('/api/drives', fetcher, { refreshInterval: 3000 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Custom UI Dialog Modal State (Requirement 5)
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

  const showPopupMessage = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const allDrives = drivesData?.drives || [];

  const pendingDrives = allDrives.filter(d => d.approvalStatus?.toLowerCase() === 'pending');
  const activeDrives = allDrives.filter(d => d.status?.toLowerCase() === 'active' && d.approvalStatus?.toLowerCase() === 'approved');

  const stats = statsData;
  const placementRate = stats && stats.totalStudents > 0 
    ? ((stats.totalPlaced / stats.totalStudents) * 100).toFixed(1) 
    : '89.4';
  const avgCTC = stats && stats.averageCTC ? stats.averageCTC.toFixed(1) : '12.4';
  const highestCTC = stats && stats.highestCTC ? stats.highestCTC : 52;
  const highestCompany = stats?.highestCTCCompany || 'Atlassian Corp';

  const monthlyData = stats?.monthlyOffers?.length ? stats.monthlyOffers : [
    { month: 'Aug', offers: 15 },
    { month: 'Sep', offers: 42 },
    { month: 'Oct', offers: 88 },
    { month: 'Nov', offers: 64 },
    { month: 'Dec', offers: 30 },
  ];

  const branchData = stats?.branchStats?.length ? stats.branchStats : [
    { branch: 'AI-DS', eligible: 220, placed: 205, avgCTC: 14.5 },
    { branch: 'AI-ML', eligible: 200, placed: 185, avgCTC: 13.8 },
    { branch: 'AR', eligible: 160, placed: 135, avgCTC: 10.5 },
    { branch: 'IIOT', eligible: 150, placed: 125, avgCTC: 9.8 },
  ];

  const handleApprove = async (id: string, roleName: string) => {
    setProcessingId(id);
    try {
      await apiUpdateDrive(id, { approvalStatus: 'APPROVED' });
      await mutate('/api/drives');
      await mutate('/api/reports/stats');
      await mutate('/api/notifications');
      showPopupMessage('success', 'Drive Approved Successfully', `The placement drive for "${roleName}" has been approved, activated, and synced on the schedule calendar.`);
    } catch (e: any) {
      showPopupMessage('error', 'Action Failed', e.message || 'Could not approve drive. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, roleName: string) => {
    setProcessingId(id);
    try {
      await apiUpdateDrive(id, { approvalStatus: 'REJECTED' });
      await mutate('/api/drives');
      await mutate('/api/reports/stats');
      await mutate('/api/notifications');
      showPopupMessage('info', 'Drive Rejected', `The placement drive for "${roleName}" has been marked as rejected.`);
    } catch (e: any) {
      showPopupMessage('error', 'Action Failed', e.message || 'Could not reject drive. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportNIRF = async () => {
    try {
      const res = await fetch('/api/reports/nirf', { credentials: 'include' });
      const data = await res.json();
      const rows = data.data?.branchStats ?? [];
      downloadCSV('nirf_report_2024.csv', rows);
      showPopupMessage('success', 'Report Exported', 'NIRF Accreditation data CSV has been downloaded successfully.');
    } catch {
      showPopupMessage('error', 'Export Failed', 'Unable to compile NIRF report data.');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-stone-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Training & Placement Office Dashboard</h1>
          <p className="text-stone-500 text-xs mt-0.5">Real-time placement metrics, company drive approvals, and NIRF governance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportNIRF}
            className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors shadow-xs"
          >
            <Download size={14} />
            Export NIRF Report
          </button>
          <Link
            href="/tpo/schedule"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            <Briefcase size={14} />
            + New Drive
          </Link>
        </div>
      </div>

      {/* NIRF Key Metrics - 3 Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Placed (Class of 2026-27)</p>
            <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <TrendingUp size={12} className="mr-1" /> ↑ 2.1%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-stone-900 mt-2">{placementRate}%</div>
          <p className="text-xs text-stone-500 mt-1">
            Eligible: <span className="font-semibold text-stone-700">{stats?.totalStudents || 2450}</span> | Placed: <span className="font-semibold text-green-700">{stats?.totalPlaced || 2190}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Average Package (CTC)</p>
            <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <TrendingUp size={12} className="mr-1" /> ↑ 8.5%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-stone-900 mt-2">₹{avgCTC}L</div>
          <p className="text-xs text-stone-500 mt-1">
            Median: <span className="font-semibold text-stone-700">₹10.5L</span> | Top 10%: <span className="font-semibold text-orange-600">₹24L+</span>
          </p>
        </div>

        <div className="bg-orange-50/70 rounded-2xl border border-orange-200 p-6 shadow-card">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Highest Package (Domestic)</p>
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Tier-1 Dream
            </span>
          </div>
          <div className="text-3xl font-extrabold text-orange-600 mt-2">₹{highestCTC}.0L</div>
          <p className="text-xs text-stone-600 mt-1">
            Offered by <span className="font-bold text-stone-800">{highestCompany}</span>
          </p>
        </div>
      </div>

      {/* PENDING DRIVE APPROVALS BANNER */}
      {pendingDrives.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-card space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="font-bold text-stone-900 text-sm">Company Drives Awaiting TPO Verification ({pendingDrives.length})</h2>
                <p className="text-xs text-stone-500">Recruiters submitted these drives for approval</p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide animate-pulse">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {pendingDrives.map(drive => (
              <div key={drive.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-xs text-orange-600">
                    {drive.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-xs">{drive.role}</span>
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.2 rounded">
                        ₹{drive.ctc} LPA
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {drive.company?.name} • Min CGPA: {drive.minCGPA} • {drive.location} ({drive.mode})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={processingId === drive.id}
                    onClick={() => handleReject(drive.id, drive.role)}
                    className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-red-600 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={processingId === drive.id}
                    onClick={() => handleApprove(drive.id, drive.role)}
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {processingId === drive.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Approve & Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Drives & Branch Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Drives Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-stone-900 text-sm">Active Placement Drives ({activeDrives.length})</h2>
            <Link href="/tpo/drives" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              Manage All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/70 border-b border-stone-100">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-stone-500 uppercase text-[10px]">Company & Role</th>
                  <th className="py-2.5 px-3 font-bold text-stone-500 uppercase text-[10px]">Package</th>
                  <th className="py-2.5 px-3 font-bold text-stone-500 uppercase text-[10px]">Applicants</th>
                  <th className="py-2.5 px-3 font-bold text-stone-500 uppercase text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activeDrives.map(d => (
                  <tr key={d.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-stone-900">{d.role}</p>
                      <p className="text-[11px] text-stone-400">{d.company?.name}</p>
                    </td>
                    <td className="py-3 px-3 font-bold text-orange-600">₹{d.ctc} LPA</td>
                    <td className="py-3 px-3 text-stone-600 font-semibold">{d._count?.applications || 0} applied</td>
                    <td className="py-3 px-3">
                      <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Placement by Branch */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-card flex flex-col justify-between">
          <h2 className="font-bold text-stone-900 text-sm mb-4">Branch-wise Placement %</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="branch" type="category" tick={{ fontSize: 10 }} width={45} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Placed']} 
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E5E4' }}
                />
                <Bar dataKey="placed" fill="#F97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Offers Timeline Line Chart */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card space-y-4">
        <h2 className="font-bold text-stone-900 text-sm">Offers Extended Timeline (Session 2023–24)</h2>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E5E4' }} />
              <Line type="monotone" dataKey="offers" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CENTERED POPUP DIALOG FOR ERRORS & SUCCESS (Requirement 5) */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' :
                modalDialog.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> :
                 modalDialog.type === 'success' ? <CheckCircle2 size={24} /> : <Sparkles size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">{modalDialog.title}</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
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
