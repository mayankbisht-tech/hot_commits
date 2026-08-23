"use client";

import React from "react";
import useSWR from "swr";
import { Plus, Users, Briefcase, FileText, CheckCircle2, UserPlus, Clock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { fetcher } from "@/lib/api-client";

export default function CompanyDashboard() {
  const { data: drivesData, isLoading: drivesLoading } = useSWR<any>('/api/drives', fetcher, { refreshInterval: 2000 });
  const { data: appsData, isLoading: appsLoading } = useSWR<any>('/api/applications', fetcher, { refreshInterval: 2000 });

  const drives: any[] = drivesData?.drives || [];
  const applications: any[] = appsData?.applications || [];

  const activeDrives = drives.filter(d => {
    const driveTime = new Date(d.driveDate || d.deadline).getTime();
    if (driveTime < Date.now() - 24 * 60 * 60 * 1000) return false;
    return d.approvalStatus?.toLowerCase() === 'approved' || d.status?.toLowerCase() === 'active';
  });
  const totalApplicantsCount = applications.length;
  const shortlistedCount = applications.filter(a => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(a.status?.toUpperCase())).length;
  const offersCount = applications.filter(a => ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(a.status?.toUpperCase())).length;

  const funnelData = [
    { name: "Applied", value: totalApplicantsCount },
    { name: "Shortlisted", value: shortlistedCount },
    { name: "Interview", value: applications.filter(a => ['INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(a.status?.toUpperCase())).length },
    { name: "Offers", value: offersCount },
  ];

  const recentActivity = applications.slice(0, 4).map(app => ({
    id: app.id,
    action: `Candidate ${app.student?.name || 'Student'} (${app.student?.branch || 'Eng'}) applied for ${app.drive?.role || 'Role'}`,
    time: new Date(app.appliedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    status: app.status?.replace(/_/g, ' ') || 'Applied'
  }));

  const companyName = drives[0]?.company?.name || 'Recruiter';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in select-none text-[#1C1A1A] bg-[#F8F5EC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1A1A]">Recruitment Overview</h2>
          </div>
          <p className="text-xs text-[#5E544A] mt-0.5 font-medium">Welcome back, {companyName} Talent Acquisition Team</p>
        </div>
        <Link 
          href="/company/drives"
          className="inline-flex items-center px-4 py-2 bg-[#8B1A1A] text-white text-xs font-bold rounded-xl hover:bg-[#A63030] shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Post New Drive
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Drives", value: activeDrives.length, icon: Briefcase, color: "text-[#8B1A1A]", bg: "bg-[#F1E9D8] border-[#E3D8C4]" },
          { label: "Total Candidates", value: totalApplicantsCount, icon: Users, color: "text-[#8B1A1A]", bg: "bg-[#F1E9D8] border-[#E3D8C4]" },
          { label: "Shortlisted", value: shortlistedCount, icon: FileText, color: "text-[#C8A243]", bg: "bg-[#F1E9D8] border-[#E3D8C4]" },
          { label: "Offers Extended", value: offersCount, icon: CheckCircle2, color: "text-[#4A7C59]", bg: "bg-[#F1E9D8] border-[#E3D8C4]" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card flex items-center space-x-4">
            <div className={`p-3 rounded-xl border ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8B7B6F] uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-extrabold text-[#1C1A1A] mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Drives List */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#E3D8C4] flex justify-between items-center bg-[#F8F5EC]">
            <div>
              <h3 className="text-sm font-bold text-[#1C1A1A]">Our Active Drives</h3>
              <p className="text-[11px] text-[#5E544A]">Placement drives posted by our company</p>
            </div>
            <Link href="/company/drives" className="text-xs font-bold text-[#8B1A1A] hover:text-[#A63030]">
              View All Drives →
            </Link>
          </div>

          <div className="divide-y divide-[#E3D8C4] flex-1">
            {drivesLoading ? (
              <div className="p-12 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading our drives...
              </div>
            ) : drives.length > 0 ? (
              drives.slice(0, 4).map((drive: any) => {
                const driveAppCount = applications.filter((a: any) => (a.driveId || a.drive?.id) === drive.id).length;
                return (
                  <div key={drive.id} className="p-4 hover:bg-[#F8F5EC] flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1C1A1A] text-xs">{drive.role}</span>
                        <span className="text-[#8B1A1A] font-extrabold text-xs">₹{drive.ctc} LPA</span>
                      </div>
                      <p className="text-[11px] text-[#5E544A] mt-0.5 font-medium">
                        {drive.location} ({drive.mode}) • Min CGPA: {drive.minCGPA}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1C1A1A] bg-[#F1E9D8] px-2.5 py-1 rounded-xl border border-[#E3D8C4]">
                        {driveAppCount} applied
                      </span>
                      <Link
                        href={`/company/applicants?driveId=${drive.id}`}
                        className="px-3 py-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <span>Pipeline</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#8B7B6F]">
                No placement drives posted yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Application Funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1C1A1A]">Application Funnel</h3>
            <p className="text-[11px] text-[#5E544A] mt-0.5">Recruitment progress across stages</p>
          </div>

          <div className="h-52 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E9D8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5E544A' }} stroke="#E3D8C4" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E3D8C4', backgroundColor: '#FFFFFF', color: '#1C1A1A' }} />
                <Bar dataKey="value" fill="#8B1A1A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E3D8C4] text-[11px]">
            {funnelData.map(f => (
              <div key={f.name} className="flex justify-between bg-[#F8F5EC] p-2 rounded-xl border border-[#E3D8C4]">
                <span className="font-bold text-[#5E544A]">{f.name}</span>
                <span className="font-extrabold text-[#8B1A1A]">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1C1A1A]">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map(act => (
              <div key={act.id} className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1C1A1A]">{act.action}</span>
                <span className="text-[#8B7B6F] text-[11px] font-bold">{act.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8B7B6F]">No recent applicant activity.</p>
        )}
      </div>
    </div>
  );
}
