"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, SpinnerGap, IdentificationCard } from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../hooks/use-auth";

interface ProfileRequest {
  id: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  changes: Record<string, string>;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const statusColor = (s: string) =>
  s === "approved" ? "#10B981" : s === "rejected" ? "#EF4444" : "#F59E0B";
const statusBg = (s: string) =>
  s === "approved" ? "#D1FAE5" : s === "rejected" ? "#FEE2E2" : "#FEF3C7";

export function ProfileRequestsPage() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiRequest<ProfileRequest[]>("/auth/profile-requests", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setRequests(data);
    } catch {
      showToast("Failed to load profile requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [session?.accessToken]);

  const handleResolve = async (id: string, action: "approved" | "rejected") => {
    if (!session?.accessToken) return;
    setActionId(id);
    try {
      await apiRequest(`/auth/profile-requests/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ action, adminNote: noteInputs[id] || "" }),
      });
      showToast(`Request ${action} successfully.`, "success");
      await fetchRequests();
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setActionId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <PageSection
      eyebrow="User Management"
      title="Profile Update Requests"
      description="Review and approve or reject parent profile change requests."
    >
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === "success" ? "#10B981" : "#EF4444" }}
        >
          {toast.type === "success" ? <CheckCircle size={20} weight="fill" /> : <XCircle size={20} weight="fill" />}
          {toast.message}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <SpinnerGap size={40} className="animate-spin text-[#FF7F50]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <IdentificationCard size={64} weight="duotone" className="mb-4 opacity-30" />
          <p className="font-bold text-lg">No profile update requests yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {pending.length > 0 && (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FF7F50] mb-4 flex items-center gap-2">
                <Clock size={16} weight="bold" /> Pending ({pending.length})
              </h3>
              <div className="space-y-4">
                {pending.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-6 md:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="font-black text-slate-900 text-lg">{req.user.name}</p>
                        <p className="text-sm text-slate-400 font-medium">{req.user.email} · <span className="capitalize">{req.user.role}</span></p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase" style={{ background: statusBg(req.status), color: statusColor(req.status) }}>
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {Object.entries(req.changes).map(([field, value]) => (
                        <div key={field} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{field}</p>
                          <p className="text-sm font-bold text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Admin Note (optional)</label>
                      <input
                        type="text"
                        placeholder="Add a note for the parent..."
                        value={noteInputs[req.id] || ""}
                        onChange={(e) => setNoteInputs({ ...noteInputs, [req.id]: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResolve(req.id, "approved")}
                        disabled={actionId === req.id}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {actionId === req.id ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolve(req.id, "rejected")}
                        disabled={actionId === req.id}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {actionId === req.id ? <SpinnerGap size={16} className="animate-spin" /> : <XCircle size={16} weight="bold" />}
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Resolved ({resolved.length})</h3>
              <div className="space-y-3">
                {resolved.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{req.user.name}</p>
                      <p className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                      {req.adminNote && <p className="text-xs text-slate-500 italic mt-1">Note: {req.adminNote}</p>}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase" style={{ background: statusBg(req.status), color: statusColor(req.status) }}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageSection>
  );
}
