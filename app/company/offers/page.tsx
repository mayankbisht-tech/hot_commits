"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { 
  Gift, Bell, CheckCircle, Clock, XCircle, FileText, 
  Loader2, Send, CheckCircle2, AlertTriangle, Sparkles, X, UserCheck, AlertCircle 
} from "lucide-react";
import { fetcher } from "@/lib/api-client";

interface ApplicationOffer {
  id: string;
  studentId: string;
  status: string;
  appliedOn: string;
  student: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
    cgpa: number;
  };
  drive: {
    id: string;
    role: string;
    ctc: number;
    company?: { name: string };
  };
  stageHistory?: { stage: string; date: string; note?: string }[];
}

export default function CompanyOffersPage() {
  const { data: appsData, isLoading } = useSWR<{ applications: ApplicationOffer[] }>(
    '/api/applications', 
    fetcher, 
    { refreshInterval: 2000 }
  );

  const [selectedStudentForReminder, setSelectedStudentForReminder] = useState<ApplicationOffer | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("Please review our placement offer letter and submit your acceptance response.");
  const [sendingReminder, setSendingReminder] = useState(false);

  // Centered Dialog State (Requirement 5)
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

  const applications = appsData?.applications || [];

  // Filter offers visible ONLY for our company (Requirement 4)
  const ourOffers = applications.filter(a => 
    a.status?.toUpperCase() === 'OFFER_EXTENDED' || a.status?.toUpperCase() === 'OFFER_ACCEPTED'
  );

  const pendingOffers = ourOffers.filter(o => o.status?.toUpperCase() === 'OFFER_EXTENDED');
  const acceptedOffers = ourOffers.filter(o => o.status?.toUpperCase() === 'OFFER_ACCEPTED');

  const openReminderModal = (offer?: ApplicationOffer) => {
    if (offer) {
      setSelectedStudentForReminder(offer);
      setReminderMessage(`Dear ${offer.student.name}, please review and respond to our ${offer.drive.role} offer (₹${offer.drive.ctc} LPA) on the placement portal.`);
    } else {
      setSelectedStudentForReminder(null);
      setReminderMessage("Urgent Reminder: Please review and take action on our pending placement offer.");
    }
    setReminderModalOpen(true);
  };

  // Functional Send Reminder (Requirement 3)
  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReminder(true);

    try {
      const studentTargetId = selectedStudentForReminder ? selectedStudentForReminder.student.id : 'ALL';
      const roleName = selectedStudentForReminder ? selectedStudentForReminder.drive.role : 'Placement Offer';
      const companyTitle = selectedStudentForReminder?.drive.company?.name || 'Recruiter';

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentTargetId,
          roleTitle: roleName,
          companyName: companyTitle,
          message: reminderMessage.trim()
        }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to dispatch reminder');

      setReminderModalOpen(false);
      await mutate('/api/notifications');
      showPopup('success', 'Reminder Dispatched in Real-Time', `Official reminder notification sent to ${selectedStudentForReminder ? selectedStudentForReminder.student.name : 'all pending offer recipients'}. The student will see this reminder live in their dashboard.`);
    } catch (err: any) {
      showPopup('error', 'Reminder Failed', err.message || 'Could not send reminder.');
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-stone-800 animate-fade-in select-none">
      {/* Header (Requirement 1: 'Our' wording) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">Our Offer Management & Tracking</h1>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> Live Real-Time
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Track extended candidate offers and send real-time acceptance reminders</p>
        </div>

        <button 
          onClick={() => openReminderModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 shadow-sm transition-all active:scale-[0.98]"
        >
          <Bell size={14} />
          <span>Send Bulk Reminder</span>
        </button>
      </div>

      {/* Policy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs">
        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-700 font-bold">
          <Gift size={16} />
        </div>
        <div>
          <p className="font-bold text-amber-900">One-Offer-One-Student Governance Active</p>
          <p className="text-amber-700 mt-0.5">Candidates who accept an offer from our company are automatically marked PLACED and gated from conflicting standard drives.</p>
        </div>
      </div>

      {/* Stats Cards (Requirement 1: 'Our') */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card">
          <p className="text-stone-400 font-bold uppercase text-[10px]">Total Offers Extended</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{ourOffers.length}</p>
          <p className="text-xs text-stone-500 mt-1">Across all our active recruitment drives</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card">
          <p className="text-stone-400 font-bold uppercase text-[10px]">Pending Student Decision</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingOffers.length}</p>
          <p className="text-xs text-stone-500 mt-1">Awaiting candidate acceptance</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card">
          <p className="text-stone-400 font-bold uppercase text-[10px]">Accepted Offers</p>
          <p className="text-2xl font-extrabold text-green-600 mt-1">{acceptedOffers.length}</p>
          <p className="text-xs text-stone-500 mt-1">Secured hires for our company</p>
        </div>
      </div>

      {/* Offers Table (Requirement 4: Scoped strictly to our company) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/70">
          <h3 className="font-bold text-sm text-stone-900">Our Extended Offers ({ourOffers.length})</h3>
          <span className="text-xs text-stone-500 font-medium">Auto-updates in real-time</span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading our extended offers...
            </div>
          ) : ourOffers.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/50 border-b border-stone-100 text-stone-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Candidate</th>
                  <th className="py-3 px-4 font-bold">Role & Drive</th>
                  <th className="py-3 px-4 font-bold">Package (CTC)</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ourOffers.map((offer) => {
                  const isAccepted = offer.status?.toUpperCase() === 'OFFER_ACCEPTED';

                  return (
                    <tr key={offer.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-xs">
                            {offer.student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{offer.student.name}</p>
                            <p className="text-[11px] text-stone-400">{offer.student.rollNo} • {offer.student.branch} (CGPA: {offer.student.cgpa})</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-stone-800">{offer.drive.role}</p>
                        <p className="text-[11px] text-stone-500">{offer.drive.company?.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600">₹{offer.drive.ctc} LPA</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAccepted ? (
                          <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Accepted ✓
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock size={11} /> Pending Student Response
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isAccepted ? (
                          <button
                            onClick={() => openReminderModal(offer)}
                            className="px-3 py-1.5 bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50 text-orange-600 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Bell size={12} />
                            <span>Send Reminder</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-green-600 font-bold">Offer Confirmed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs text-stone-400 space-y-2">
              <p>No extended offers found for our company yet.</p>
              <p className="text-[11px] text-stone-500">Advance shortlisted candidates to "Offers Extended" in the Applicants pipeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* SEND REMINDER MODAL (Requirement 3, z-[9999]) */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Bell size={16} className="text-orange-400" />
                <span>Send Live Recruiter Reminder</span>
              </div>
              <button onClick={() => setReminderModalOpen(false)} className="text-stone-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Candidate</label>
                <input 
                  type="text"
                  disabled
                  value={selectedStudentForReminder ? `${selectedStudentForReminder.student.name} (${selectedStudentForReminder.drive.role})` : 'All Pending Offer Candidates'}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-100 font-semibold text-stone-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reminder Message *</label>
                <textarea 
                  rows={4}
                  required
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed select-text"
                />
                <p className="text-[10px] text-stone-400 mt-1">This reminder will be delivered live directly to the student's dashboard notification feed.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReminderModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReminder}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {sendingReminder ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send Reminder Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED POPUP DIALOG (Requirement 5, z-[9999]) */}
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
