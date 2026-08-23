"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { 
  User, Mail, Phone, BookOpen, Award, Edit3, 
  CheckCircle2, FileText, Star, Plus, Trash2, X, Check, Loader2, Sparkles, AlertCircle, Lock
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

export default function StudentProfilePage() {
  const { data: studentData, isLoading } = useSWR<any>('/api/students/me', fetcher, { refreshInterval: 2000 });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Student Identity Fields (READ-ONLY / Locked by University)
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [branch, setBranch] = useState("AI-DS");
  const [graduationYear, setGraduationYear] = useState(2027);

  // Editable Profile Fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Academic Fields
  const [cgpa, setCgpa] = useState("8.0");
  const [backlogs, setBacklogs] = useState(0);
  const [class10, setClass10] = useState("85.0");
  const [class12, setClass12] = useState("85.0");

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Certifications
  const [certifications, setCertifications] = useState<Array<{ name: string; issuer: string; year: string; badge: string }>>([
    { name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", year: "2026", badge: "AWS" },
    { name: "Meta Frontend Developer", issuer: "Meta / Coursera", year: "2026", badge: "META" },
  ]);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertYear, setNewCertYear] = useState("2026");
  const [showAddCertModal, setShowAddCertModal] = useState(false);

  // Achievements
  const [achievements, setAchievements] = useState<string[]>([
    "1st Place — Smart India Hackathon 2026",
    "Google Summer of Code (GSoC) Contributor",
    "Dean's Honor List — 6 Consecutive Semesters",
  ]);
  const [newAchievementInput, setNewAchievementInput] = useState("");
  const [showAddAchievementModal, setShowAddAchievementModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"academic" | "skills" | "achievements">("academic");

  // Centered Popup State
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const syncFromStudent = (s: any) => {
    if (!s) return;
    if (s.name) setName(s.name);
    if (s.rollNo) setRollNo(s.rollNo);
    if (s.user?.email || s.email) setEmail(s.user?.email || s.email);
    if (s.phone) {
      const rawDigits = String(s.phone).replace(/[^0-9]/g, '');
      const tenDigits = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
      setPhone(tenDigits);
    } else {
      setPhone('');
    }
    if (s.bio) setBio(s.bio);
    if (s.branch) setBranch(s.branch);
    if (s.graduationYear) setGraduationYear(s.graduationYear);
    if (s.cgpa) setCgpa(String(s.cgpa));
    if (s.backlogs !== undefined) setBacklogs(s.backlogs);
    if (s.class10) setClass10(String(s.class10));
    if (s.class12) setClass12(String(s.class12));
    if (Array.isArray(s.skills)) setSkills(s.skills);
  };

  useEffect(() => {
    if (studentData?.student && !editing) {
      syncFromStudent(studentData.student);
    }
  }, [studentData, editing]);

  const handleCancelEdit = () => {
    if (studentData?.student) {
      syncFromStudent(studentData.student);
    }
    setEditing(false);
  };

  const isValidEmail = (e: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(e);
  };

  const handleSaveProfile = async () => {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    if (rawDigits.length !== 10) {
      showPopup('error', 'Invalid Phone Number', 'The phone number cannot be saved if its not 10 digits.');
      return;
    }

    if (!isValidEmail(email)) {
      showPopup('error', 'Invalid Email Domain', 'The email cannot be saved without a valid domain (e.g. name@ipu.ac.in).');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/students/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: rawDigits,
          cgpa: parseFloat(cgpa) || 8.0,
          backlogs: Number(backlogs) || 0,
          class10: parseFloat(class10) || 85.0,
          class12: parseFloat(class12) || 85.0,
          skills: skills,
          bio: bio,
        }),
        credentials: 'include'
      });

      let json: any = {};
      const resText = await res.text();
      try {
        json = JSON.parse(resText);
      } catch {
        throw new Error(`Server returned unexpected response (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(json.error || 'Failed to save profile');
      }

      await mutate('/api/students/me');
      await mutate('/api/auth/me');
      await mutate('/api/drives/eligible');
      await mutate('/api/applications');

      setEditing(false);
      showPopup('success', 'Success', 'details updated successfully');
    } catch (err: any) {
      showPopup('error', 'Update Failed', err.message || 'Unable to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skills.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }

    const updatedSkills = [...skills, trimmed];
    setSkills(updatedSkills);
    setNewSkillInput("");

    try {
      await fetch('/api/students/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills }),
        credentials: 'include'
      });
      await mutate('/api/students/me');
      await mutate('/api/drives/eligible');
    } catch {}
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);

    try {
      await fetch('/api/students/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills }),
        credentials: 'include'
      });
      await mutate('/api/students/me');
      await mutate('/api/drives/eligible');
    } catch {}
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCertName.trim() && newCertIssuer.trim()) {
      const badge = newCertIssuer.split(' ')[0].toUpperCase().slice(0, 4) || 'CERT';
      setCertifications(prev => [...prev, {
        name: newCertName.trim(),
        issuer: newCertIssuer.trim(),
        year: newCertYear || "2026",
        badge: badge
      }]);
      setNewCertName("");
      setNewCertIssuer("");
      setShowAddCertModal(false);
    }
  };

  const handleRemoveCert = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAchievementInput.trim()) {
      setAchievements(prev => [...prev, newAchievementInput.trim()]);
      setNewAchievementInput("");
      setShowAddAchievementModal(false);
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
  };

  const displayName = name || studentData?.student?.name || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="animate-fade-in text-[#1C1A1A] space-y-6 select-none max-w-7xl mx-auto bg-[#F8F5EC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#1C1A1A]">Student Profile & Academic Transcript</h1>
          <p className="text-[#5E544A] text-xs mt-0.5">Manage your placement contact information, academic metrics, verified skills, and honors</p>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-xs font-bold text-[#5E544A] hover:bg-[#F8F5EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#E3D8C4] rounded-xl text-xs font-bold text-[#1C1A1A] hover:bg-[#F1E9D8] transition-colors shadow-2xs"
            >
              <Edit3 size={14} className="text-[#8B1A1A]" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Summary Card */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-[#F1E9D8] border border-[#E3D8C4] rounded-full flex items-center justify-center mx-auto text-2xl font-extrabold text-[#8B1A1A]">
                {initials}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="font-bold text-[#1C1A1A] text-lg">{displayName}</h2>
                <span title="Name is official and verified by University Registrar">
                  <Lock size={13} className="text-[#8B7B6F]" />
                </span>
              </div>
              <p className="text-[#5E544A] text-xs font-bold">{branch} • Class of {graduationYear}</p>
              <p className="text-[11px] text-[#8B7B6F] mt-0.5 flex items-center justify-center gap-1">
                <span>Enrollment No: <strong>{rollNo || '07114803121'}</strong></span>
                <span title="Enrollment number is locked">
                  <Lock size={11} className="text-[#8B7B6F]" />
                </span>
              </p>
            </div>

            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-[#F1E9D8] border border-[#E3D8C4] text-[#8B1A1A] rounded-full text-xs font-bold">
              <Star size={12} className="text-[#C8A243]" fill="currentColor" />
              <span>{parseFloat(cgpa) >= 8.5 ? 'Dream Offer Eligible' : 'Standard Placement Tier'} (CGPA: {cgpa})</span>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E3D8C4] space-y-3 text-left text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Email Address</label>
                <div className="flex items-center gap-2 text-[#5E544A]">
                  <Mail size={14} className="text-[#8B7B6F] shrink-0" />
                  {editing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@ipu.ac.in"
                      className="flex-1 border border-[#E3D8C4] rounded-lg px-2.5 py-1 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                    />
                  ) : (
                    <span className="font-semibold text-[#1C1A1A] truncate">{email || 'Not provided'}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Phone Number (10 Digits)</label>
                <div className="flex items-center gap-2 text-[#5E544A]">
                  <Phone size={14} className="text-[#8B7B6F] shrink-0" />
                  {editing ? (
                    <div className="flex-1 flex items-center">
                      <span className="px-2 py-1 bg-[#F1E9D8] border border-r-0 border-[#E3D8C4] rounded-l-lg text-[11px] font-bold text-[#5E544A]">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9811234567"
                        className="w-full border border-[#E3D8C4] rounded-r-lg px-2.5 py-1 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                      />
                    </div>
                  ) : (
                    <span className="font-semibold text-[#1C1A1A]">{phone ? `+91 ${phone}` : 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Placement Status Card */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-5 space-y-3">
            <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider">Placement Readiness</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#E3D8C4]">
                <span className="text-[#5E544A]">Resume Status:</span>
                <span className="px-2 py-0.5 bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] rounded-md font-bold text-[11px] flex items-center gap-1">
                  <Check size={11} /> Verified by TPO
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E3D8C4]">
                <span className="text-[#5E544A]">Placement Status:</span>
                <span className="px-2 py-0.5 bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] rounded-md font-bold text-[11px] uppercase">
                  {studentData?.student?.placementStatus || 'Active Candidate'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Tabs & Form */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Bio / Summary */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-6">
            <h3 className="font-bold text-sm text-[#1C1A1A] mb-2">Professional Summary</h3>
            {editing ? (
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional introduction highlight your strengths, technical expertise, and career aspirations..."
                className="w-full border border-[#E3D8C4] rounded-xl p-3 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-medium"
              />
            ) : (
              <p className="text-xs text-[#5E544A] leading-relaxed font-medium">
                {bio || "Final year student focused on building high-impact software systems, collaborating on cutting-edge industry challenges, and exploring modern distributed computing."}
              </p>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-2 flex gap-2">
            <button
              onClick={() => setActiveTab("academic")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "academic"
                  ? "bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] shadow-xs"
                  : "text-[#5E544A] hover:bg-[#F8F5EC]"
              }`}
            >
              Academic Transcript
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "skills"
                  ? "bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] shadow-xs"
                  : "text-[#5E544A] hover:bg-[#F8F5EC]"
              }`}
            >
              Skills & Stack ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "achievements"
                  ? "bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] shadow-xs"
                  : "text-[#5E544A] hover:bg-[#F8F5EC]"
              }`}
            >
              Honors & Certifications ({certifications.length + achievements.length})
            </button>
          </div>

          {/* TAB 1: Academic Transcript */}
          {activeTab === "academic" && (
            <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-6 space-y-4 animate-fade-in">
              <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider">Academic Performance Metrics</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Current CGPA</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full border border-[#E3D8C4] rounded-lg px-2.5 py-1 text-sm bg-white text-[#1C1A1A] font-bold focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                    />
                  ) : (
                    <p className="text-xl font-black text-[#8B1A1A]">{cgpa} <span className="text-xs text-[#8B7B6F] font-normal">/ 10</span></p>
                  )}
                </div>

                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Active Backlogs</label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={backlogs}
                      onChange={(e) => setBacklogs(Number(e.target.value))}
                      className="w-full border border-[#E3D8C4] rounded-lg px-2.5 py-1 text-sm bg-white text-[#1C1A1A] font-bold focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                    />
                  ) : (
                    <p className={`text-xl font-black ${backlogs === 0 ? "text-[#4A7C59]" : "text-[#C85555]"}`}>{backlogs}</p>
                  )}
                </div>

                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Engineering Branch</label>
                    <Lock size={12} className="text-[#8B7B6F]" />
                  </div>
                  <p className="text-base font-bold text-[#1C1A1A]">{branch}</p>
                  <p className="text-[10px] text-[#8B7B6F]">Fixed by Enrollment Record</p>
                </div>

                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Graduation Year</label>
                    <Lock size={12} className="text-[#8B7B6F]" />
                  </div>
                  <p className="text-base font-bold text-[#1C1A1A]">Class of {graduationYear}</p>
                  <p className="text-[10px] text-[#8B7B6F]">Fixed by University Registrar</p>
                </div>

                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Class 12th Percentage</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={class12}
                      onChange={(e) => setClass12(e.target.value)}
                      className="w-full border border-[#E3D8C4] rounded-lg px-2.5 py-1 text-sm bg-white text-[#1C1A1A] font-bold focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                    />
                  ) : (
                    <p className="text-base font-bold text-[#1C1A1A]">{class12}%</p>
                  )}
                </div>

                <div className="bg-[#F8F5EC] p-4 rounded-xl border border-[#E3D8C4]">
                  <label className="block text-[10px] font-bold text-[#8B7B6F] uppercase mb-1">Class 10th Percentage</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={class10}
                      onChange={(e) => setClass10(e.target.value)}
                      className="w-full border border-[#E3D8C4] rounded-lg px-2.5 py-1 text-sm bg-white text-[#1C1A1A] font-bold focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]"
                    />
                  ) : (
                    <p className="text-base font-bold text-[#1C1A1A]">{class10}%</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Skills & Tech Stack */}
          {activeTab === "skills" && (
            <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-6 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider">Technical Skills & Expertise</h3>
                  <p className="text-[11px] text-[#5E544A] mt-0.5">Skills verified and highlighted on your campus placement profile</p>
                </div>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. Next.js, PyTorch, GraphQL)..."
                  className="flex-1 border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-xs font-bold hover:bg-[#A63030] flex items-center gap-1 shadow-xs"
                >
                  <Plus size={14} /> Add Skill
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E9D8] text-[#1C1A1A] border border-[#E3D8C4] rounded-xl text-xs font-bold shadow-2xs group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#8B7B6F] hover:text-[#C85555] transition-colors p-0.5 rounded"
                      title={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <p className="text-xs text-[#8B7B6F] py-2">No technical skills added yet. Type above to add your primary stack.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Honors & Certifications */}
          {activeTab === "achievements" && (
            <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card p-6 space-y-6 animate-fade-in">
              {/* Certifications Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider">Professional Certifications</h3>
                  <button
                    onClick={() => setShowAddCertModal(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#8B1A1A] hover:text-[#A63030]"
                  >
                    <Plus size={13} /> Add Certificate
                  </button>
                </div>

                <div className="space-y-2">
                  {certifications.map((c, idx) => (
                    <div key={idx} className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center font-bold text-[10px] text-[#8B1A1A]">
                          {c.badge}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#1C1A1A]">{c.name}</p>
                          <p className="text-[11px] text-[#5E544A]">{c.issuer} • {c.year}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCert(idx)}
                        className="text-[#8B7B6F] hover:text-[#C85555] p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Honors & Achievements */}
              <div className="space-y-3 pt-4 border-t border-[#E3D8C4]">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider">Honors & Competitions</h3>
                  <button
                    onClick={() => setShowAddAchievementModal(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#8B1A1A] hover:text-[#A63030]"
                  >
                    <Plus size={13} /> Add Honor
                  </button>
                </div>

                <div className="space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="p-3 bg-[#F8F5EC] rounded-xl border border-[#E3D8C4] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1A1A]">
                        <Award size={15} className="text-[#C8A243] shrink-0" />
                        <span>{ach}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveAchievement(idx)}
                        className="text-[#8B7B6F] hover:text-[#C85555] p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Centered Popups */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] text-[#8B1A1A] flex items-center justify-center mx-auto mb-3 border border-[#E3D8C4]">
              {modalDialog.type === 'success' ? (
                <CheckCircle2 size={24} className="text-[#4A7C59]" />
              ) : (
                <AlertCircle size={24} className="text-[#C85555]" />
              )}
            </div>
            <h3 className="text-base font-bold text-[#1C1A1A] mb-1">{modalDialog.title}</h3>
            <p className="text-xs text-[#5E544A] mb-5 leading-relaxed font-medium">{modalDialog.message}</p>
            <button
              type="button"
              onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
              className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Add Cert Modal */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex justify-between items-center border-b border-[#E3D8C4] pb-3">
              <h3 className="font-bold text-sm text-[#1C1A1A]">Add Technical Certification</h3>
              <button onClick={() => setShowAddCertModal(false)} className="text-[#8B7B6F] hover:text-[#1C1A1A]"><X size={16} /></button>
            </div>

            <form onSubmit={handleAddCert} className="space-y-3">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Kubernetes Administrator (CKA)"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Issuing Authority / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linux Foundation / CNCF"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold shadow-xs"
                >
                  Add Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex justify-between items-center border-b border-[#E3D8C4] pb-3">
              <h3 className="font-bold text-sm text-[#1C1A1A]">Add Honor or Award</h3>
              <button onClick={() => setShowAddAchievementModal(false)} className="text-[#8B7B6F] hover:text-[#1C1A1A]"><X size={16} /></button>
            </div>

            <form onSubmit={handleAddAchievement} className="space-y-3">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Achievement Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner of IPU National Hackathon 2026"
                  value={newAchievementInput}
                  onChange={(e) => setNewAchievementInput(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 bg-[#F8F5EC] text-[#1C1A1A] focus:outline-none focus:ring-1 focus:ring-[#8B1A1A] font-semibold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAchievementModal(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold shadow-xs"
                >
                  Add Honor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
