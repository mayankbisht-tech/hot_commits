'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import Sidebar from '@/components/shared/Sidebar';
import { fetcher } from '@/lib/api-client';
import { Search, Bell, Check, Trash2, X, Briefcase, Award, Users, AlertCircle, Sparkles, Building, ArrowRight } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: 'drive' | 'offer' | 'training' | 'candidate';
  link?: string;
}

export default function TPOLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Real-time Global Search in Header (Requirement 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: notifData } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    '/api/notifications', 
    fetcher, 
    { refreshInterval: 3000 }
  );

  const { data: drivesData } = useSWR<any>('/api/drives', fetcher);
  const { data: studentsData } = useSWR<any>('/api/students', fetcher);
  const { data: companiesData } = useSWR<any>('/api/companies', fetcher);

  const rawNotifications: Notification[] = notifData?.notifications || [];

  const visibleNotifications = rawNotifications
    .filter(n => !dismissedIds.includes(n.id))
    .map(n => ({
      ...n,
      unread: readIds.includes(n.id) ? false : n.unread
    }));

  const unreadCount = visibleNotifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setReadIds(visibleNotifications.map(n => n.id));
  };

  const clearAll = async () => {
    setDismissedIds(rawNotifications.map(n => n.id));
    mutate('/api/notifications', { notifications: [], unreadCount: 0 }, false);
    try {
      await fetch('/api/notifications?id=all', { method: 'DELETE', credentials: 'include' });
      await mutate('/api/notifications');
    } catch {}
  };

  const deleteSingleNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDismissedIds(prev => [...prev, id]);
    mutate('/api/notifications', (current: any) => ({
      ...current,
      notifications: (current?.notifications || []).filter((n: any) => n.id !== id),
      unreadCount: Math.max(0, (current?.unreadCount || 1) - 1)
    }), false);
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
      await mutate('/api/notifications');
    } catch {}
  };

  // Search calculations
  const allDrives: any[] = drivesData?.drives || [];
  const allStudents: any[] = studentsData?.students || [];
  const allCompanies: any[] = companiesData?.companies || [];

  const matchingDrives = searchQuery.trim() 
    ? allDrives.filter(d => d.role?.toLowerCase().includes(searchQuery.toLowerCase()) || d.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];
  
  const matchingStudents = searchQuery.trim()
    ? allStudents.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const matchingCompanies = searchQuery.trim()
    ? allCompanies.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const hasSearchResults = matchingDrives.length > 0 || matchingStudents.length > 0 || matchingCompanies.length > 0;

  // Create page title from pathname
  const pageTitle = pathname === '/tpo' 
    ? 'Overview Dashboard' 
    : pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FFFAF6]">
      <Sidebar role="tpo" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header z-index set to z-10 so all modals/drawers appear above it in foreground */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-8 shadow-xs z-10 relative select-none">
          <h1 className="text-lg font-bold text-stone-900 select-none cursor-default">{pageTitle}</h1>
          
          <div className="flex items-center gap-4">
            {/* Functional Search Bar with Live Result Dropdown (Requirement 3) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search students, drives, companies..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="h-9 w-64 rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-8 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 select-text"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X size={13} />
                </button>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100 animate-scale-in">
                    {hasSearchResults ? (
                      <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                        {matchingDrives.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase">Placement Drives</p>
                            {matchingDrives.map(d => (
                              <Link
                                key={d.id}
                                href="/tpo/drives"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-orange-50 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-stone-900">{d.role}</p>
                                  <p className="text-[11px] text-stone-500">{d.company?.name} • ₹{d.ctc} LPA</p>
                                </div>
                                <ArrowRight size={13} className="text-orange-500" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {matchingStudents.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase">Candidates & Students</p>
                            {matchingStudents.map(s => (
                              <Link
                                key={s.id}
                                href="/tpo/applicants"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-orange-50 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-stone-900">{s.name}</p>
                                  <p className="text-[11px] text-stone-500">{s.rollNo} • {s.branch} (CGPA: {s.cgpa})</p>
                                </div>
                                <ArrowRight size={13} className="text-orange-500" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {matchingCompanies.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase">Companies</p>
                            {matchingCompanies.map(c => (
                              <Link
                                key={c.id}
                                href="/tpo/drives"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-orange-50 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-stone-900">{c.name}</p>
                                  <p className="text-[11px] text-stone-500">{c.industry || 'Technology'} • {c.tier || 'Tier-1'}</p>
                                </div>
                                <ArrowRight size={13} className="text-orange-500" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-stone-400">
                        No matches found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell with Dropdown (Requirement 2) */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl border transition-all select-none ${
                  showNotifications 
                    ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50 border-stone-200'
                }`}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-xs select-none">Notifications</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                      <button 
                        onClick={clearAll} 
                        className="text-[11px] text-stone-400 hover:text-red-600 ml-1"
                        title="Clear all"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-stone-400 hover:text-stone-600 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-stone-50/80 transition-colors flex items-start gap-3 relative group ${
                            n.unread ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          <Link
                            href={n.link || '/tpo'}
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 flex-1 min-w-0"
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                              n.type === 'drive' ? 'bg-amber-100 text-amber-700' :
                              n.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {n.type === 'drive' ? <AlertCircle size={14} /> :
                               n.type === 'offer' ? <Award size={14} /> : <Users size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">{n.title}</p>
                              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{n.desc}</p>
                              <p className="text-[10px] text-stone-400 mt-1">{n.time}</p>
                            </div>
                          </Link>

                          {/* Individual Notification Delete Button (Requirement 2) */}
                          <div className="flex items-center gap-1">
                            {n.unread && (
                              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                            )}
                            <button
                              onClick={(e) => deleteSingleNotification(e, n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete this notification"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-stone-400">
                        No active notifications right now.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7ED] font-bold text-xs text-[#F97316] border border-[#F97316]/20 select-none">
              TA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FFFAF6]">
          {children}
        </main>
      </div>
    </div>
  );
}
