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

  const activeDrives = drives.filter(d => d.approvalStatus?.toLowerCase() === 'approved' || d.status?.toLowerCase() === 'active');
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
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in select-none text-stone-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">Recruitment Overview</h2>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> Live
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Welcome back, {companyName} Talent Acquisition Team</p>
        </div>
        <Link 
          href="/company/drives"
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Post New Drive
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Our Active Drives", value: activeDrives.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "Total Candidates", value: totalApplicantsCount, icon: Users, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Shortlisted Candidates", value: shortlistedCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { label: "Offers Extended", value: offersCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card flex items-center space-x-4">
            <div className={`p-3 rounded-xl border ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500">{stat.label}</p>
              <p className="text-2xl font-extrabold text-stone-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Our Active Drives List (Requirement 1 & 2) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/70">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Our Active Drives</h3>
              <p className="text-[11px] text-stone-500">Live placement drives posted by our company</p>
            </div>
            <Link href="/company/drives" className="text-xs font-bold text-orange-600 hover:text-orange-700">
              View All Drives →
            </Link>
          </div>

          <div className="divide-y divide-stone-100 flex-1">
            {drivesLoading ? (
              <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading our drives...
              </div>
            ) : drives.length > 0 ? (
              drives.slice(0, 4).map((drive) => {
                const isApproved = drive.approvalStatus?.toLowerCase() === 'approved';
                const isPending = drive.approvalStatus?.toLowerCase() === 'pending';

                return (
                  <div key={drive.id} className="p-4 hover:bg-stone-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-900">{drive.role}</h4>
                        {isApproved ? (
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.2 rounded-full">Active</span>
                        ) : isPending ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.2 rounded-full">Pending TPO</span>
                        ) : (
                          <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.2 rounded-full">{drive.status}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-[11px] text-stone-500 mt-1 space-x-3">
                        <span className="text-orange-600 font-bold">₹{drive.ctc} LPA</span>
                        <span>•</span>
                        <span>{drive.location} ({drive.mode})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {drive.deadline ? new Date(drive.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No deadline'}</span>
                      </div>
                      
                      <div className="mt-2 text-[11px] text-stone-500 font-semibold">
                        {drive._count?.applications || 0} Registered Candidates
                      </div>
                    </div>

                    <Link
                      href="/company/applicants"
                      className="px-3 py-1.5 border border-stone-200 hover:border-orange-300 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>Pipeline</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-stone-400 space-y-2">
                <p>No recruitment drives posted yet.</p>
                <Link href="/company/drives" className="inline-block px-3 py-1.5 bg-orange-500 text-white rounded-xl font-bold">
                  + Create First Drive
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Application Funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Recruitment Funnel</h3>
            <p className="text-[11px] text-stone-500 mb-4">Conversion from applied to extended offers</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E5E4' }} />
                <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick activity feed */}
          <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase">Recent Activity</p>
            {recentActivity.length > 0 ? (
              recentActivity.map(act => (
                <div key={act.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-700 truncate max-w-[200px]">{act.action}</span>
                  <span className="text-[10px] text-stone-400 font-medium shrink-0">{act.time}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-stone-400">No recent candidate registrations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
