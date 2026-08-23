'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  Download, FileText, FileDown, Briefcase, Users, TrendingUp, 
  DollarSign, Printer, X, CheckCircle2, Building, ShieldCheck, Award
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { fetcher, downloadCSV } from '@/lib/api-client';

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

  const stats = statsData || {
    overallPercentage: 0,
    totalPlaced: 0,
    totalEligible: 0,
    avgPackage: 0,
    highestPackage: 0,
    activeDrivesCount: 0,
    branchStats: [],
    monthlyOffers: [],
    tierBreakdown: [],
  };

  // Dynamic current academic session calculations
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const academicYearStr = `${currentYear}–${nextYearShort}`;
  const nirfDocId = `GGSIPU/TPC/NIRF-${currentYear}`;
  const nirfAccreditationCycle = `NIRF Ranking ${currentYear + 1}`;

  const branchStats: BranchStat[] = (statsData?.branchStats || [
    { branch: 'AI-DS', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: '0', medianCTC: '0', highestCTC: '0' },
    { branch: 'AI-ML', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: '0', medianCTC: '0', highestCTC: '0' },
    { branch: 'AR', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: '0', medianCTC: '0', highestCTC: '0' },
    { branch: 'IIOT', eligible: 0, placed: 0, placedPercentage: 0, avgCTC: '0', medianCTC: '0', highestCTC: '0' },
  ]).map((b: any) => ({
    ...b,
    placedPercentage: Math.min(100, Math.max(0, Number(b.placedPercentage) || 0))
  }));

  const ctcBands = [
    { name: '< 6 LPA', count: 1 },
    { name: '6 - 10 LPA', count: 2 },
    { name: '10 - 15 LPA', count: 3 },
    { name: '15 - 25 LPA', count: 2 },
    { name: '> 25 LPA (Dream)', count: 2 },
  ];

  const monthlyOffers = statsData?.monthlyOffers || [];

  const handleExportCSV = () => {
    let csv = 'Branch,Eligible,Placed,Placed %,Avg CTC,Median CTC,Highest CTC\n';
    branchStats.forEach(stat => {
      const placedPct = stat.placedPercentage || ((stat.placed / Math.max(stat.eligible, 1)) * 100).toFixed(1);
      csv += `"${stat.branch}",${stat.eligible},${stat.placed},${placedPct},${stat.avgCTC},${stat.medianCTC},${stat.highestCTC}\n`;
    });
    downloadCSV(`GGSIPU_NIRF_Placement_Report_${currentYear}.csv`, branchStats as any);
  };

  const handlePrintCompiled = () => {
    const reportElement = document.getElementById('nirf-printable-report');
    if (!reportElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GGSIPU NIRF Placement Assessment Dossier - ${currentYear}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                color: #1C1A1A; 
                margin: 0; 
                padding: 16px; 
                background: #fff; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              h1, h2, h3, h4, p, table { margin: 0; }
              .border-b-2 { border-bottom: 2px solid #1C1A1A; }
              .border-b { border-bottom: 1px solid #E3D8C4; }
              .border { border: 1px solid #E3D8C4; }
              .bg-subtle { background-color: #F8F5EC !important; }
              .bg-highlight { background-color: #F1E9D8 !important; }
              .text-accent { color: #8B1A1A !important; }
              .text-success { color: #4A7C59 !important; }
              .text-muted { color: #5E544A !important; }
              .text-dim { color: #8B7B6F !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; }
              th, td { border: 1px solid #E3D8C4; padding: 7px 10px; font-size: 11px; }
              th { background-color: #F8F5EC !important; text-align: center; font-weight: bold; }
              td.text-left { text-align: left; }
              td.text-center { text-align: center; }
              .grid { display: grid; }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); gap: 12px; }
              .grid-cols-6 { grid-template-columns: repeat(6, 1fr); gap: 8px; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); gap: 24px; }
              .kpi-box { border: 1px solid #E3D8C4; padding: 8px; border-radius: 6px; text-align: center; background: #fff; }
              .meta-box { background-color: #F8F5EC !important; border: 1px solid #E3D8C4; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            ${reportElement.innerHTML}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
  const overallPlacementRate = totalEligible > 0 
    ? Math.min(100, Number(((totalPlaced / totalEligible) * 100).toFixed(1)))
    : 0;

  return (
    <div className="min-h-screen bg-[#F8F5EC] p-6 space-y-6 animate-fade-in select-none text-[#1C1A1A]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1A1A] select-none">Placement Reports & NIRF Analytics</h1>
          <p className="text-[#5E544A] text-xs mt-0.5 select-none font-medium">Official accreditation reports and verifiable statistical exports</p>
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
            onClick={() => setShowCompiledModal(true)}
            className="bg-[#8B1A1A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#A63030] flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <FileText size={14} />
            <span>Compiled Official NIRF Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><Users size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Placement Rate</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <h3 className="text-2xl font-bold text-[#1C1A1A]">{overallPlacementRate}%</h3>
              <span className="text-[11px] text-[#5E544A]">({totalPlaced}/{totalEligible})</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#8B1A1A] rounded-xl"><TrendingUp size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Average CTC</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A] mt-0.5">₹{stats?.averageCTC ? stats.averageCTC.toFixed(1) : '0'} LPA</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#4A7C59] rounded-xl"><Briefcase size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Median CTC</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A] mt-0.5">₹{stats?.medianCTC ? stats.medianCTC.toFixed(1) : '0'} LPA</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card flex items-center space-x-4">
          <div className="p-3 bg-[#F1E9D8] text-[#C8A243] rounded-xl"><Award size={22} /></div>
          <div>
            <p className="text-xs text-[#8B7B6F] font-bold uppercase tracking-wider">Highest Domestic</p>
            <h3 className="text-2xl font-bold text-[#1C1A1A] mt-0.5">₹{stats?.highestCTC || 0} LPA</h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table & CTC Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Branch-wise Table */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden">
            <div className="p-5 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F8F5EC]">
              <h2 className="text-sm font-bold text-[#1C1A1A]">Branch-wise Placement Statistics</h2>
              <span className="text-[11px] text-[#8B7B6F] font-semibold">Updated Session {academicYearStr}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F5EC] border-b border-[#E3D8C4] text-[#5E544A] uppercase text-[10px]">
                  <tr>
                    <th onClick={() => requestSort('branch')} className="py-3 px-4 font-bold cursor-pointer hover:text-[#1C1A1A]">
                      Branch {sortConfig?.key === 'branch' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => requestSort('eligible')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Eligible {sortConfig?.key === 'eligible' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => requestSort('placed')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Placed {sortConfig?.key === 'placed' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => requestSort('placedPercentage')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Placement % {sortConfig?.key === 'placedPercentage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => requestSort('avgCTC')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Avg CTC
                    </th>
                    <th onClick={() => requestSort('medianCTC')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Median CTC
                    </th>
                    <th onClick={() => requestSort('highestCTC')} className="py-3 px-4 font-bold text-center cursor-pointer hover:text-[#1C1A1A]">
                      Highest CTC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3D8C4]">
                  {sortedBranchStats.map((b) => (
                    <tr key={b.branch} className="hover:bg-[#F8F5EC] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#1C1A1A]">{b.branch}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#5E544A]">{b.eligible}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#1C1A1A]">{b.placed}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-[#4A7C59] bg-[#F1E9D8] border border-[#E3D8C4] px-2 py-0.5 rounded-full text-[10px]">
                          {b.placedPercentage ?? 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1C1A1A]">₹{b.avgCTC} LPA</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1C1A1A]">₹{b.medianCTC} LPA</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-[#8B1A1A]">₹{b.highestCTC} LPA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salary Bands Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card space-y-4">
            <h2 className="text-sm font-bold text-[#1C1A1A]">CTC Distribution Bands (Class of {currentYear})</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ctcBands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E9D8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
                <YAxis tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
                <RechartsTooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }} />
                <Bar dataKey="count" fill="#8B1A1A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Timeline & Export Card */}
        <div className="space-y-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-card space-y-4">
            <h2 className="text-sm font-bold text-[#1C1A1A]">Monthly Placement Timeline</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyOffers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E9D8" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5E544A' }} stroke="#E3D8C4" />
                <YAxis tick={{ fontSize: 10, fill: '#5E544A' }} stroke="#E3D8C4" />
                <RechartsTooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }} />
                <Line type="monotone" dataKey="offers" stroke="#8B1A1A" strokeWidth={2.5} dot={{ r: 4, fill: '#8B1A1A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compiled Dossier Action Box */}
          <div className="bg-[#F1E9D8] p-5 rounded-2xl border border-[#E3D8C4] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C1A1A]">
              <ShieldCheck className="text-[#8B1A1A]" size={18} />
              <span>NIRF Official Placement Dossier</span>
            </div>
            <p className="text-[11px] text-[#5E544A] leading-relaxed font-medium">
              Compile institutional placement records compliant with MHRD/NIRF parameter guidelines for Academic Year {academicYearStr}.
            </p>
            <button
              onClick={() => setShowCompiledModal(true)}
              className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <FileDown size={14} />
              Open Compiled NIRF Report
            </button>
          </div>
        </div>
      </div>

      {/* COMPILED OFFICIAL NIRF REPORT MODAL */}
      {showCompiledModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] my-8 overflow-hidden animate-scale-in">
            {/* Modal Controls Topbar (Excluded from Print) */}
            <div className="p-4 bg-[#1C1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#C8A243]" size={18} />
                <span className="font-bold text-xs">Official Institutional Dossier — Compiled NIRF Report</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintCompiled}
                  className="px-4 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowCompiledModal(false)}
                  className="text-[#8B7B6F] hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Compiled Document Body (Target for Dedicated Print) */}
            <div id="nirf-printable-report" className="p-8 sm:p-12 text-[#1C1A1A] bg-white max-h-[80vh] overflow-y-auto">
              {/* Header Letterhead */}
              <div className="border-b-2 pb-4 mb-6 text-center space-y-1">
                <h1 className="text-xl font-bold tracking-tight uppercase">Guru Gobind Singh Indraprastha University</h1>
                <h2 className="text-sm font-bold text-accent tracking-wide uppercase pt-2">
                  Official NIRF Placement Assessment Dossier · Academic Year {academicYearStr}
                </h2>
              </div>

              {/* Meta Grid */}
              <div className="meta-box grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6">
                <div>
                  <span className="text-dim block text-[10px] uppercase font-bold">Document ID</span>
                  <span className="font-bold font-mono">{nirfDocId}</span>
                </div>
                <div>
                  <span className="text-dim block text-[10px] uppercase font-bold">Graduation Cohort</span>
                  <span className="font-bold">UG (4 Years) — {currentYear}</span>
                </div>
                <div>
                  <span className="text-dim block text-[10px] uppercase font-bold">Accreditation Cycle</span>
                  <span className="font-bold">{nirfAccreditationCycle}</span>
                </div>
                <div>
                  <span className="text-dim block text-[10px] uppercase font-bold">Certified Date</span>
                  <span className="font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Section 1: Executive KPI Summary */}
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b pb-1 mb-3">
                  1. Executive Placement Overview
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="kpi-box">
                    <p className="text-[10px] text-dim font-semibold">Graduating</p>
                    <p className="font-bold text-sm text-[#1C1A1A]">{totalEligible}</p>
                  </div>
                  <div className="kpi-box">
                    <p className="text-[10px] text-dim font-semibold">Placed</p>
                    <p className="font-bold text-sm text-success">{totalPlaced}</p>
                  </div>
                  <div className="kpi-box bg-highlight">
                    <p className="text-[10px] text-accent font-bold">Placement Rate</p>
                    <p className="font-bold text-sm text-accent">{overallPlacementRate}%</p>
                  </div>
                  <div className="kpi-box">
                    <p className="text-[10px] text-dim font-semibold">Median CTC</p>
                    <p className="font-bold text-sm text-[#1C1A1A]">₹{stats?.medianCTC ? stats.medianCTC.toFixed(1) : '0'}L</p>
                  </div>
                  <div className="kpi-box">
                    <p className="text-[10px] text-dim font-semibold">Average CTC</p>
                    <p className="font-bold text-sm text-[#1C1A1A]">₹{stats?.averageCTC ? stats.averageCTC.toFixed(1) : '0'}L</p>
                  </div>
                  <div className="kpi-box bg-highlight">
                    <p className="text-[10px] text-accent font-bold">Highest Domestic</p>
                    <p className="font-bold text-sm text-accent">₹{stats?.highestCTC || 0}.0L</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Program-Wise Breakdown */}
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b pb-1 mb-3">
                  2. Discipline-Wise Placement & Median Remuneration Statistics
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Academic Discipline</th>
                      <th className="p-2 text-center">Graduating Students</th>
                      <th className="p-2 text-center">Placed Students</th>
                      <th className="p-2 text-center">Placement (%)</th>
                      <th className="p-2 text-center">Median Package</th>
                      <th className="p-2 text-center">Max Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchStats.map((b, i) => {
                      const pct = b.placedPercentage || ((b.placed / Math.max(b.eligible, 1)) * 100).toFixed(1);
                      return (
                        <tr key={i}>
                          <td className="p-2 font-bold text-left">{b.branch}</td>
                          <td className="p-2 text-center text-muted">{b.eligible}</td>
                          <td className="p-2 text-center font-bold">{b.placed}</td>
                          <td className="p-2 text-center font-bold text-success">{pct}%</td>
                          <td className="p-2 text-center font-mono font-bold">₹{b.medianCTC} LPA</td>
                          <td className="p-2 text-center font-mono font-bold text-accent">₹{b.highestCTC} LPA</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Institutional Signatures */}
              <div className="mt-12 pt-6 border-b grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="text-[#1C1A1A] mb-12 font-bold">Prepared & Verified By:</p>
                  <div className="border-t border-[#8B7B6F] pt-1 inline-block min-w-48" />
                </div>
                <div className="text-right">
                  <p className="text-[#1C1A1A] mb-12 font-bold">Approved for Submission:</p>
                  <div className="border-t border-[#8B7B6F] pt-1 inline-block min-w-48 text-right" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
