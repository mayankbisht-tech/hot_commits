'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Building2, User, ArrowRight, Loader2, AlertCircle, Key, Mail, CheckCircle2, UserPlus } from 'lucide-react';
import { apiLogin } from '@/lib/api-client';

const roles = [
  {
    key: 'TPO',
    label: 'TPO Admin',
    subtitle: 'Training & Placement Office',
    description: 'Manage drives, eligibility rules, student applications and NIRF reports.',
    icon: GraduationCap,
    accent: '#8B1A1A',
    bg: '#F1E9D8',
    border: '#E3D8C4',
    email: 'admin@ggsipu.ac.in',
    password: 'admin123',
    redirect: '/tpo',
  },
  {
    key: 'COMPANY',
    label: 'Company',
    subtitle: 'Recruiting Company',
    description: 'Post placement drives, review applicants, extend offers.',
    icon: Building2,
    accent: '#4A7C59',
    bg: '#F1E9D8',
    border: '#E3D8C4',
    email: 'hr@techcorp.io',
    password: 'company123',
    redirect: '/company',
  },
  {
    key: 'STUDENT',
    label: 'Student',
    subtitle: 'Final Year Student (Rohan Mehta)',
    description: 'Browse eligible drives, apply, track application stages and training.',
    icon: User,
    accent: '#C8A243',
    bg: '#F1E9D8',
    border: '#E3D8C4',
    email: 'rohan@ipu.ac.in',
    password: 'student123',
    redirect: '/student',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleDemoLogin = async (role: typeof roles[0]) => {
    setError('');
    setLoadingRole(role.key);
    try {
      await apiLogin(role.email, role.password);
      window.location.href = role.redirect;
    } catch (e) {
      setError((e as Error).message || 'Login failed');
      setLoadingRole(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingRole('manual');
    try {
      const data = await apiLogin(email, password);
      const redirect = data.user.role === 'TPO' ? '/tpo' : data.user.role === 'COMPANY' ? '/company' : '/student';
      window.location.href = redirect;
    } catch (e) {
      setError((e as Error).message || 'Invalid credentials');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] flex flex-col items-center justify-center px-4 py-12 select-none text-[#1C1A1A]">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F1E9D8] rounded-2xl mb-3 border border-[#E3D8C4] shadow-xs">
          <GraduationCap className="w-8 h-8 text-[#8B1A1A]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1C1A1A]">GGSIPU Placement Cell</h1>
        <p className="text-[#5E544A] mt-1 text-sm font-medium">Training & Placement Portal · Session 2026–27</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] rounded-full text-xs font-bold">
            <CheckCircle2 size={12} className="text-[#8B1A1A]" /> Placement Session 2026-27
          </span>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-[#8B1A1A] border border-[#8B1A1A] hover:bg-[#8B1A1A] hover:text-white rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <UserPlus size={12} />
            <span>Create New Account</span>
          </Link>
        </div>
      </div>

      {/* Role Cards */}
      <div className="w-full max-w-4xl">
        <p className="text-center text-[#5E544A] text-sm mb-6 font-semibold">
          Click any role below for instant 1-click access:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map((role, i) => {
            const Icon = role.icon;
            const isLoading = loadingRole === role.key;

            return (
              <div
                key={role.key}
                className={`bg-white border rounded-2xl p-6 shadow-card card-hover flex flex-col justify-between animate-fade-in-up delay-${(i + 1) * 100}`}
                style={{ borderColor: role.border }}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: role.bg, border: `1px solid ${role.border}` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: role.accent }} />
                    </div>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F1E9D8] text-[#5E544A]">
                      {role.key}
                    </span>
                  </div>

                  <h2 className="font-bold text-[#1C1A1A] text-lg">{role.label}</h2>
                  <p className="text-xs font-bold mt-0.5" style={{ color: role.accent }}>{role.subtitle}</p>
                  <p className="text-[#5E544A] text-xs mt-2.5 leading-relaxed font-medium">{role.description}</p>
                </div>

                {/* Credentials box */}
                <div className="mt-4 pt-3 border-t border-[#E3D8C4]">
                  <div className="bg-[#F1E9D8] rounded-xl p-2.5 text-xs text-[#5E544A] space-y-1 mb-3 border border-[#E3D8C4]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-[#8B7B6F] flex-shrink-0" />
                      <span className="font-mono text-[11px] text-[#1C1A1A] truncate">{role.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Key size={12} className="text-[#8B7B6F] flex-shrink-0" />
                      <span className="font-mono text-[11px] text-[#1C1A1A] font-bold">{role.password}</span>
                    </div>
                  </div>

                  <button
                    disabled={loadingRole !== null}
                    onClick={() => handleDemoLogin(role)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: role.accent, color: '#fff' }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={14} />}
                    Login as {role.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-5 p-3.5 bg-[#F1E9D8] border border-[#C85555] rounded-xl flex items-center gap-2 text-xs font-bold text-[#C85555]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Bottom Actions: Create Account & Manual Login */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E3D8C4] hover:border-[#8B1A1A] text-[#1C1A1A] hover:text-[#8B1A1A] rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <UserPlus size={14} className="text-[#8B1A1A]" />
            <span>New user? Create a new account</span>
          </Link>

          <button
            onClick={() => setShowManual(!showManual)}
            className="text-xs font-bold text-[#8B1A1A] hover:underline"
          >
            {showManual ? '— Hide Manual Form —' : 'Or login with custom credentials →'}
          </button>
        </div>

        {/* Manual Login Form */}
        {showManual && (
          <div className="mt-4 bg-white border border-[#E3D8C4] rounded-2xl p-6 shadow-card max-w-md mx-auto animate-scale-in">
            <h3 className="font-bold text-[#1C1A1A] text-sm mb-4">Manual Account Login</h3>
            <form onSubmit={handleManualLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#5E544A] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ggsipu.ac.in"
                  className="w-full px-3 py-2 bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5E544A] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[#F8F5EC] border border-[#E3D8C4] rounded-xl text-xs text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loadingRole !== null}
                className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
              >
                {loadingRole === 'manual' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Sign In
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-[#8B7B6F]">
        <p>Guru Gobind Singh Indraprastha University · Placement Portal</p>
      </div>
    </div>
  );
}
