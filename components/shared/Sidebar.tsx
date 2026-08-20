// Sidebar.tsx
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
      case 'student': return 'John Doe';
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
    <aside className="w-[220px] bg-white h-screen sticky top-0 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.1)] flex flex-col shrink-0 select-none">
      <div className="p-6 pb-4 select-none">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-stone-900 leading-tight">Placement Cell</h1>
            <p className="text-xs text-stone-500">{getSubtitle()}</p>
          </div>
        </div>
        
        {role === 'tpo' && (
          <Link 
            href="/tpo/schedule"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>+ New Placement Drive</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/${role}` && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive 
                  ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-600' 
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-l-4 border-transparent'
              }`}
            >
              <link.icon size={18} className={isActive ? 'text-orange-600' : 'text-stone-400'} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-100 space-y-1">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-l-4 border-transparent transition-colors"
        >
          <HelpCircle size={18} className="text-stone-400" />
          <span className="font-medium">Help Center</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-l-4 border-transparent transition-colors text-left"
        >
          <LogOut size={18} className="text-stone-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
