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
    <div className="flex h-screen w-full bg-[#F8F5EC] text-[#1C1A1A] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E3D8C4] flex flex-col flex-shrink-0 shadow-xs">
        <div className="h-16 flex items-center px-6 border-b border-[#E3D8C4] bg-[#F8F5EC]">
          <Building2 className="text-[#8B1A1A] mr-2.5 h-6 w-6" />
          <span className="font-bold text-base text-[#1C1A1A]">Company Portal</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-[#F1E9D8] text-[#8B1A1A] border-l-4 border-[#8B1A1A]"
                      : "text-[#5E544A] hover:bg-[#F8F5EC] hover:text-[#1C1A1A]"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-4 w-4 ${
                      isActive ? "text-[#8B1A1A]" : "text-[#8B7B6F]"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#E3D8C4] bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-bold text-[#5E544A] hover:text-[#C85555] hover:bg-[#F8F5EC] rounded-xl transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-[#8B7B6F]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F5EC]">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#E3D8C4] flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-[#1C1A1A]">GGSIPU Placement Portal</h1>
            <span className="text-xs bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] px-2 py-0.5 rounded-full font-bold">
              Recruiter
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
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
                            {n.type === 'offer' ? <Award size={14} /> : <AlertCircle size={14} />}
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

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-xl bg-[#F1E9D8] flex items-center justify-center text-[#4A7C59] font-bold text-xs border border-[#E3D8C4]">
              CO
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8F5EC]">
          {children}
        </main>
      </div>
    </div>
  );
}
