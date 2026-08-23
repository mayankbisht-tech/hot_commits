'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart2,
  BookOpen,
  Gift,
  Home,
  Search,
  FileText,
  User,
  HelpCircle,
  LogOut,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  role?: 'tpo' | 'company' | 'student';
}

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export default function Sidebar({ role = 'tpo' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getSubtitle = () => {
    switch (role) {
      case 'tpo': return 'GGSIPU Admin';
      case 'company': return 'Tech Corp';
      case 'student': return 'Student Portal';
      default: return '';
    }
  };

  const getNavLinks = (): NavLink[] => {
    switch (role) {
      case 'tpo':
        return [
          { label: 'Overview', href: '/tpo', icon: LayoutDashboard },
          { label: 'Job Postings', href: '/tpo/drives', icon: Briefcase },
          { label: 'Applicant Pool', href: '/tpo/applicants', icon: Users },
          { label: 'Schedule', href: '/tpo/schedule', icon: Calendar },
          { label: 'Reports', href: '/tpo/reports', icon: BarChart2 },
          { label: 'Training', href: '/tpo/training', icon: BookOpen },
        ];
      case 'company':
        return [
          { label: 'Dashboard', href: '/company', icon: LayoutDashboard },
          { label: 'Our Drives', href: '/company/drives', icon: Briefcase },
          { label: 'Applicants', href: '/company/applicants', icon: Users },
          { label: 'Offers', href: '/company/offers', icon: Gift },
        ];
      case 'student':
        return [
          { label: 'Dashboard', href: '/student', icon: Home },
          { label: 'Browse Drives', href: '/student/drives', icon: Search },
          { label: 'Applications', href: '/student/applications', icon: FileText },
          { label: 'Training', href: '/student/training', icon: BookOpen },
          { label: 'My Profile', href: '/student/profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className="w-[220px] bg-white h-screen sticky top-0 border-r border-[#E3D8C4] flex flex-col shrink-0 select-none shadow-xs">
      <div className="p-5 pb-4 select-none border-b border-[#E3D8C4]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#8B1A1A] flex items-center justify-center text-white shrink-0 shadow-xs">
            <GraduationCap size={18} />
          </div>
          <div>
            <h1 className="font-bold text-[#1C1A1A] leading-tight text-sm">Placement Cell</h1>
            <p className="text-[11px] text-[#5E544A]">{getSubtitle()}</p>
          </div>
        </div>
        
        {role === 'tpo' && (
          <Link 
            href="/tpo/schedule"
            className="mt-3.5 w-full flex items-center justify-center gap-1.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>+ New Placement Drive</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/${role}` && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive 
                  ? 'bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4]' 
                  : 'text-[#5E544A] hover:bg-[#F8F5EC] hover:text-[#1C1A1A]'
              }`}
            >
              <link.icon size={16} className={isActive ? 'text-[#8B1A1A]' : 'text-[#8B7B6F]'} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E3D8C4] space-y-1 bg-[#FFFFFF]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#5E544A] hover:bg-[#F8F5EC] hover:text-[#C85555] transition-colors text-left"
        >
          <LogOut size={16} className="text-[#8B7B6F]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
