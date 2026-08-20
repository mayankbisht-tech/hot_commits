'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Bell, LogOut, GraduationCap, X, AlertCircle, Award, Trash2 } from 'lucide-react';
import { fetcher } from '@/lib/api-client';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifData } = useSWR<{ notifications: any[]; unreadCount: number }>(
    '/api/notifications', 
    fetcher, 
    { refreshInterval: 2000 }
  );

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Instant local removal
    mutate('/api/notifications', (current: any) => ({
      ...current,
      notifications: (current?.notifications || []).filter((n: any) => n.id !== notifId),
      unreadCount: Math.max(0, (current?.unreadCount || 1) - 1)
    }), false);

    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(notifId)}`, { method: 'DELETE', credentials: 'include' });
      await mutate('/api/notifications');
    } catch {}
  };

  const handleClearAllNotifications = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Instant local clear
    mutate('/api/notifications', { notifications: [], unreadCount: 0 }, false);

    try {
      await fetch('/api/notifications?id=all', { method: 'DELETE', credentials: 'include' });
      await mutate('/api/notifications');
    } catch {}
  };

  const navItems = [
    { name: 'Dashboard', href: '/student' },
    { name: 'Drives', href: '/student/drives' },
    { name: 'Applications', href: '/student/applications' },
    { name: 'Training', href: '/student/training' },
    { name: 'Profile', href: '/student/profile' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.clear();
    window.location.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#FFFAF6]">
      {/* Topbar with z-10 and select-none so modals/drawers render above it */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Logo */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                <GraduationCap size={18} />
              </div>
              <span className="font-bold text-base text-stone-900">
                GGSIPU <span className="text-orange-500 font-semibold">Placement Cell</span>
              </span>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Notification Bell (Requirement 2) */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-all"
                  title="Notifications"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in text-xs">
                    <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <Bell size={13} className="text-orange-500" />
                        <span>Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-[11px] text-stone-500 hover:text-red-600 font-semibold"
                          >
                            Clear All
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-stone-600">
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                      {notifications.length > 0 ? (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            className="p-3.5 hover:bg-stone-50 flex items-start justify-between gap-3 group transition-colors"
                          >
                            <Link
                              href={n.link || '/student'}
                              onClick={() => setShowNotifications(false)}
                              className="flex items-start gap-3 flex-1 min-w-0"
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                                n.type === 'reminder' ? 'bg-orange-500 text-white font-bold' :
                                n.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                              }`}>
                                {n.type === 'reminder' ? '⚡' : n.type === 'offer' ? <Award size={14} /> : <AlertCircle size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-stone-900">{n.title}</p>
                                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{n.desc}</p>
                                <p className="text-[10px] text-orange-600 font-semibold mt-1">{n.time}</p>
                              </div>
                            </Link>

                            <button
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              className="p-1.5 text-stone-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                              title="Delete notification"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-stone-400">
                          No notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors border border-stone-200"
              >
                <LogOut size={13} />
                Logout
              </button>

              <Link 
                href="/student/profile" 
                className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200 text-orange-700 font-bold text-xs hover:ring-2 hover:ring-orange-300 transition-all"
              >
                RM
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
