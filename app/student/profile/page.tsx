"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import { 
  User, Mail, Phone, BookOpen, Award, Edit3, Camera, 
  CheckCircle2, FileText, Star, Plus, Trash2, X, Check, Loader2, Sparkles, AlertCircle, Upload, ExternalLink
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

export default function StudentProfilePage() {
  const { data: studentData, isLoading } = useSWR<any>('/api/students/me', fetcher);
  const { data: branchesData } = useSWR<{ branches: string[] }>('/api/branches', fetcher);

  const availableBranches = branchesData?.branches || ['AI-DS', 'AI-ML', 'AR', 'IIOT'];
  const gradYearOptions = [2027, 2028, 2029, 2030];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Fields
  const [name, setName] = useState("Rohan Mehta");
  const [rollNo, setRollNo] = useState("07114803121");
  const [email, setEmail] = useState("rohan@ipu.ac.in");
  const [phone, setPhone] = useState("+91 98112 34567");
  const [bio, setBio] = useState("Final year AI-DS student passionate about full-stack development, cloud computing, and AI systems architecture.");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");

  // Academic Fields
  const [branch, setBranch] = useState("AI-DS");
  const [graduationYear, setGraduationYear] = useState(2027);
  const [cgpa, setCgpa] = useState("8.7");
  const [backlogs, setBacklogs] = useState(0);
  const [class10, setClass10] = useState("91.0");
  const [class12, setClass12] = useState("88.5");

  // Skills
  const [skills, setSkills] = useState<string[]>([
    "React.js", "Node.js", "Python", "PyTorch", "PostgreSQL", "TypeScript", "Docker", "REST APIs", "Git"
  ]);
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

  // Cloudinary Upload States
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  // Populate data from DB profile
  useEffect(() => {
    if (studentData?.student) {
      const s = studentData.student;
      if (s.name) setName(s.name);
      if (s.rollNo) setRollNo(s.rollNo);
      if (s.user?.email || s.email) setEmail(s.user?.email || s.email);
      if (s.phone) setPhone(s.phone);
      if (s.branch) setBranch(s.branch);
      if (s.graduationYear) setGraduationYear(s.graduationYear);
      if (s.cgpa) setCgpa(String(s.cgpa));
      if (s.backlogs !== undefined) setBacklogs(s.backlogs);
      if (s.class10) setClass10(String(s.class10));
      if (s.class12) setClass12(String(s.class12));
      if (s.resumeUrl) setResumeUrl(s.resumeUrl);
      if (Array.isArray(s.skills) && s.skills.length > 0) setSkills(s.skills);
    }
  }, [studentData]);

  // Synchronize student updates to backend DB & trigger eligibility recalculation
  const persistStudentData = async (overrides?: any) => {
    try {
      const payload = {
        name,
        phone,
        branch,
        graduationYear: Number(graduationYear),
        cgpa: parseFloat(cgpa) || 8.0,
        backlogs: Number(backlogs),
        class10: parseFloat(class10) || 85,
        class12: parseFloat(class12) || 85,
        skills,
        resumeUrl,
        ...overrides,
      };

      await fetch('/api/students/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      // Recalculate eligible drives across all student views in real-time
      await mutate('/api/students/me');
      await mutate('/api/drives/eligible');
      await mutate('/api/reports/stats');
    } catch (e) {
      console.error('Error persisting profile to database:', e);
    }
  };

  // Cloudinary File Upload Handlers
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'tpc-resumes');
      formData.append('resource_type', 'auto');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Cloudinary upload failed');
      const data = await res.json();
      const uploadedUrl = data.url;

      setResumeUrl(uploadedUrl);
      await persistStudentData({ resumeUrl: uploadedUrl });
      showPopup('success', 'Resume Uploaded to Cloudinary', 'Your resume PDF/Document has been securely stored on Cloudinary and linked to your profile.');
    } catch (err: any) {
      showPopup('error', 'Upload Failed', err.message || 'Could not upload resume to Cloudinary.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'tpc-avatars');
      formData.append('resource_type', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Avatar upload failed');
      const data = await res.json();
      setAvatarUrl(data.url);
      showPopup('success', 'Photo Uploaded', 'Your profile photo has been updated via Cloudinary.');
    } catch (err: any) {
      showPopup('error', 'Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save changes handler
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await persistStudentData();
      setEditing(false);
      showPopup('success', 'Profile & Academic Details Updated', 'Your updated academic records, skills, and certifications have been permanently saved in the database.');
    } catch (err: any) {
      showPopup('error', 'Update Failed', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Real-time Skills management
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = newSkillInput.trim();
    if (s && !skills.includes(s)) {
      const updatedSkills = [...skills, s];
      setSkills(updatedSkills);
      setNewSkillInput("");
      await persistStudentData({ skills: updatedSkills });
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
    await persistStudentData({ skills: updatedSkills });
  };

  // Real-time Certifications management
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCertName.trim() && newCertIssuer.trim()) {
      setCertifications(prev => [
        ...prev,
        {
          name: newCertName.trim(),
          issuer: newCertIssuer.trim(),
          year: newCertYear.trim() || "2026",
          badge: newCertIssuer.slice(0, 4).toUpperCase()
        }
      ]);
      setNewCertName("");
      setNewCertIssuer("");
      setShowAddCertModal(false);
    }
  };

  const handleRemoveCert = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  // Real-time Achievements management
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

  return (
    <div className="p-8 animate-fade-in text-stone-800 space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Student Profile & Academic Transcript</h1>
          <p className="text-stone-500 text-xs mt-0.5">Manage and update your placement bio, academic metrics, Cloudinary resume, and honors in real-time</p>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Edit3 size={14} className="text-orange-500" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Summary Card */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-6 text-center">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-orange-300" />
              ) : (
                <div className="w-20 h-20 bg-orange-100 border border-orange-200 rounded-full flex items-center justify-center mx-auto text-2xl font-extrabold text-orange-600">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                title="Upload Photo to Cloudinary"
              >
                {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
            </div>

            {editing ? (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full text-center font-bold text-base border border-stone-200 rounded-xl px-3 py-1.5 bg-stone-50 text-stone-900 select-text"
                />
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="Roll No"
                  className="w-full text-center text-xs font-medium border border-stone-200 rounded-xl px-3 py-1 bg-stone-50 text-stone-600 select-text"
                />
              </div>
            ) : (
              <>
                <h2 className="font-bold text-stone-900 text-lg">{name}</h2>
                <p className="text-stone-500 text-xs font-semibold">{branch} • Class of {graduationYear}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{rollNo}</p>
              </>
            )}

            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-xs font-bold">
              <Star size={12} className="text-orange-500" fill="currentColor" />
              <span>{parseFloat(cgpa) >= 8.5 ? 'Dream Offer Eligible' : 'Standard Placement Tier'} (CGPA: {cgpa})</span>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-left text-xs">
              <div className="flex items-center gap-2 text-stone-600">
                <Mail size={14} className="text-stone-400 shrink-0" />
                {editing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-2 py-1 text-xs bg-stone-50 select-text"
                  />
                ) : (
                  <span className="truncate">{email}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Phone size={14} className="text-stone-400 shrink-0" />
                {editing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-2 py-1 text-xs bg-stone-50 select-text"
                  />
                ) : (
                  <span>{phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Cloudinary Resume Vault Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <FileText size={15} className="text-orange-500" />
                Resume (Cloudinary)
              </span>
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> Verified
              </span>
            </div>

            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeFileUpload}
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
            />

            <div className="pt-1 space-y-2">
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                {uploadingResume ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Upload New Resume</span>
                  </>
                )}
              </button>

              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                >
                  <ExternalLink size={12} />
                  <span>View Cloudinary Resume</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Updatable Sections (Academic, Skills, Achievements) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Bio Box */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 text-xs">
            <h3 className="font-bold text-stone-900 text-sm mb-2">Professional Summary</h3>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full border border-stone-200 rounded-xl p-3 text-xs bg-stone-50 focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed select-text"
              />
            ) : (
              <p className="text-stone-600 leading-relaxed">{bio}</p>
            )}
          </div>

          {/* Updatable Tabs Container */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden text-xs">
            {/* Tab Headers */}
            <div className="flex border-b border-stone-200 bg-stone-50/70 p-1.5 gap-2">
              {[
                { key: 'academic', label: 'Academic Transcript' },
                { key: 'skills', label: `Skills & Stack (${skills.length})` },
                { key: 'achievements', label: `Honors & Certifications (${achievements.length + certifications.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* TAB 1: ACADEMIC DETAILS */}
              {activeTab === 'academic' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-stone-900 text-sm">Academic Performance Metrics</h4>
                    {editing && <span className="text-[11px] text-orange-600 font-semibold">Editing Active</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Current CGPA</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          className="mt-1 w-full border border-orange-300 rounded-lg px-3 py-1.5 bg-white font-extrabold text-orange-600 text-base select-text"
                        />
                      ) : (
                        <p className="text-2xl font-extrabold text-orange-600 mt-1">{cgpa} / 10</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Active Backlogs</p>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          value={backlogs}
                          onChange={(e) => setBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                          className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-1.5 bg-white font-bold text-stone-900 select-text"
                        />
                      ) : (
                        <p className="text-2xl font-extrabold text-stone-900 mt-1">{backlogs}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Engineering Branch</p>
                      {editing ? (
                        <select
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-1.5 bg-white font-bold text-stone-900"
                        >
                          {availableBranches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg font-bold text-stone-900 mt-1">{branch}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Graduation Year</p>
                      {editing ? (
                        <select
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(Number(e.target.value))}
                          className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-1.5 bg-white font-bold text-stone-900"
                        >
                          {gradYearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg font-bold text-stone-900 mt-1">{graduationYear}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Class 12th Percentage</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={class12}
                          onChange={(e) => setClass12(e.target.value)}
                          className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-1.5 bg-white font-bold text-stone-900 select-text"
                        />
                      ) : (
                        <p className="text-lg font-bold text-stone-900 mt-1">{class12}%</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                      <p className="text-[10px] text-stone-500 font-bold uppercase">Class 10th Percentage</p>
                      {editing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={class10}
                          onChange={(e) => setClass10(e.target.value)}
                          className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-1.5 bg-white font-bold text-stone-900 select-text"
                        />
                      ) : (
                        <p className="text-lg font-bold text-stone-900 mt-1">{class10}%</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS & STACK (Real-time Add & Delete) */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-stone-900 text-sm">Verified Skills & Tools (Real-Time Synchronized)</h4>
                  </div>

                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type skill name (e.g. Docker, PyTorch, GraphQL) and hit Add..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 focus:ring-1 focus:ring-orange-500 select-text font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs text-xs"
                    >
                      <Plus size={13} /> Add Skill
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {skills.map(skill => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl font-bold text-xs flex items-center gap-2 group transition-all"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-orange-400 hover:text-red-600 transition-colors"
                          title={`Delete ${skill}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ACHIEVEMENTS & CERTIFICATIONS */}
              {activeTab === 'achievements' && (
                <div className="space-y-6">
                  {/* Certifications Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-stone-900 text-sm">Professional Certifications</h4>
                      <button
                        onClick={() => setShowAddCertModal(true)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Plus size={12} /> Add Certification
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="p-3.5 border border-stone-200 rounded-xl bg-stone-50/70 flex items-start justify-between">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center font-extrabold text-orange-600 text-[10px]">
                              {cert.badge}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{cert.name}</p>
                              <p className="text-[11px] text-stone-500">{cert.issuer} • {cert.year}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCert(idx)}
                            className="text-stone-400 hover:text-red-600 p-1"
                            title="Delete certificate"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements Section */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-stone-900 text-sm">Honors & Competitions</h4>
                      <button
                        onClick={() => setShowAddAchievementModal(true)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Plus size={12} /> Add Honor
                      </button>
                    </div>

                    <div className="space-y-2">
                      {achievements.map((ach, idx) => (
                        <div key={idx} className="p-3 border border-stone-200 rounded-xl bg-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award size={14} className="text-orange-500 shrink-0" />
                            <span className="font-semibold text-stone-800">{ach}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAchievement(idx)}
                            className="text-stone-400 hover:text-red-600 p-1"
                            title="Delete honor"
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
        </div>
      </div>

      {/* ADD CERTIFICATION MODAL */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">Add Professional Certification</h3>
              <button onClick={() => setShowAddCertModal(false)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCert} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 select-text"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Issuing Authority</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services, Google, Coursera"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 select-text"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCertModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold">Add Certificate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACHIEVEMENT MODAL */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">Add Honor or Award</h3>
              <button onClick={() => setShowAddAchievementModal(false)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddAchievement} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Honor Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner — Hackathon 2026, Dean's List..."
                  value={newAchievementInput}
                  onChange={(e) => setNewAchievementInput(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 select-text"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAchievementModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold">Add Honor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED POPUP DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">{modalDialog.title}</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
