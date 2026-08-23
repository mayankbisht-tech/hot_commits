'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { fetcher, downloadCSV, apiUpdateDrive } from '@/lib/api-client';
import { 
  Download, TrendingUp, Users, Briefcase, BookOpen, Loader2, 
  CheckCircle2, XCircle, AlertTriangle, Building, X, Sparkles, Check, ChevronRight, ChevronDown, AlertCircle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

interface StatsResponse {
  totalStudents: number;
  totalPlaced: number;
  totalDrives: number;
  totalApplications?: number;
  averageCTC: number;
  highestCTC: number;
  highestCTCCompany: string;
  branchStats: { branch: string; eligible: number; placed: number; placedPercentage: number; avgCTC: number }[];
  monthlyOffers: { month: string; offers: number }[];
  trainingParticipation: { aptitude: number; softSkills: number; technical: number; certification: number };
}

interface DriveItem {
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
}

interface DrivesResponse {
  drives: DriveItem[];
}

export default function TPODashboard() {
  const { data: statsData, isLoading: statsLoading } = useSWR<StatsResponse>('/api/reports/stats', fetcher, { refreshInterval: 2500 });
  const { data: drivesData, isLoading: drivesLoading } = useSWR<DrivesResponse>('/api/drives', fetcher, { refreshInterval: 2500 });
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [exportingNirf, setExportingNirf] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  // Centered Popup State
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

  const toggleCompanyExpand = (companyName: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  const allDrives = drivesData?.drives || [];

  const pendingDrives = allDrives.filter(d => d.approvalStatus?.toLowerCase() === 'pending');
  const activeDrives = allDrives.filter(d => {
    return d.status?.toLowerCase() === 'active' && d.approvalStatus?.toLowerCase() === 'approved';
  });

  // Group active drives by recruiting company
  const companyGroups = activeDrives.reduce((acc: Record<string, DriveItem[]>, drive) => {
    const compName = drive.company?.name || 'Independent Recruiter';
    if (!acc[compName]) acc[compName] = [];
    acc[compName].push(drive);
    return acc;
  }, {});

  const stats = statsData;
  const placementRate = stats && stats.totalStudents > 0 
    ? Math.min(100, Number(((stats.totalPlaced / stats.totalStudents) * 100).toFixed(1)))
    : 0;
  const avgCTC = stats && stats.averageCTC ? stats.averageCTC.toFixed(1) : '0';
  const highestCTC = stats && stats.highestCTC ? stats.highestCTC : 0;
  const highestCompany = stats?.highestCTCCompany || 'None';

  // Exact database monthly offers timeline
  const monthlyData = stats?.monthlyOffers || [
    { month: 'Aug', offers: 0 },
    { month: 'Sep', offers: 0 },
    { month: 'Oct', offers: 0 },
    { month: 'Nov', offers: 0 },
    { month: 'Dec', offers: 0 },
    { month: 'Jan', offers: 0 },
  ];

  // Exact branch statistics capped at 100%
  const branchData = (stats?.branchStats || [
    { branch: 'AI-DS', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: 0 },
    { branch: 'AI-ML', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: 0 },
    { branch: 'AR', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: 0 },
    { branch: 'IIOT', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: 0 },
  ]).map(b => ({
    ...b,
    placedPercentage: Math.min(100, Math.max(0, Number(b.placedPercentage) || 0))
  }));

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
    setExportingNirf(true);
    try {
      let rows: any[] = [];
      try {
        const res = await fetch('/api/reports/nirf', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.branchStats && json.data.branchStats.length > 0) {
            rows = json.data.branchStats;
          }
        }
      } catch {}

      if (!rows || rows.length === 0) {
        rows = branchData.map(b => ({
          Academic_Year: 'Session 2026-27',
          Branch: b.branch,
          Eligible_Students: b.eligible,
          Placed_Students: b.placed,
          Placement_Rate: `${b.placedPercentage}%`,
          Average_CTC: `₹${b.avgCTC} LPA`,
        }));
      }

      downloadCSV('NIRF_Placement_Report_2026_27.csv', rows);
      showPopupMessage('success', 'Report Exported Successfully', 'Official NIRF placement accreditation data CSV has been downloaded.');
    } catch (err: any) {
      showPopupMessage('error', 'Export Failed', err.message || 'Unable to generate NIRF CSV report.');
    } finally {
      setExportingNirf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in select-none text-[#1C1A1A] bg-[#F8F5EC]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1A1A]">Training & Placement Office Dashboard</h1>
          <p className="text-[#5E544A] text-xs mt-0.5">Placement metrics, company drive approvals, and NIRF governance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={exportingNirf}
            onClick={handleExportNIRF}
            className="flex items-center gap-2 bg-white border border-[#E3D8C4] text-[#1C1A1A] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#F1E9D8] transition-colors shadow-xs disabled:opacity-50"
          >
            {exportingNirf ? <Loader2 size={14} className="animate-spin text-[#8B1A1A]" /> : <Download size={14} className="text-[#8B1A1A]" />}
            Export NIRF Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[#8B7B6F] font-bold uppercase text-[10px] tracking-wider">Total Placed (Class of 2026-27)</span>
            <span className="bg-[#F1E9D8] text-[#4A7C59] font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-[#E3D8C4] flex items-center gap-1">
              <TrendingUp size={11} /> {placementRate}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#1C1A1A]">{placementRate}%</div>
          <p className="text-[#5E544A] text-xs font-semibold">
            Eligible: <strong>{stats?.totalStudents || 0}</strong> | Placed: <strong className="text-[#4A7C59]">{stats?.totalPlaced || 0}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[#8B7B6F] font-bold uppercase text-[10px] tracking-wider">Average Package (CTC)</span>
            <span className="bg-[#F1E9D8] text-[#4A7C59] font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-[#E3D8C4]">
              Verified
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#1C1A1A]">₹{avgCTC}L</div>
          <p className="text-[#5E544A] text-xs font-semibold">
            Active Candidate Applications: <strong>{stats?.totalApplications || 0}</strong>
          </p>
        </div>

        <div className="bg-[#F1E9D8] border border-[#E3D8C4] rounded-2xl p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[#5E544A] font-bold uppercase text-[10px] tracking-wider">Highest Package (Domestic)</span>
            <span className="bg-white text-[#8B1A1A] font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-[#E3D8C4]">
              Tier-1
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#8B1A1A]">₹{highestCTC}L</div>
          <p className="text-[#5E544A] text-xs font-semibold truncate">
            Offered by <strong className="text-[#1C1A1A]">{highestCompany}</strong>
          </p>
        </div>
      </div>

      {/* Pending Approvals Banner */}
      {pendingDrives.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#8B1A1A] p-6 shadow-md space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-[#E3D8C4] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F1E9D8] flex items-center justify-center text-[#8B1A1A]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#1C1A1A] text-sm">Company Placement Drives Awaiting TPO Approval ({pendingDrives.length})</h3>
                <p className="text-xs text-[#5E544A]">Review recruiter drive parameters, criteria, and packages before publishing</p>
              </div>
            </div>
            <span className="bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] text-xs font-bold px-2.5 py-1 rounded-full">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDrives.map(drive => (
              <div key={drive.id} className="p-4 border border-[#E3D8C4] rounded-xl bg-[#F8F5EC] flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C1A1A] text-sm">{drive.role}</span>
                      <span className="text-[#8B1A1A] font-extrabold text-xs">
                        ₹{drive.ctc} LPA
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E544A] mt-0.5">
                      {drive.company?.name} • Min CGPA: {drive.minCGPA} • {drive.location} ({drive.mode})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={processingId === drive.id}
                    onClick={() => handleReject(drive.id, drive.role)}
                    className="px-3 py-1.5 border border-[#E3D8C4] text-[#5E544A] hover:bg-[#F1E9D8] hover:text-[#C85555] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={processingId === drive.id}
                    onClick={() => handleApprove(drive.id, drive.role)}
                    className="px-4 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
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

      {/* Main Grid: Grouped Active Drives by Company & Exact Branch Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Drives Grouped by Company */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-[#1C1A1A] text-sm">Active Placement Drives ({activeDrives.length})</h2>
              <p className="text-[11px] text-[#5E544A]">Grouped by recruiting organization with expandable postings</p>
            </div>
            <Link href="/tpo/drives" className="text-xs font-bold text-[#8B1A1A] hover:text-[#A63030]">
              Manage All Drives →
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(companyGroups).length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8B7B6F] border border-dashed border-[#E3D8C4] rounded-xl">
                No active placement drives currently published.
              </div>
            ) : (
              Object.entries(companyGroups).map(([companyName, drivesList]) => {
                const isExpanded = expandedCompanies[companyName] ?? true;
                const totalApplicants = drivesList.reduce((sum, d) => sum + (d._count?.applications || 0), 0);
                const maxCtc = Math.max(...drivesList.map(d => d.ctc));
                const minCtc = Math.min(...drivesList.map(d => d.ctc));
                const ctcLabel = maxCtc === minCtc ? `₹${maxCtc} LPA` : `₹${minCtc} - ₹${maxCtc} LPA`;

                return (
                  <div key={companyName} className="border border-[#E3D8C4] rounded-2xl overflow-hidden shadow-2xs transition-all bg-white">
                    {/* Company Header Row with on-click Expand Button */}
                    <div 
                      onClick={() => toggleCompanyExpand(companyName)}
                      className="p-4 bg-[#F8F5EC] hover:bg-[#F1E9D8] cursor-pointer flex items-center justify-between gap-3 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A] font-extrabold text-xs shrink-0">
                          {companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#1C1A1A] text-xs truncate">{companyName}</h3>
                            <span className="bg-white text-[#8B1A1A] border border-[#E3D8C4] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {drivesList.length} {drivesList.length === 1 ? 'Posting' : 'Postings'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5E544A] font-medium">
                            {totalApplicants} total candidates applied • Package: <strong className="text-[#8B1A1A]">{ctcLabel}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompanyExpand(companyName);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E3D8C4] hover:border-[#8B1A1A] text-[#1C1A1A] hover:text-[#8B1A1A] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                      >
                        <span>{isExpanded ? 'Hide Postings' : `View Postings (${drivesList.length})`}</span>
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#8B1A1A]' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Drive Postings Flow */}
                    {isExpanded && (
                      <div className="p-3 bg-white space-y-2 divide-y divide-[#E3D8C4] animate-fade-in text-xs">
                        {drivesList.map((drive) => (
                          <div key={drive.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-[#F8F5EC] p-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-[#8B1A1A] shrink-0" />
                              <div className="min-w-0">
                                <p className="font-bold text-[#1C1A1A] text-xs truncate">{drive.role}</p>
                                <p className="text-[10px] text-[#5E544A] font-medium">
                                  {drive.location} ({drive.mode}) • Min CGPA: {drive.minCGPA}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-[#8B1A1A] text-xs">
                                ₹{drive.ctc} LPA
                              </span>
                              <span className="text-[11px] text-[#5E544A] font-medium bg-[#F1E9D8] px-2 py-0.5 rounded border border-[#E3D8C4]">
                                {drive._count?.applications || 0} applied
                              </span>
                              <Link
                                href="/tpo/applicants"
                                className="px-2 py-1 text-[10px] font-bold text-[#8B1A1A] hover:bg-[#F1E9D8] rounded-lg flex items-center gap-0.5"
                              >
                                <span>Applicants</span>
                                <ArrowRight size={10} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Exact Placement by Branch */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-[#1C1A1A] text-sm">Branch-wise Placement %</h2>
            <p className="text-[11px] text-[#5E544A] mt-0.5">Verified active placement percentage per engineering department</p>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#5E544A' }} stroke="#E3D8C4" />
                <YAxis dataKey="branch" type="category" tick={{ fontSize: 11, fontWeight: 600, fill: '#1C1A1A' }} width={55} stroke="#E3D8C4" />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Placement Rate']} 
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }}
                />
                <Bar dataKey="placedPercentage" fill="#8B1A1A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E3D8C4] text-[11px]">
            {branchData.map(b => (
              <div key={b.branch} className="flex items-center justify-between bg-[#F8F5EC] p-2 rounded-xl border border-[#E3D8C4]">
                <span className="font-bold text-[#1C1A1A]">{b.branch}</span>
                <span className="font-extrabold text-[#8B1A1A]">{b.placedPercentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offers Extended Timeline */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-bold text-[#1C1A1A] text-sm">Offers Extended Timeline (Session 2026–27)</h2>
          <p className="text-[11px] text-[#5E544A] mt-0.5">Database verified offer letters extended to graduating students</p>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1E9D8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
              <Tooltip 
                formatter={(val: any) => [val, 'Offers Extended']}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }} 
              />
              <Line type="monotone" dataKey="offers" stroke="#8B1A1A" strokeWidth={3} dot={{ r: 4, fill: '#8B1A1A' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Centered Popup Dialog */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]' :
                modalDialog.type === 'success' ? 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]' : 'bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4]'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> :
                 modalDialog.type === 'success' ? <CheckCircle2 size={24} /> : <Sparkles size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1C1A1A] text-base">{modalDialog.title}</h3>
              <p className="text-xs text-[#5E544A] mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
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
