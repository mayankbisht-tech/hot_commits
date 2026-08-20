'use client';

import React, { useState } from 'react';
import { GraduationCap, Building2, User, ArrowRight, Loader2, AlertCircle, Key, Mail, CheckCircle2 } from 'lucide-react';
import { apiLogin } from '@/lib/api-client';

const roles = [
  {
    key: 'TPO',
    label: 'TPO Admin',
    subtitle: 'Training & Placement Office',
    description: 'Manage drives, eligibility rules, student applications and NIRF reports.',
    icon: GraduationCap,
    accent: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
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
    accent: '#16A34A',
    bg: '#F0FDF4',
    border: '#86EFAC',
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
    accent: '#F97316',
    bg: '#FFFBEB',
    border: '#FDE68A',
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
      // Hard navigation to guarantee cookie is picked up by middleware and Next.js shell
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
    <div className="min-h-screen bg-[#FFFAF6] flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-3 border border-orange-200 shadow-sm">
          <GraduationCap className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">GGSIPU Placement Cell</h1>
        <p className="text-stone-500 mt-1 text-sm">Training & Placement Portal · Session 2026–27</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">
          <CheckCircle2 size={12} className="text-orange-500" /> Placement Session 2026-27
        </span>
      </div>

      {/* Role Cards */}
      <div className="w-full max-w-4xl">
        <p className="text-center text-stone-600 text-sm mb-6 font-medium">
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
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                      {role.key}
                    </span>
                  </div>

                  <h2 className="font-bold text-stone-900 text-lg">{role.label}</h2>
                  <p className="text-xs font-medium mt-0.5" style={{ color: role.accent }}>{role.subtitle}</p>
                  <p className="text-stone-500 text-xs mt-2.5 leading-relaxed">{role.description}</p>
                </div>

                {/* Credentials box */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="bg-stone-50 rounded-lg p-2.5 text-xs text-stone-600 space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-stone-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] text-stone-700 truncate">{role.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Key size={12} className="text-stone-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] text-stone-700 font-semibold">{role.password}</span>
                    </div>
                  </div>

                  <button
                    disabled={loadingRole !== null}
                    onClick={() => handleDemoLogin(role)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
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
          <div className="mt-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Login Section */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-xs font-medium text-stone-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-xs"
          >
            {showManual ? '↑ Hide custom credentials form' : '↓ Or enter custom credentials manually'}
          </button>
        </div>

        {showManual && (
          <form onSubmit={handleManualLogin} className="mt-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-card animate-fade-in max-w-sm mx-auto">
            <h3 className="font-semibold text-stone-900 mb-3 text-sm">Custom Login</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@ggsipu.ac.in"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loadingRole !== null}
                className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingRole === 'manual' && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Banner */}
        <div className="mt-8 bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-center flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-left">
            <p className="text-xs font-bold text-stone-800">New to GGSIPU Placement Cell?</p>
            <p className="text-[11px] text-stone-500">Create a student, company, or coordinator account to get started.</p>
          </div>
          <a
            href="/signup"
            className="px-4 py-2 bg-white text-orange-600 border border-orange-300 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1 flex-shrink-0"
          >
            Create New Account <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <p className="mt-10 text-xs text-stone-400 text-center">
        GGSIPU — Guru Gobind Singh Indraprastha University, New Delhi
      </p>
    </div>
  );
}
