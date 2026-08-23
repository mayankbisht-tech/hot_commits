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

  const { data: userData } = useSWR<any>('/api/auth/me', fetcher);
  const { data: studentData } = useSWR<any>('/api/students/me', fetcher);

  const { data: notifData } = useSWR<{ notifications: any[]; unreadCount: number }>(
    '/api/notifications', 
    fetcher, 
    { refreshInterval: 2000 }
  );

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(n => n.unread).length;

  const studentName = studentData?.student?.name || userData?.user?.name || 'Student';
  const initials = studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="min-h-screen bg-[#F8F5EC] text-[#1C1A1A]">
      {/* Topbar */}
      <header className="bg-white border-b border-[#E3D8C4] sticky top-0 z-10 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Logo */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center text-[#8B1A1A]">
                <GraduationCap size={18} />
              </div>
              <span className="font-bold text-base text-[#1C1A1A]">
                GGSIPU <span className="text-[#8B1A1A] font-bold">Placement Cell</span>
              </span>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex space-x-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] shadow-xs'
                        : 'text-[#5E544A] hover:text-[#1C1A1A] hover:bg-[#F8F5EC]'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-xl border transition-all ${
                    showNotifications 
                      ? 'bg-[#F1E9D8] text-[#8B1A1A] border-[#E3D8C4]' 
                      : 'text-[#5E544A] hover:text-[#1C1A1A] hover:bg-[#F8F5EC] border-[#E3D8C4]'
                  }`}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B1A1A] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E3D8C4] rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                    <div className="p-4 border-b border-[#E3D8C4] flex items-center justify-between bg-[#F8F5EC]">
                      <h3 className="font-bold text-[#1C1A1A] text-xs">Notifications</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleClearAllNotifications}
                          className="text-[11px] text-[#8B7B6F] hover:text-[#C85555] font-semibold flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Clear all</span>
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
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-[#F8F5EC] transition-colors flex items-start gap-3 relative group ${
                              n.unread ? 'bg-[#F1E9D8]/50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs bg-[#F1E9D8] text-[#8B1A1A]`}>
                              {n.type === 'offer' ? <Award size={14} className="text-[#4A7C59]" /> : <AlertCircle size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1C1A1A] truncate">{n.title}</p>
                              <p className="text-[11px] text-[#5E544A] mt-0.5 leading-relaxed">{n.desc}</p>
                              <p className="text-[10px] text-[#8B7B6F] mt-1">{n.time}</p>
                            </div>

                            <button
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#8B7B6F] hover:text-[#C85555] hover:bg-[#F8F5EC] rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-[#8B7B6F]">
                          No active notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar with dynamic initials */}
              <Link
                href="/student/profile"
                className="w-8 h-8 rounded-xl bg-[#F1E9D8] flex items-center justify-center text-[#8B1A1A] font-bold text-xs border border-[#E3D8C4] hover:border-[#8B1A1A] transition-colors"
                title={`Profile (${studentName})`}
              >
                {initials}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-[#5E544A] hover:text-[#C85555] hover:bg-[#F8F5EC] rounded-xl transition-colors border border-[#E3D8C4]"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
