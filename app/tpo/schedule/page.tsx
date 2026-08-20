'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Search, Sliders, Clock, Save, ChevronLeft, ChevronRight, X, Plus, 
  Trash2, Building2, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Users, Loader2, Sparkles, Check, Edit3
} from 'lucide-react';
import { fetcher, apiCreateDrive, apiUpdateDrive } from '@/lib/api-client';

interface CompanyItem {
  id: string;
  name: string;
  tier?: string;
  industry?: string;
}

interface DriveItem {
  id: string;
  role: string;
  ctc: number;
  location: string;
  mode: string;
  driveDate: string;
  status: string;
  approvalStatus: string;
  minCGPA: number;
  maxBacklogs: number;
  branches: string[];
  gradYears: number[];
  company?: { name: string; tier: string };
  _count?: { applications: number };
}

export default function SchedulePage() {
  const { data: companiesData } = useSWR<{ companies: CompanyItem[] }>('/api/companies', fetcher);
  const { data: drivesData, isLoading } = useSWR<{ drives: DriveItem[] }>('/api/drives', fetcher, { refreshInterval: 2000 });

  const [searchCompany, setSearchCompany] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [roleTitle, setRoleTitle] = useState('Senior Software Engineer');
  const [ctc, setCtc] = useState('16.0');
  const [location, setLocation] = useState('Bengaluru / Remote');
  const [mode, setMode] = useState('HYBRID');
  const [driveDateStr, setDriveDateStr] = useState('2024-11-20');

  const [minCgpa, setMinCgpa] = useState<number>(7.5);
  const [maxBacklogs, setMaxBacklogs] = useState<number>(0);
  const [class12, setClass12] = useState<number>(75);
  const [class10, setClass10] = useState<number>(75);
  
  // Dynamic Graduation Years (Requirement 7)
  const [availableYears, setAvailableYears] = useState<string[]>(['2027', '2028', '2029', '2030']);
  const [selectedYears, setSelectedYears] = useState<string[]>(['2027', '2028', '2029', '2030']);
  const [newYearInput, setNewYearInput] = useState('');
  const [showAddYear, setShowAddYear] = useState(false);

  // Dynamic Eligible Branches (AI-DS, AI-ML, AR, IIOT with persistent add/remove)
  const { data: branchesData } = useSWR<{ branches: string[] }>('/api/branches', fetcher);
  const availableBranches = branchesData?.branches || ['AI-DS', 'AI-ML', 'AR', 'IIOT'];
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['AI-DS', 'AI-ML', 'AR', 'IIOT']);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showAddBranch, setShowAddBranch] = useState(false);

  const [policy, setPolicy] = useState<string>('STANDARD');
  const [saving, setSaving] = useState(false);

  // Interactive Dynamic Calendar state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [approvingDriveId, setApprovingDriveId] = useState<string | null>(null);

  // Edit and Delete Drive States (Requirement 1)
  const [editingDrive, setEditingDrive] = useState<DriveItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Custom UI Dialog Modal (Requirement 5)
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showPopup = (type: 'success' | 'error', title: string, message: string) => {
    setModalDialog({ isOpen: true, type, title, message });
  };

  const companiesList: CompanyItem[] = companiesData?.companies || [];
  const allDrives: DriveItem[] = drivesData?.drives || [];

  // Branch handlers (Add and Remove across entire website)
  const toggleBranch = (b: string) => {
    setSelectedBranches(prev => 
      prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]
    );
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchName = newBranchInput.trim().toUpperCase();
    if (branchName) {
      try {
        await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: branchName }),
          credentials: 'include'
        });
        await mutate('/api/branches');
        setSelectedBranches(prev => [...prev, branchName]);
        setNewBranchInput('');
        setShowAddBranch(false);
        showPopup('success', 'Branch Added', `Branch ${branchName} successfully added to university branches.`);
      } catch (err: any) {
        showPopup('error', 'Add Failed', err.message || 'Could not add branch.');
      }
    }
  };

  const handleDeleteBranch = async (branchToDelete: string) => {
    try {
      await fetch(`/api/branches?branch=${encodeURIComponent(branchToDelete)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await mutate('/api/branches');
      setSelectedBranches(prev => prev.filter(b => b !== branchToDelete));
      showPopup('success', 'Branch Removed', `Branch ${branchToDelete} successfully removed from active branches.`);
    } catch (err: any) {
      showPopup('error', 'Delete Failed', err.message || 'Could not remove branch.');
    }
  };

  // Year handlers
  const toggleYear = (y: string) => {
    setSelectedYears(prev => 
      prev.includes(y) ? prev.filter(item => item !== y) : [...prev, y]
    );
  };

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const yearStr = newYearInput.trim();
    if (yearStr && !availableYears.includes(yearStr)) {
      setAvailableYears(prev => [...prev, yearStr]);
      setSelectedYears(prev => [...prev, yearStr]);
      setNewYearInput('');
      setShowAddYear(false);
    }
  };

  const handleDeleteYear = (yearToDelete: string) => {
    setAvailableYears(prev => prev.filter(y => y !== yearToDelete));
    setSelectedYears(prev => prev.filter(y => y !== yearToDelete));
  };

  // Target Company search
  const filteredCompanies = companiesList.filter(c => 
    c.name.toLowerCase().includes(searchCompany.toLowerCase())
  );

  // Dynamic Calendar Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Real-time Save to Database
  const handleSaveConfig = async () => {
    const targetComp = selectedCompany || companiesList[0];
    if (!targetComp) {
      showPopup('error', 'Select Company', 'Please select a target recruiting company.');
      return;
    }

    setSaving(true);
    try {
      const scheduledDriveDate = new Date(driveDateStr);

      await apiCreateDrive({
        companyId: targetComp.id,
        role: roleTitle.trim() || 'Software Engineer',
        ctc: parseFloat(ctc) || 12,
        location: location.trim() || 'New Delhi',
        mode: mode.toUpperCase(),
        deadline: new Date(scheduledDriveDate.getTime() - 3 * 86400000).toISOString(),
        driveDate: scheduledDriveDate.toISOString(),
        description: `Scheduled drive for ${targetComp.name}`,
        minCGPA: Number(minCgpa),
        maxBacklogs: Number(maxBacklogs),
        minClass10: Number(class10),
        minClass12: Number(class12),
        offerPolicy: policy,
        branches: selectedBranches,
        gradYears: selectedYears.map(y => parseInt(y)).filter(Boolean),
        rounds: ['Coding Assessment', 'System Design Interview', 'HR Round'],
      });

      await mutate('/api/drives');
      await mutate('/api/reports/stats');
      showPopup('success', 'Drive Saved', `Placement drive for ${targetComp.name} successfully scheduled and synced on the live calendar!`);
    } catch (err: any) {
      showPopup('error', 'Schedule Failed', err.message || 'Failed to save drive configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Drive Modal (Requirement 1)
  const openEditModal = (drive: DriveItem) => {
    setEditingDrive(drive);
    setRoleTitle(drive.role);
    setCtc(String(drive.ctc));
    setLocation(drive.location || 'New Delhi');
    setMode(drive.mode || 'HYBRID');
    setMinCgpa(drive.minCGPA || 7.0);
    setMaxBacklogs(drive.maxBacklogs || 0);
    setDriveDateStr(drive.driveDate ? drive.driveDate.split('T')[0] : '2024-11-20');
    setSelectedBranches(drive.branches || ['CSE', 'IT']);
    setIsEditModalOpen(true);
  };

  // Handle Update Drive (Requirement 1)
  const handleUpdateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrive) return;
    setSaving(true);
    try {
      await apiUpdateDrive(editingDrive.id, {
        role: roleTitle.trim(),
        ctc: parseFloat(ctc) || 12,
        location: location.trim(),
        mode: mode.toUpperCase(),
        minCGPA: Number(minCgpa),
        maxBacklogs: Number(maxBacklogs),
        driveDate: new Date(driveDateStr).toISOString(),
        branches: selectedBranches,
      });

      setIsEditModalOpen(false);
      setEditingDrive(null);
      await mutate('/api/drives');
      await mutate('/api/reports/stats');
      showPopup('success', 'Drive Updated', 'Placement drive details updated successfully.');
    } catch (err: any) {
      showPopup('error', 'Update Failed', err.message || 'Could not update drive.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Drive (Requirement 1)
  const promptDeleteDrive = (drive: DriveItem) => {
    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Placement Drive?',
      message: `Permanently delete "${drive.role}" (${drive.company?.name || 'Company'})? All application records will be purged.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/drives/${drive.id}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) throw new Error('Failed to delete drive');
          await mutate('/api/drives');
          await mutate('/api/reports/stats');
          await mutate('/api/notifications');
          showPopup('success', 'Drive Deleted', 'Placement drive removed successfully.');
        } catch (err: any) {
          showPopup('error', 'Delete Failed', err.message || 'Could not delete drive.');
        }
      }
    });
  };

  // Approve pending company drive from calendar modal
  const handleApproveDrive = async (driveId: string) => {
    setApprovingDriveId(driveId);
    try {
      await apiUpdateDrive(driveId, { approvalStatus: 'APPROVED' });
      await mutate('/api/drives');
      await mutate('/api/reports/stats');
      await mutate('/api/notifications');
      showPopup('success', 'Drive Approved', 'Company drive approved and marked ACTIVE on the live calendar!');
    } catch (e: any) {
      showPopup('error', 'Approval Failed', e.message || 'Failed to approve drive.');
    } finally {
      setApprovingDriveId(null);
    }
  };

  // Day click on calendar
  const handleDayClick = (dayNum: number) => {
    setSelectedDay(dayNum);
    const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setDriveDateStr(dateFormatted);
    setShowScheduleModal(true);
  };

  const getDrivesForDay = (day: number) => {
    return allDrives.filter(d => {
      if (!d.driveDate) return false;
      const dDate = new Date(d.driveDate);
      return dDate.getFullYear() === year && dDate.getMonth() === month && dDate.getDate() === day;
    });
  };

  const dayDrivesForModal = selectedDay ? getDrivesForDay(selectedDay) : [];

  return (
    <div className="flex h-full w-full bg-[#FFFAF6] overflow-hidden text-stone-800 animate-fade-in select-none">
      {/* Left Panel */}
      <div className="w-[390px] bg-white border-r border-stone-200 overflow-y-auto shrink-0 flex flex-col h-full shadow-xs z-10 select-none">
        <div className="p-5 border-b border-stone-100 sticky top-0 bg-white z-20 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-stone-900 select-none">Placement Drive Configuration</h1>
            <p className="text-xs text-stone-500 mt-0.5">Rules gating & live eligibility calculation</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} /> Live Sync
          </span>
        </div>

        <div className="p-5 space-y-5 flex-1 text-xs">
          {/* Card 1: Target Company */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">1. Target Company *</span>
              {selectedCompany && (
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="text-stone-400 hover:text-red-600 text-[11px] flex items-center gap-1 font-semibold"
                >
                  Change
                </button>
              )}
            </div>
            
            {!selectedCompany ? (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search registered recruiting companies..."
                  className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-stone-50 select-text"
                  value={searchCompany}
                  onChange={(e) => {
                    setSearchCompany(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-stone-100">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map(company => (
                        <button
                          key={company.id}
                          type="button"
                          className="w-full text-left px-3.5 py-2 hover:bg-orange-50/80 flex items-center justify-between text-xs"
                          onClick={() => {
                            setSelectedCompany(company);
                            setSearchCompany('');
                            setShowDropdown(false);
                          }}
                        >
                          <span className="font-semibold text-stone-800">{company.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono uppercase">
                            {company.tier || 'Tier-2'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-stone-400 text-center text-xs">No matching companies found</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900 text-xs">{selectedCompany.name}</p>
                  <p className="text-[10px] text-stone-500">{selectedCompany.industry || 'Technology'} • {selectedCompany.tier || 'Tier-1'}</p>
                </div>
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Role & CTC */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">2. Role & Remuneration</span>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Role Title</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-stone-50 font-semibold select-text"
                  placeholder="e.g. SDE-1 / Data Analyst"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">CTC Package (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ctc}
                    onChange={e => setCtc(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-stone-50 font-bold text-orange-600 select-text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Drive Date</label>
                  <input
                    type="date"
                    value={driveDateStr}
                    onChange={e => setDriveDateStr(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-stone-50 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Eligibility */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">3. Academic Gating</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-700">Minimum CGPA</span>
                <span className="text-orange-600 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-xs">
                  {minCgpa.toFixed(1)} / 10
                </span>
              </div>
              <input 
                type="range" 
                min="0" max="10" step="0.1" 
                value={minCgpa}
                onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-stone-200 rounded-lg cursor-pointer" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-stone-700">Max Active Backlogs Allowed</label>
              <input 
                type="number"
                min={0}
                step={1}
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-stone-50 select-text"
                placeholder="0"
              />
            </div>
          </div>

          {/* Dynamic Branches */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">4. Eligible Branches</span>
              <button 
                type="button"
                onClick={() => setShowAddBranch(!showAddBranch)}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus size={12} /> Add Branch
              </button>
            </div>

            {showAddBranch && (
              <form onSubmit={handleAddBranch} className="flex gap-2 p-2 bg-orange-50/60 border border-orange-200 rounded-xl animate-fade-in">
                <input 
                  type="text"
                  placeholder="e.g. AI-DS, CyberSec"
                  value={newBranchInput}
                  onChange={(e) => setNewBranchInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs border border-orange-200 rounded-lg bg-white outline-none uppercase font-semibold select-text"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600"
                >
                  Add
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5">
              {availableBranches.map(branch => {
                const isSelected = selectedBranches.includes(branch);
                return (
                  <div 
                    key={branch} 
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <button 
                      type="button" 
                      onClick={() => toggleBranch(branch)}
                      className="cursor-pointer"
                    >
                      {branch} {isSelected ? '✓' : ''}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteBranch(branch)}
                      className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                        isSelected ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-red-500'
                      }`}
                      title={`Delete ${branch}`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button 
              type="button"
              disabled={saving}
              onClick={handleSaveConfig}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save & Schedule Drive on Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Dynamic Calendar with Edit/Delete support */}
      <div className="flex-1 p-6 flex flex-col h-full overflow-hidden select-none">
        {/* Calendar Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'day' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Day
              </button>
            </div>
            
            <button 
              onClick={handleToday}
              className="px-3 py-1 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors border border-stone-200"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-bold text-stone-900 min-w-36 text-center select-none">
              {monthName} {year}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors border border-stone-200"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="text-xs text-stone-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>{allDrives.length} Drives Active & Approved</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-2xl border border-stone-200 shadow-card flex flex-col overflow-hidden select-none">
          <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/70 select-none">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2.5 text-center text-[11px] font-bold text-stone-500 uppercase tracking-wider select-none">
                {day}
              </div>
            ))}
          </div>
          
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-stone-100/60 gap-px overflow-y-auto select-none">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - firstDayIndex + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              const isToday = isCurrentMonth && 
                dayNum === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();
              
              const dayDrives = isCurrentMonth ? getDrivesForDay(dayNum) : [];

              return (
                <div 
                  key={i} 
                  onClick={() => isCurrentMonth && handleDayClick(dayNum)}
                  className={`bg-white p-2 flex flex-col justify-between transition-all min-h-[90px] select-none ${
                    isCurrentMonth ? 'cursor-pointer hover:bg-orange-50/40 group' : 'bg-stone-50/40 text-stone-300'
                  } ${selectedDay === dayNum ? 'ring-2 ring-orange-500 ring-inset bg-orange-50/20' : ''}`}
                >
                  <div className="flex justify-between items-start select-none">
                    <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-lg select-none ${
                      isToday 
                        ? 'bg-orange-500 text-white shadow-xs' 
                        : isCurrentMonth ? 'text-stone-700 group-hover:text-orange-600' : 'text-stone-300'
                    }`}>
                      {isCurrentMonth ? dayNum : ''}
                    </span>
                    {dayDrives.length > 0 && (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded select-none">
                        {dayDrives.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-1 overflow-hidden select-none">
                    {dayDrives.map((d) => {
                      const isPending = d.approvalStatus?.toLowerCase() === 'pending';
                      return (
                        <div 
                          key={d.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold truncate transition-colors shadow-2xs select-none ${
                            isPending 
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse' 
                              : 'bg-orange-50 text-orange-800 border border-orange-200/80 hover:bg-orange-100'
                          }`}
                          title={`${d.company?.name || 'Company'} - ${d.role} (₹${d.ctc} LPA) ${isPending ? '[Pending Admin Approval]' : '[Approved & Active]'}`}
                        >
                          {isPending ? '⏳ ' : ''}{d.company?.name}: {d.role}
                        </div>
                      );
                    })}
                    {isCurrentMonth && dayDrives.length === 0 && (
                      <span className="text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        + Schedule
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUICK SCHEDULE & DAY VIEW MODAL (Requirement 1: Edit & Delete, z-[9999]) */}
      {showScheduleModal && selectedDay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-orange-400" />
                <span className="font-bold text-xs">
                  Placement Schedule — {monthName} {selectedDay}, {year}
                </span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Existing Drives on this day */}
              {dayDrivesForModal.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Drives on this Date ({dayDrivesForModal.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dayDrivesForModal.map(d => {
                      const isPending = d.approvalStatus?.toLowerCase() === 'pending';
                      return (
                        <div key={d.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-stone-900">{d.role}</p>
                              {isPending ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Pending
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Approved ✓
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500">{d.company?.name} • ₹{d.ctc} LPA</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isPending && (
                              <button
                                disabled={approvingDriveId === d.id}
                                onClick={() => handleApproveDrive(d.id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                {approvingDriveId === d.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowScheduleModal(false);
                                openEditModal(d);
                              }}
                              className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors"
                              title="Edit Drive"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setShowScheduleModal(false);
                                promptDeleteDrive(d);
                              }}
                              className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Drive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule New Drive option */}
              <div className="border-t border-stone-100 pt-3 space-y-2">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Schedule New Drive on {monthName} {selectedDay}
                </p>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1 text-[11px]">
                  <p><strong>Company:</strong> {selectedCompany?.name || companiesList[0]?.name || 'TechCorp Innovations'}</p>
                  <p><strong>Role:</strong> {roleTitle} (₹{ctc} LPA)</p>
                  <p><strong>Min CGPA:</strong> {minCgpa} | <strong>Max Backlogs:</strong> {maxBacklogs}</p>
                  <p><strong>Branches:</strong> {selectedBranches.join(', ')}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    await handleSaveConfig();
                    setShowScheduleModal(false);
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DRIVE MODAL (Requirement 1, z-[9999]) */}
      {isEditModalOpen && editingDrive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Edit3 size={16} className="text-orange-400" />
                <span>Edit Drive — {editingDrive.role}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDrive} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Role Title</label>
                <input 
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 font-semibold select-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">CTC Package (LPA)</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 font-bold text-orange-600 select-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Drive Date</label>
                  <input 
                    type="date"
                    required
                    value={driveDateStr}
                    onChange={(e) => setDriveDateStr(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 mb-1">Min CGPA ({minCgpa})</label>
                  <input 
                    type="range" min="0" max="10" step="0.1"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-600 mb-1">Max Backlogs</label>
                  <input 
                    type="number" min="0"
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white select-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED POPUP DIALOG FOR SUCCESS, ERROR & DELETE CONFIRMATION (Requirement 5, z-[9999]) */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-red-100 text-red-600' :
                modalDialog.type === 'confirm' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-600'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> :
                 modalDialog.type === 'confirm' ? <Trash2 size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">{modalDialog.title}</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              {modalDialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modalDialog.onConfirm) modalDialog.onConfirm();
                      setModalDialog({ ...modalDialog, isOpen: false });
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Yes, Delete Drive
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
