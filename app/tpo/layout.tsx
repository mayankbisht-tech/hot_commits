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

  // Search in Header
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
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F5EC] text-[#1C1A1A]">
      <Sidebar role="tpo" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E3D8C4] bg-white px-8 shadow-xs z-10 relative select-none">
          <h1 className="text-base font-bold text-[#1C1A1A] select-none cursor-default">{pageTitle}</h1>
          
          <div className="flex items-center gap-4">
            {/* Functional Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B7B6F]" />
              <input
                type="text"
                placeholder="Search students, drives, companies..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="h-9 w-64 rounded-xl border border-[#E3D8C4] bg-[#F8F5EC] pl-9 pr-8 text-xs text-[#1C1A1A] placeholder-[#8B7B6F] outline-none focus:border-[#8B1A1A] focus:ring-1 focus:ring-[#8B1A1A] select-text"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B7B6F] hover:text-[#1C1A1A]"
                >
                  <X size={13} />
                </button>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E3D8C4] rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-[#E3D8C4] animate-scale-in">
                    {hasSearchResults ? (
                      <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                        {matchingDrives.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-[#8B7B6F] uppercase">Placement Drives</p>
                            {matchingDrives.map(d => (
                              <Link
                                key={d.id}
                                href="/tpo/drives"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-[#F1E9D8] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-[#1C1A1A]">{d.role}</p>
                                  <p className="text-[11px] text-[#5E544A]">{d.company?.name} • ₹{d.ctc} LPA</p>
                                </div>
                                <ArrowRight size={13} className="text-[#8B1A1A]" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {matchingStudents.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-[#8B7B6F] uppercase">Candidates & Students</p>
                            {matchingStudents.map(s => (
                              <Link
                                key={s.id}
                                href="/tpo/applicants"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-[#F1E9D8] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-[#1C1A1A]">{s.name}</p>
                                  <p className="text-[11px] text-[#5E544A]">{s.rollNo} • {s.branch} (CGPA: {s.cgpa})</p>
                                </div>
                                <ArrowRight size={13} className="text-[#8B1A1A]" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {matchingCompanies.length > 0 && (
                          <div>
                            <p className="px-2.5 py-1 text-[10px] font-bold text-[#8B7B6F] uppercase">Companies</p>
                            {matchingCompanies.map(c => (
                              <Link
                                key={c.id}
                                href="/tpo/drives"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-2 hover:bg-[#F1E9D8] rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-[#1C1A1A]">{c.name}</p>
                                  <p className="text-[11px] text-[#5E544A]">{c.industry || 'Technology'} • {c.tier || 'Tier-1'}</p>
                                </div>
                                <ArrowRight size={13} className="text-[#8B1A1A]" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#8B7B6F]">
                        No matches found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl border transition-all select-none ${
                  showNotifications 
                    ? 'bg-[#F1E9D8] text-[#8B1A1A] border-[#E3D8C4] shadow-xs' 
                    : 'text-[#5E544A] hover:text-[#1C1A1A] hover:bg-[#F8F5EC] border-[#E3D8C4]'
                }`}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#8B1A1A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E3D8C4] rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F8F5EC]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#1C1A1A] text-xs select-none">Notifications</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          className="text-[11px] text-[#8B1A1A] hover:text-[#A63030] font-bold"
                        >
                          Mark read
                        </button>
                      )}
                      <button 
                        onClick={clearAll} 
                        className="text-[11px] text-[#8B7B6F] hover:text-[#C85555] ml-1"
                        title="Clear all"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[#8B7B6F] hover:text-[#1C1A1A] ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E3D8C4]">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-[#F8F5EC] transition-colors flex items-start gap-3 relative group ${
                            n.unread ? 'bg-[#F1E9D8]/50' : ''
                          }`}
                        >
                          <Link
                            href={n.link || '/tpo'}
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 flex-1 min-w-0"
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                              n.type === 'drive' ? 'bg-[#F1E9D8] text-[#C8A243]' :
                              n.type === 'offer' ? 'bg-[#F1E9D8] text-[#4A7C59]' : 'bg-[#F1E9D8] text-[#8B1A1A]'
                            }`}>
                              {n.type === 'drive' ? <AlertCircle size={14} /> :
                               n.type === 'offer' ? <Award size={14} /> : <Users size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1C1A1A] truncate">{n.title}</p>
                              <p className="text-[11px] text-[#5E544A] mt-0.5 leading-relaxed">{n.desc}</p>
                              <p className="text-[10px] text-[#8B7B6F] mt-1">{n.time}</p>
                            </div>
                          </Link>

                          <div className="flex items-center gap-1">
                            {n.unread && (
                              <span className="w-2 h-2 rounded-full bg-[#8B1A1A] flex-shrink-0" />
                            )}
                            <button
                              onClick={(e) => deleteSingleNotification(e, n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#8B7B6F] hover:text-[#C85555] hover:bg-[#F8F5EC] rounded-lg transition-all"
                              title="Delete this notification"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-[#8B7B6F]">
                        No active notifications right now.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1E9D8] font-bold text-xs text-[#8B1A1A] border border-[#E3D8C4] select-none shadow-xs">
              TA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8F5EC]">
          {children}
        </main>
      </div>
    </div>
  );
}
