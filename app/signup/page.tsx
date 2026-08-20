'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Building2, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, Lock, Mail, Phone, BookOpen, Star } from 'lucide-react';
import { apiSignup } from '@/lib/api-client';

export default function SignupPage() {
  const [role, setRole] = useState<'STUDENT' | 'COMPANY' | 'TPO'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student fields
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('AI-DS');
  const [year, setYear] = useState(4);
  const [graduationYear, setGraduationYear] = useState(2027);
  const [cgpa, setCgpa] = useState(8.0);
  const [backlogs, setBacklogs] = useState(0);
  const [class10, setClass10] = useState(85);
  const [class12, setClass12] = useState(85);
  const [phone, setPhone] = useState('');

  // Company fields
  const [industry, setIndustry] = useState('Software Engineering');
  const [tier, setTier] = useState<'TIER_1' | 'TIER_2' | 'TIER_3'>('TIER_1');
  const [website, setWebsite] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        role,
        name,
        email,
        password,
      };

      if (role === 'STUDENT') {
        payload.rollNo = rollNo;
        payload.branch = branch;
        payload.year = Number(year);
        payload.graduationYear = Number(graduationYear);
        payload.cgpa = Number(cgpa);
        payload.backlogs = Number(backlogs);
        payload.class10 = Number(class10);
        payload.class12 = Number(class12);
        payload.phone = phone;
      } else if (role === 'COMPANY') {
        payload.industry = industry;
        payload.tier = tier;
        payload.website = website;
        payload.contactPerson = contactPerson || name;
      }

      const res = await apiSignup(payload);
      const redirect = res.user.role === 'TPO' ? '/tpo' : res.user.role === 'COMPANY' ? '/company' : '/student';
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF6] flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-2.5 border border-orange-200 shadow-sm">
          <GraduationCap className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Create TPC Account</h1>
        <p className="text-stone-500 text-xs mt-0.5">Register as a Student, Recruiting Company, or TPO Coordinator</p>
      </div>

      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-card p-6 md:p-8 animate-fade-in-up">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User size={14} /> Student
          </button>
          <button
            type="button"
            onClick={() => setRole('COMPANY')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'COMPANY'
                ? 'bg-white text-green-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 size={14} /> Company
          </button>
          <button
            type="button"
            onClick={() => setRole('TPO')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'TPO'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap size={14} /> TPO Admin
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {role === 'COMPANY' ? 'Company Name' : 'Full Name'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'COMPANY' ? 'Acme Corp' : 'Rohan Sharma'}
                required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'STUDENT' ? 'student@ipu.ac.in' : 'hr@company.com'}
                required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Student-Specific Fields */}
          {role === 'STUDENT' && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="07114803121"
                    required
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Branch *</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white"
                  >
                    {['AI-DS', 'AI-ML', 'AR', 'IIOT'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Graduation Year</label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white"
                  >
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                    <option value={2029}>2029</option>
                    <option value={2030}>2030</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={backlogs}
                    onChange={(e) => setBacklogs(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Class 10 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={class10}
                    onChange={(e) => setClass10(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Class 12 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={class12}
                    onChange={(e) => setClass12(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company-Specific Fields */}
          {role === 'COMPANY' && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Company Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Cloud, E-commerce"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Company Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="TIER_1">Tier-1 (Top Product / High CTC)</option>
                    <option value="TIER_2">Tier-2 (Established Tech / Finance)</option>
                    <option value="TIER_3">Tier-3 (Startups / IT Services)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-stone-600 mb-1">Company Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={16} />}
            Create {role === 'STUDENT' ? 'Student' : role === 'COMPANY' ? 'Company' : 'Admin'} Account
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
