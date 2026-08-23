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
      showPopup('success', 'Reminder Dispatched', `Official reminder notification sent to ${selectedStudentForReminder ? selectedStudentForReminder.student.name : 'all pending offer recipients'}. The student will see this reminder in their dashboard.`);
    } catch (err: any) {
      showPopup('error', 'Reminder Failed', err.message || 'Could not send reminder.');
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-[#1C1A1A] animate-fade-in select-none bg-[#F8F5EC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E3D8C4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1A1A]">Our Offer Management & Tracking</h1>
          </div>
          <p className="text-xs text-[#5E544A] mt-0.5 font-medium">Track extended candidate offers and send candidate reminders</p>
        </div>

        <button 
          onClick={() => openReminderModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-xs font-bold hover:bg-[#A63030] shadow-xs transition-all active:scale-[0.98]"
        >
          <Bell size={14} />
          <span>Send Bulk Reminder</span>
        </button>
      </div>

      {/* Policy Banner */}
      <div className="bg-[#F1E9D8] border border-[#E3D8C4] rounded-xl p-4 flex items-start gap-3 text-xs">
        <div className="w-8 h-8 bg-white border border-[#E3D8C4] rounded-xl flex items-center justify-center flex-shrink-0 text-[#8B1A1A] font-bold">
          <Gift size={16} />
        </div>
        <div>
          <p className="font-bold text-[#1C1A1A]">One-Offer-One-Student Governance Active</p>
          <p className="text-[#5E544A] mt-0.5 font-medium">Candidates who accept an offer from our company are automatically marked PLACED and gated from conflicting standard drives.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card">
          <p className="text-[#8B7B6F] font-bold uppercase text-[10px] tracking-wider">Total Offers Extended</p>
          <p className="text-2xl font-extrabold text-[#1C1A1A] mt-1">{ourOffers.length}</p>
          <p className="text-xs text-[#5E544A] mt-1 font-medium">Across all our active recruitment drives</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card">
          <p className="text-[#8B7B6F] font-bold uppercase text-[10px] tracking-wider">Pending Student Decision</p>
          <p className="text-2xl font-extrabold text-[#C8A243] mt-1">{pendingOffers.length}</p>
          <p className="text-xs text-[#5E544A] mt-1 font-medium">Awaiting candidate acceptance</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3D8C4] p-5 shadow-card">
          <p className="text-[#8B7B6F] font-bold uppercase text-[10px] tracking-wider">Accepted Offers</p>
          <p className="text-2xl font-extrabold text-[#4A7C59] mt-1">{acceptedOffers.length}</p>
          <p className="text-xs text-[#5E544A] mt-1 font-medium">Secured hires for our company</p>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl border border-[#E3D8C4] shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#E3D8C4] flex justify-between items-center bg-[#F8F5EC]">
          <h3 className="font-bold text-sm text-[#1C1A1A]">Our Extended Offers ({ourOffers.length})</h3>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#8B7B6F] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#8B1A1A]" /> Loading our extended offers...
            </div>
          ) : ourOffers.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F5EC] border-b border-[#E3D8C4] text-[#5E544A] uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Candidate</th>
                  <th className="py-3 px-4 font-bold">Role & Drive</th>
                  <th className="py-3 px-4 font-bold">Package (CTC)</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3D8C4]">
                {ourOffers.map((offer) => {
                  const isAccepted = offer.status?.toUpperCase() === 'OFFER_ACCEPTED';

                  return (
                    <tr key={offer.id} className="hover:bg-[#F8F5EC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#F1E9D8] border border-[#E3D8C4] flex items-center justify-center font-bold text-[#8B1A1A] text-xs">
                            {offer.student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1C1A1A]">{offer.student.name}</p>
                            <p className="text-[11px] text-[#5E544A]">{offer.student.rollNo} • {offer.student.branch} (CGPA: {offer.student.cgpa})</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1C1A1A]">{offer.drive.role}</p>
                        <p className="text-[11px] text-[#5E544A]">{offer.drive.company?.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#8B1A1A]">₹{offer.drive.ctc} LPA</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAccepted ? (
                          <span className="bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Accepted ✓
                          </span>
                        ) : (
                          <span className="bg-[#F1E9D8] text-[#C8A243] border border-[#E3D8C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock size={11} /> Pending Student Response
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isAccepted ? (
                          <button
                            onClick={() => openReminderModal(offer)}
                            className="px-3 py-1.5 bg-white border border-[#E3D8C4] hover:bg-[#F1E9D8] text-[#8B1A1A] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Bell size={12} />
                            <span>Send Reminder</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#4A7C59] font-bold">Offer Confirmed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs text-[#8B7B6F] space-y-2">
              <p>No extended offers found for our company yet.</p>
              <p className="text-[11px] text-[#5E544A]">Advance shortlisted candidates to "Offers Extended" in the Applicants pipeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* SEND REMINDER MODAL */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] overflow-hidden animate-scale-in text-xs">
            <div className="p-4 bg-[#1C1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Bell size={16} className="text-[#C8A243]" />
                <span>Send Recruiter Reminder</span>
              </div>
              <button onClick={() => setReminderModalOpen(false)} className="text-[#8B7B6F] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Target Candidate</label>
                <input 
                  type="text"
                  disabled
                  value={selectedStudentForReminder ? `${selectedStudentForReminder.student.name} (${selectedStudentForReminder.drive.role})` : 'All Pending Offer Candidates'}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] font-bold text-[#1C1A1A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5E544A] mb-1">Reminder Message *</label>
                <textarea 
                  rows={4}
                  required
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full border border-[#E3D8C4] rounded-xl px-3 py-2 text-xs bg-[#F8F5EC] text-[#1C1A1A] focus:ring-1 focus:ring-[#8B1A1A] outline-none leading-relaxed select-text"
                />
                <p className="text-[10px] text-[#8B7B6F] mt-1 font-medium">This reminder will be delivered directly to the student's dashboard notification feed.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReminderModalOpen(false)}
                  className="px-4 py-2 border border-[#E3D8C4] rounded-xl text-[#5E544A] font-bold hover:bg-[#F8F5EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReminder}
                  className="px-5 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {sendingReminder ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send Reminder Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP ALERT DIALOG */}
      {modalDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E3D8C4] p-6 space-y-4 text-center animate-scale-in">
            <div className="flex justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modalDialog.type === 'error' ? 'bg-[#F1E9D8] text-[#C85555] border border-[#E3D8C4]' : 'bg-[#F1E9D8] text-[#4A7C59] border border-[#E3D8C4]'
              }`}>
                {modalDialog.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1C1A1A] text-base">{modalDialog.title}</h3>
              <p className="text-xs text-[#5E544A] mt-1.5 leading-relaxed">{modalDialog.message}</p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setModalDialog({ ...modalDialog, isOpen: false })}
                className="px-6 py-2 bg-[#8B1A1A] hover:bg-[#A63030] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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
