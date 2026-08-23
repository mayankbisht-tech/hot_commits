'use client';

import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Brain, 
  ArrowRight, ShieldCheck, ExternalLink, Loader2, Award, Zap, Code, BookOpen,
  Building2, MapPin, Check, Filter
} from 'lucide-react';
import { fetcher } from '@/lib/api-client';

interface DrivePrediction {
  driveId: string;
  companyName: string;
  companyLogo?: string;
  tier: string;
  role: string;
  ctc: number;
  location: string;
  minCGPA: number;
  eligible: boolean;
  placement_probability: number;
  predicted_placed: boolean;
  matched_skills: string[];
  missing_skills: string[];
  top_factors: string[];
}

export default function ResumePredictionPage() {
  const { data: studentData } = useSWR<any>('/api/students/me', fetcher);
  const { data: initialCachedData } = useSWR<any>('/api/resume/upload', fetcher);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [predictionDataState, setPredictionDataState] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const predictionData = predictionDataState || initialCachedData;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPredictionDataState(null);
      setErrorMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setPredictionDataState(null);
      setErrorMessage('');
    }
  };

  const handleRunPipeline = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a resume file (PDF, DOCX, TXT) to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadProgress(50);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setUploadProgress(85);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume and evaluate job descriptions.');
      }

      setUploadProgress(100);
      setPredictionDataState(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while evaluating company job predictions.');
    } finally {
      setIsUploading(false);
    }
  };

  const student = studentData?.student;
  const currentResumeUrl = predictionData?.resumeUrl || student?.resumeUrl;
  const drivePredictions: DrivePrediction[] = predictionData?.drivePredictions || [];

  const filteredPredictions = drivePredictions.filter(d => {
    if (filterTier === 'ALL') return true;
    if (filterTier === 'TIER_1') return d.tier === 'TIER_1' || d.ctc >= 15;
    if (filterTier === 'TIER_2') return d.tier === 'TIER_2' || (d.ctc >= 7 && d.ctc < 15);
    return true;
  });

  const getProbColor = (val: number) => {
    if (val >= 80) return 'text-[#4A7C59]';
    if (val >= 60) return 'text-[#C8A243]';
    return 'text-[#C85555]';
  };

  const getProbBadge = (val: number) => {
    if (val >= 80) return 'bg-[#EAF3EC] text-[#4A7C59] border-[#B2D8BB]';
    if (val >= 60) return 'bg-[#FCF7E8] text-[#C8A243] border-[#F2DEB0]';
    return 'bg-[#FDF0F0] text-[#C85555] border-[#F4C7C7]';
  };

  const avgProb = drivePredictions.length > 0
    ? Math.round(drivePredictions.reduce((acc, d) => acc + d.placement_probability, 0) / drivePredictions.length)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in select-none bg-[#F8F5EC] text-[#1C1A1A]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3D8C4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#8B1A1A] text-white flex items-center gap-1 shadow-xs">
              <Brain size={11} /> Job-Specific ML Predictor
            </span>
            <span className="text-xs font-bold text-[#8B7B6F]">Resume + Profile Dual Extraction</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1C1A1A] mt-1">Multi-Company Job Description ML Pipeline</h1>
          <p className="text-[#5E544A] text-xs sm:text-sm mt-0.5 font-medium">
            Upload your real-time resume to Cloudinary. We combine all skills from your resume AND profile to generate job-specific placement probabilities against every campus drive.
          </p>
        </div>

        {currentResumeUrl && (
          <a
            href={currentResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F1E9D8] hover:bg-[#E8DCC4] text-[#8B1A1A] border border-[#E3D8C4] rounded-xl text-xs font-bold transition-all shrink-0"
          >
            <FileText size={14} />
            <span>View Cloudinary Resume</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Upload Card & Skills Deck */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cloudinary Drag & Drop Uploader */}
          <div className="bg-white rounded-2xl border border-[#E3D8C4] p-6 shadow-card space-y-4">
            <h2 className="text-xs font-bold text-[#1C1A1A] uppercase tracking-wider">
              1. Upload Real-Time Resume
            </h2>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile 
                  ? 'border-[#8B1A1A] bg-[#FFFBF0]' 
                  : 'border-[#E3D8C4] hover:border-[#8B1A1A] hover:bg-[#F8F5EC]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Upload size={24} />
              </div>

              {selectedFile ? (
                <div>
                  <p className="font-bold text-sm text-[#1C1A1A] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[#4A7C59] font-bold mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Analysis
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-[11px] text-[#C85555] font-bold underline mt-2 inline-block"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-xs text-[#1C1A1A]">
                    Drag & Drop your resume here or <span className="text-[#8B1A1A] underline">Browse</span>
                  </p>
                  <p className="text-[11px] text-[#8B7B6F] mt-1 font-medium">
                    Supports PDF, DOCX, and TXT format (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-3 bg-[#FDF0F0] border border-[#F4C7C7] text-[#C85555] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#5E544A]">
                  <span>Parsing Resume & Evaluating Job Descriptions...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1E9D8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8B1A1A] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              disabled={isUploading || !selectedFile}
              onClick={handleRunPipeline}
              className="w-full py-3 bg-[#8B1A1A] hover:bg-[#A63030] disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Evaluating Every Job Description...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Run Pipeline Against All Job Drives</span>
                </>
              )}
            </button>
          </div>

          {/* Combined Candidate Skills Deck */}
          {predictionData && (
            <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card space-y-3 animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#E3D8C4] pb-2">
                <h3 className="font-bold text-xs text-[#1C1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Code size={14} className="text-[#8B1A1A]" />
                  Combined Skill Portfolio
                </h3>
                <span className="text-[10px] bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] px-2 py-0.5 rounded-full font-bold">
                  {predictionData.allCombinedSkills?.length || 0} Total Skills
                </span>
              </div>
              <p className="text-[11px] text-[#5E544A] font-medium">
                Merged dynamically from your <strong>Resume Text Stream</strong> and <strong>Student Profile Record</strong>:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {predictionData.allCombinedSkills?.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 bg-[#F8F5EC] text-[#1C1A1A] border border-[#E3D8C4] rounded-lg text-xs font-bold shadow-2xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Drive-by-Drive Placement Probability Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {predictionData ? (
            <div className="space-y-5 animate-fade-in">
              {/* Summary Stats Header */}
              <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#F8F5EC]">
                <div>
                  <h2 className="font-bold text-base text-[#1C1A1A]">
                    Campus Placement Probability Matrix
                  </h2>
                  <p className="text-xs text-[#5E544A] mt-0.5 font-medium">
                    Evaluated candidate against <strong>{drivePredictions.length} Active Job Descriptions</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E3D8C4] text-center">
                    <p className="text-[9px] uppercase font-bold text-[#8B7B6F]">Average Chance</p>
                    <p className={`text-base font-black ${getProbColor(avgProb)}`}>{avgProb}%</p>
                  </div>

                  <div className="flex bg-[#F1E9D8] p-1 rounded-xl border border-[#E3D8C4] text-xs font-bold">
                    <button
                      onClick={() => setFilterTier('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${filterTier === 'ALL' ? 'bg-white text-[#8B1A1A]' : 'text-[#5E544A]'}`}
                    >
                      All ({drivePredictions.length})
                    </button>
                    <button
                      onClick={() => setFilterTier('TIER_1')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${filterTier === 'TIER_1' ? 'bg-white text-[#8B1A1A]' : 'text-[#5E544A]'}`}
                    >
                      Tier-1 (&gt;15L)
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Job Drive Predictions List */}
              <div className="space-y-4">
                {filteredPredictions.map((dp) => (
                  <div key={dp.driveId} className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card space-y-4 transition-all hover:shadow-md">
                    {/* Company & Role Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#F1E9D8] border border-[#E3D8C4] rounded-xl flex items-center justify-center font-extrabold text-[#8B1A1A] text-base shrink-0">
                          {dp.companyLogo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#1C1A1A] text-sm">{dp.role}</h3>
                            <span className="px-2 py-0.5 bg-[#F1E9D8] text-[#8B1A1A] rounded-full text-[10px] font-bold border border-[#E3D8C4]">
                              {dp.tier}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#5E544A] mt-0.5">{dp.companyName}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[#8B7B6F] mt-1 font-semibold">
                            <span className="text-[#8B1A1A] font-bold">₹{dp.ctc} LPA</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {dp.location}</span>
                            <span>•</span>
                            <span>Min CGPA: {dp.minCGPA}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right shrink-0">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black border inline-block ${getProbBadge(dp.placement_probability)}`}>
                          {dp.placement_probability}% Placement Chance
                        </span>
                        <p className="text-[10px] text-[#8B7B6F] mt-1 font-bold">
                          {dp.predicted_placed ? 'PLACED CANDIDATE ✓' : 'NEEDS PREPARATION'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-[#F1E9D8] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            dp.placement_probability >= 80 ? 'bg-[#4A7C59]' : dp.placement_probability >= 60 ? 'bg-[#C8A243]' : 'bg-[#C85555]'
                          }`}
                          style={{ width: `${dp.placement_probability}%` }}
                        />
                      </div>
                    </div>

                    {/* Matched vs Missing Skill Breakdown for this specific JD */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E3D8C4] text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-[#4A7C59] uppercase mb-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Matched Required Skills ({dp.matched_skills.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {dp.matched_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-[#EAF3EC] text-[#4A7C59] border border-[#B2D8BB] rounded text-[11px] font-bold">
                              {s} ✓
                            </span>
                          ))}
                          {dp.matched_skills.length === 0 && <span className="text-[#8B7B6F] text-[11px]">None</span>}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-[#C85555] uppercase mb-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Missing Skills ({dp.missing_skills.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {dp.missing_skills.map((s) => (
                            <Link
                              key={s}
                              href={`/student/training?skill=${encodeURIComponent(s)}`}
                              className="px-2 py-0.5 bg-[#FDF0F0] text-[#C85555] border border-[#F4C7C7] rounded text-[11px] font-bold hover:bg-[#FCE2E2] transition-colors"
                              title={`Click to enroll in training for ${s}`}
                            >
                              + {s} (Enroll)
                            </Link>
                          ))}
                          {dp.missing_skills.length === 0 && <span className="text-[#4A7C59] text-[11px] font-bold">All Required Skills Matched!</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Initial State */
            <div className="bg-white rounded-2xl border border-[#E3D8C4] p-12 text-center shadow-card space-y-4">
              <div className="w-16 h-16 bg-[#F1E9D8] text-[#8B1A1A] border border-[#E3D8C4] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                <Brain size={28} />
              </div>
              <h2 className="text-base font-bold text-[#1C1A1A]">No Job Description Predictions Calculated Yet</h2>
              <p className="text-xs text-[#5E544A] max-w-md mx-auto leading-relaxed font-medium">
                Upload your resume using the form on the left. We will extract all skills from your resume and student profile, and evaluate your placement chances against every active company drive (Microsoft, Amazon, Atlassian, TCS, etc.).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
