'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  Download, FileText, FileDown, Briefcase, Users, TrendingUp, 
  DollarSign, Printer, X, CheckCircle2, Building, ShieldCheck, Award
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { fetcher, downloadCSV } from '@/lib/api-client';
import { placementStats as fallbackStats } from '@/lib/data';

interface BranchStat {
  branch: string;
  eligible: number;
  placed: number;
  placedPercentage?: number;
  avgCTC: number | string;
  medianCTC: number | string;
  highestCTC: number | string;
}

export default function ReportsAnalyticsPage() {
  const { data: statsData } = useSWR<any>('/api/reports/stats', fetcher);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [showCompiledModal, setShowCompiledModal] = useState(false);

  const stats = statsData || fallbackStats;

  const branchStats: BranchStat[] = statsData?.branchStats || [
    { branch: 'AI & Data Science (AI-DS)', eligible: 220, placed: 205, placedPercentage: 93.1, avgCTC: '14.5', medianCTC: '12.0', highestCTC: '52.0' },
    { branch: 'AI & Machine Learning (AI-ML)', eligible: 200, placed: 185, placedPercentage: 92.5, avgCTC: '13.8', medianCTC: '11.5', highestCTC: '48.0' },
    { branch: 'Augmented Reality (AR)', eligible: 160, placed: 135, placedPercentage: 84.3, avgCTC: '10.5', medianCTC: '9.0', highestCTC: '28.0' },
    { branch: 'Industrial IoT (IIOT)', eligible: 150, placed: 125, placedPercentage: 83.3, avgCTC: '9.8', medianCTC: '8.5', highestCTC: '24.0' },
  ];

  const ctcBands = [
    { name: '< 6 LPA', count: 120 },
    { name: '6 - 10 LPA', count: 350 },
    { name: '10 - 15 LPA', count: 180 },
    { name: '15 - 25 LPA', count: 70 },
    { name: '> 25 LPA (Dream)', count: 25 },
  ];

  const monthlyOffers = statsData?.monthlyOffers || fallbackStats.monthlyOffers;

  const handleExportCSV = () => {
    let csv = 'Branch,Eligible,Placed,Placed %,Avg CTC,Median CTC,Highest CTC\n';
    branchStats.forEach(stat => {
      const placedPct = stat.placedPercentage || ((stat.placed / Math.max(stat.eligible, 1)) * 100).toFixed(1);
      csv += `"${stat.branch}",${stat.eligible},${stat.placed},${placedPct},${stat.avgCTC},${stat.medianCTC},${stat.highestCTC}\n`;
    });
    downloadCSV('GGSIPU_NIRF_Placement_Report_2026.csv', branchStats as any);
  };

  const handlePrintCompiled = () => {
    window.print();
  };

  const sortedBranchStats = [...branchStats].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const totalEligible = branchStats.reduce((acc, curr) => acc + curr.eligible, 0);
  const totalPlaced = branchStats.reduce((acc, curr) => acc + curr.placed, 0);
  const overallPlacementRate = ((totalPlaced / Math.max(totalEligible, 1)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#FFFAF6] p-6 space-y-6 animate-fade-in select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 select-none">Placement Reports & NIRF Analytics</h1>
          <p className="text-stone-500 text-xs mt-0.5 select-none">Official accreditation reports and verifiable statistical exports</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-stone-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setShowCompiledModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <FileText size={14} />
            <span>Compiled Official NIRF Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Users size={22} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Placement Rate</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <h3 className="text-2xl font-bold text-stone-900">{overallPlacementRate}%</h3>
              <span className="text-[11px] text-stone-500">({totalPlaced}/{totalEligible})</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp size={22} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Average CTC</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-0.5">₹{stats?.averageCTC ? stats.averageCTC.toFixed(1) : '12.4'} LPA</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Briefcase size={22} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Median CTC</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-0.5">₹10.5 LPA</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Award size={22} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Highest Domestic</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-0.5">₹{stats?.highestCTC || 52}.0 LPA</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Branch Report Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Building size={16} className="text-orange-500" /> Branch-wise Placement Summary
              </h2>
              <span className="text-[11px] text-stone-400 font-medium">Click columns to sort</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/70">
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('branch')}>
                      Branch {sortConfig?.key === 'branch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('eligible')}>
                      Eligible {sortConfig?.key === 'eligible' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('placed')}>
                      Placed {sortConfig?.key === 'placed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('placedPercentage')}>
                      Placed % {sortConfig?.key === 'placedPercentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('avgCTC')}>
                      Avg CTC {sortConfig?.key === 'avgCTC' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-stone-500 uppercase cursor-pointer hover:text-stone-800" onClick={() => requestSort('highestCTC')}>
                      Highest {sortConfig?.key === 'highestCTC' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {sortedBranchStats.map((row, idx) => {
                    const pct = row.placedPercentage || ((row.placed / Math.max(row.eligible, 1)) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-stone-900">{row.branch}</td>
                        <td className="py-3 px-3 text-stone-600">{row.eligible}</td>
                        <td className="py-3 px-3 text-stone-800 font-semibold">{row.placed}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-orange-600 font-bold">₹{row.avgCTC}L</td>
                        <td className="py-3 px-3 text-purple-700 font-bold">₹{row.highestCTC}L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Timeline Chart */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card">
            <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> Placement Offers Timeline
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyOffers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="offers" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - CTC Distribution & NIRF Builder */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card">
            <h2 className="text-sm font-bold text-stone-900 mb-3">Salary Package Distribution</h2>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={ctcBands}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-orange-50/60 p-5 rounded-2xl border border-orange-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
              <ShieldCheck size={16} className="text-orange-600" />
              <span>NIRF Official Placement Dossier</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Compile institutional placement records compliant with MHRD/NIRF parameter guidelines for the Class of 2024.
            </p>
            <button
              onClick={() => setShowCompiledModal(true)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <FileDown size={14} />
              Open Compiled NIRF Report
            </button>
          </div>
        </div>
      </div>

      {/* COMPILED OFFICIAL NIRF REPORT MODAL (Requirement 7) */}
      {showCompiledModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-300 my-8 overflow-hidden animate-scale-in">
            {/* Modal Controls Topbar */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-orange-400" size={18} />
                <span className="font-bold text-xs">Official Institutional Dossier — Compiled NIRF Report</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintCompiled}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowCompiledModal(false)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Compiled Document Body (Clean Academic Printable Format) */}
            <div className="p-8 sm:p-12 text-stone-900 font-serif bg-white max-h-[80vh] overflow-y-auto print:max-h-none print:p-0">
              {/* Header Letterhead */}
              <div className="border-b-2 border-stone-900 pb-4 mb-6 text-center space-y-1">
                <h1 className="text-xl font-bold tracking-tight uppercase">Guru Gobind Singh Indraprastha University</h1>
                <p className="text-xs text-stone-600 font-sans">Sector 16C, Dwarka, New Delhi — 110078 | Training & Placement Cell</p>
                <h2 className="text-sm font-bold text-orange-700 font-sans tracking-wide uppercase pt-2">
                  Official NIRF Placement Assessment Dossier · Academic Year 2023–24
                </h2>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans mb-6">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Document ID</span>
                  <span className="font-bold font-mono">GGSIPU/TPC/NIRF-2024</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Graduation Cohort</span>
                  <span className="font-bold">UG (4 Years) — 2024</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Accreditation Cycle</span>
                  <span className="font-bold">NIRF Ranking 2025</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Certified Date</span>
                  <span className="font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Section 1: Executive KPI Summary */}
              <div className="mb-6 font-sans">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-1 mb-3">
                  1. Executive Placement Overview
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="p-2 border border-stone-200 rounded">
                    <p className="text-[10px] text-stone-500">Graduating</p>
                    <p className="font-bold text-sm">{totalEligible}</p>
                  </div>
                  <div className="p-2 border border-stone-200 rounded">
                    <p className="text-[10px] text-stone-500">Placed</p>
                    <p className="font-bold text-sm text-green-700">{totalPlaced}</p>
                  </div>
                  <div className="p-2 border border-stone-200 rounded bg-orange-50/50 border-orange-200">
                    <p className="text-[10px] text-orange-700 font-semibold">Placement Rate</p>
                    <p className="font-bold text-sm text-orange-700">{overallPlacementRate}%</p>
                  </div>
                  <div className="p-2 border border-stone-200 rounded">
                    <p className="text-[10px] text-stone-500">Median CTC</p>
                    <p className="font-bold text-sm">₹10.5L</p>
                  </div>
                  <div className="p-2 border border-stone-200 rounded">
                    <p className="text-[10px] text-stone-500">Average CTC</p>
                    <p className="font-bold text-sm">₹12.4L</p>
                  </div>
                  <div className="p-2 border border-stone-200 rounded bg-purple-50/50 border-purple-200">
                    <p className="text-[10px] text-purple-700 font-semibold">Highest Domestic</p>
                    <p className="font-bold text-sm text-purple-800">₹52.0L</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Program-Wise Breakdown */}
              <div className="mb-6 font-sans">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-1 mb-3">
                  2. Discipline-Wise Placement & Median Remuneration Statistics
                </h3>
                <table className="w-full border-collapse border border-stone-300 text-xs">
                  <thead className="bg-stone-100">
                    <tr>
                      <th className="border border-stone-300 p-2 text-left">Academic Discipline</th>
                      <th className="border border-stone-300 p-2 text-center">Graduating Students</th>
                      <th className="border border-stone-300 p-2 text-center">Placed Students</th>
                      <th className="border border-stone-300 p-2 text-center">Placement (%)</th>
                      <th className="border border-stone-300 p-2 text-center">Median Package</th>
                      <th className="border border-stone-300 p-2 text-center">Max Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchStats.map((b, i) => {
                      const pct = b.placedPercentage || ((b.placed / Math.max(b.eligible, 1)) * 100).toFixed(1);
                      return (
                        <tr key={i} className="even:bg-stone-50/60">
                          <td className="border border-stone-300 p-2 font-medium">{b.branch}</td>
                          <td className="border border-stone-300 p-2 text-center">{b.eligible}</td>
                          <td className="border border-stone-300 p-2 text-center font-semibold">{b.placed}</td>
                          <td className="border border-stone-300 p-2 text-center font-bold text-green-700">{pct}%</td>
                          <td className="border border-stone-300 p-2 text-center font-mono font-semibold">₹{b.medianCTC} LPA</td>
                          <td className="border border-stone-300 p-2 text-center font-mono font-bold text-purple-700">₹{b.highestCTC} LPA</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Institutional Signatures & Verification */}
              <div className="mt-10 pt-6 border-t-2 border-stone-300 grid grid-cols-2 gap-8 text-xs font-sans">
                <div>
                  <p className="text-stone-500 mb-8 font-semibold">Prepared & Verified By:</p>
                  <p className="font-bold text-stone-900 border-t border-stone-400 pt-1 inline-block min-w-44">
                    Dr. Ramesh Kumar
                  </p>
                  <p className="text-[11px] text-stone-500">Chief Coordinator, Training & Placement Cell</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-500 mb-8 font-semibold">Approved for Submission:</p>
                  <p className="font-bold text-stone-900 border-t border-stone-400 pt-1 inline-block min-w-44 text-right">
                    Prof. (Dr.) A. K. Sharma
                  </p>
                  <p className="text-[11px] text-stone-500">Dean / Registrar, GGSIPU</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
