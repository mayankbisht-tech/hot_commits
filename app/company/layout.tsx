"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  Bell,
  LayoutDashboard,
  Briefcase,
  Users,
  Gift,
  LogOut,
  Building2,
  X,
  Trash2,
  AlertCircle,
  Award
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    { name: "Dashboard", href: "/company", icon: LayoutDashboard },
    { name: "Drives", href: "/company/drives", icon: Briefcase },
    { name: "Applicants", href: "/company/applicants", icon: Users },
    { name: "Offers", href: "/company/offers", icon: Gift },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.clear();
    window.location.replace('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#FFFAF6] text-stone-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col flex-shrink-0 shadow-xs">
        <div className="h-16 flex items-center px-6 border-b border-stone-100 bg-orange-50/50">
          <Building2 className="text-orange-500 mr-2 h-6 w-6" />
          <span className="font-bold text-base text-stone-900">Company Portal</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-orange-50 text-orange-700 border-l-4 border-orange-500 font-bold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-4 w-4 ${
                      isActive ? "text-orange-600" : "text-stone-400 group-hover:text-orange-500"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-stone-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar with z-10 so popups are in foreground */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 flex-shrink-0 shadow-xs z-10 select-none">
          <div className="flex items-center space-x-6">
            <h1 className="text-base font-bold text-stone-900">
              GGSIPU Placement Portal
            </h1>
            {/* Top Tabs */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border border-orange-200"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

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
                            href={n.link || '/company'}
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 flex-1 min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <AlertCircle size={14} />
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
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
              CO
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#FFFAF6]">
          {children}
        </main>
      </div>
    </div>
  );
}
