'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Building2, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, Lock, Mail, Phone, BookOpen, Star, Plus, X, Code } from 'lucide-react';
import { apiSignup } from '@/lib/api-client';

const SUGGESTED_SKILLS = [
  'React.js', 'Node.js', 'Python', 'TypeScript', 'Java', 'SQL', 
  'PostgreSQL', 'Docker', 'Machine Learning', 'Data Structures', 'Git', 'AWS'
];

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
  const [cgpa, setCgpa] = useState<string>('8.0');
  const [backlogs, setBacklogs] = useState<number>(0);
  const [class10, setClass10] = useState<string>('85.0');
  const [class12, setClass12] = useState<string>('85.0');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>(['React.js', 'Node.js', 'Python', 'SQL']);
  const [skillInput, setSkillInput] = useState('');

  // Company fields
  const [industry, setIndustry] = useState('Software Engineering');
  const [tier, setTier] = useState<'TIER_1' | 'TIER_2' | 'TIER_3'>('TIER_1');
  const [website, setWebsite] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address with a domain (e.g. name@ipu.ac.in).');
      return;
    }

    if (role === 'STUDENT') {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        setError('Phone number must be exactly 10 digits.');
        return;
      }

      const numCgpa = parseFloat(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        setError('CGPA must be a valid number between 0.0 and 10.0.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        role,
        name: name.trim(),
        email: cleanEmail,
        password,
      };

      if (role === 'STUDENT') {
        payload.rollNo = rollNo.trim();
        payload.branch = branch;
        payload.year = Number(year);
        payload.graduationYear = Number(graduationYear);
        payload.cgpa = parseFloat(cgpa) || 8.0;
        payload.backlogs = Number(backlogs) || 0;
        payload.class10 = parseFloat(class10) || 85.0;
        payload.class12 = parseFloat(class12) || 85.0;
        payload.phone = phone.replace(/[^0-9]/g, '');
        payload.skills = skills.length > 0 ? skills : ['Problem Solving'];
      } else if (role === 'COMPANY') {
        payload.industry = industry;
        payload.tier = tier;
        payload.website = website;
        payload.contactPerson = contactPerson || name.trim();
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
    <div className="min-h-screen bg-[#F8F5EC] flex flex-col items-center justify-center px-4 py-10 text-[#1C1A1A]">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F1E9D8] rounded-2xl mb-2.5 border border-[#E3D8C4] shadow-xs text-[#8B1A1A]">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#1C1A1A]">Create TPC Account</h1>
        <p className="text-[#5E544A] text-xs mt-0.5">Register as a Student, Recruiting Company, or TPO Coordinator</p>
      </div>

      <div className="w-full max-w-2xl bg-white border border-[#E3D8C4] rounded-2xl shadow-card p-6 md:p-8 animate-fade-in-up">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#F8F5EC] rounded-xl mb-6 border border-[#E3D8C4]">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-[#8B1A1A] shadow-xs'
                : 'text-[#5E544A] hover:text-[#1C1A1A]'
            }`}
          >
            <User size={14} /> Student
          </button>
          <button
            type="button"
            onClick={() => setRole('COMPANY')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              role === 'COMPANY'
                ? 'bg-white text-[#4A7C59] shadow-xs'
                : 'text-[#5E544A] hover:text-[#1C1A1A]'
            }`}
          >
            <Building2 size={14} /> Company
          </button>
          <button
            type="button"
            onClick={() => setRole('TPO')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              role === 'TPO'
                ? 'bg-white text-[#8B1A1A] shadow-xs'
                : 'text-[#5E544A] hover:text-[#1C1A1A]'
            }`}
          >
            <GraduationCap size={14} /> TPO Admin
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-[#F1E9D8] border border-[#C85555] text-[#C85555] px-4 py-2.5 rounded-xl text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5E544A] mb-1">
                {role === 'COMPANY' ? 'Company Name' : 'Full Name'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'COMPANY' ? 'Acme Corp' : 'e.g. Piyush Prajapati'}
                required
                className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E544A] mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'STUDENT' ? 'prajapati@ipu.ac.in' : 'hr@company.com'}
                required
                className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5E544A] mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
              />
            </div>

            {role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-[#5E544A] mb-1">Phone Number (10 Digits) *</label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-[#E3D8C4] bg-[#F1E9D8] text-[#5E544A] rounded-l-xl text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    required
                    className="w-full border border-[#E3D8C4] rounded-r-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] placeholder-[#8B7B6F] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Student-Specific Fields */}
          {role === 'STUDENT' && (
            <div className="pt-3 border-t border-[#E3D8C4] space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#1C1A1A] uppercase tracking-wider">Academic Record</h3>
                <p className="text-[11px] text-[#5E544A] mt-0.5">Enter your official enrollment metrics and university branch</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Roll / Enrollment No *</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="07114803121"
                    required
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Engineering Branch *</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  >
                    {['AI-DS', 'AI-ML', 'AR', 'IIOT'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Graduation Year</label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  >
                    <option value={2027}>Class of 2027</option>
                    <option value={2028}>Class of 2028</option>
                    <option value={2029}>Class of 2029</option>
                    <option value={2030}>Class of 2030</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Current CGPA (0-10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    required
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={backlogs}
                    onChange={(e) => setBacklogs(Number(e.target.value))}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Class 10th (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={class10}
                    onChange={(e) => setClass10(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Class 12th (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={class12}
                    onChange={(e) => setClass12(e.target.value)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
              </div>

              {/* Skills & Tech Stack Section */}
              <div className="pt-2 border-t border-[#E3D8C4] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1C1A1A]">
                    Technical Skills & Stack ({skills.length})
                  </label>
                  <span className="text-[11px] text-[#8B7B6F]">Synced to TPO candidate roster</span>
                </div>

                {/* Selected Skill Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4]">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#1C1A1A] border border-[#E3D8C4] rounded-lg text-xs font-bold shadow-2xs group"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-[#8B7B6F] hover:text-[#C85555] p-0.5 rounded"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-xs text-[#8B7B6F] py-0.5">No skills added yet. Select from below or type to add.</span>
                  )}
                </div>

                {/* Custom Skill Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Add custom skill (e.g. Next.js, Kubernetes) and press Enter"
                    className="flex-1 border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="px-3 py-2 bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] hover:bg-[#E3D8C4] rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Suggested Skill Chips */}
                <div className="pt-1">
                  <p className="text-[10px] uppercase font-bold text-[#8B7B6F] mb-1.5">Quick Suggestions</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_SKILLS.map((suggested) => {
                      const isAdded = skills.some(s => s.toLowerCase() === suggested.toLowerCase());
                      return (
                        <button
                          key={suggested}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddSkill(suggested)}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all border ${
                            isAdded
                              ? 'bg-[#F1E9D8] text-[#8B7B6F] border-transparent opacity-60 cursor-default'
                              : 'bg-white text-[#5E544A] border-[#E3D8C4] hover:border-[#8B1A1A] hover:text-[#8B1A1A]'
                          }`}
                        >
                          + {suggested}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company-Specific Fields */}
          {role === 'COMPANY' && (
            <div className="pt-2 border-t border-[#E3D8C4] space-y-3">
              <h3 className="text-xs font-bold text-[#1C1A1A] uppercase tracking-wider">Company Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Cloud, E-commerce"
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Company Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-white text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  >
                    <option value="TIER_1">Tier-1 (Top Product / High CTC)</option>
                    <option value="TIER_2">Tier-2 (Established Tech / Finance)</option>
                    <option value="TIER_3">Tier-3 (Startups / IT Services)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#5E544A] font-semibold mb-1">Company Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-xs font-bold hover:bg-[#A63030] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={15} />}
            Create {role === 'STUDENT' ? 'Student' : role === 'COMPANY' ? 'Company' : 'Admin'} Account
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E3D8C4] text-center">
          <p className="text-xs text-[#5E544A]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#8B1A1A] hover:text-[#A63030]">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
