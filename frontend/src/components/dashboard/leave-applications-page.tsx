"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, SpinnerGap, PaperPlaneTilt, ArrowSquareOut } from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../hooks/use-auth";

interface LeaveApplication {
  id: string;
  studentName: string;
  class: string;
  section: string;
  startDate: string;
  endDate: string;
  reason: string;
  documentUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const statusColor = (s: string) =>
  s === "approved" ? "#10B981" : s === "rejected" ? "#EF4444" : "#F59E0B";
const statusBg = (s: string) =>
  s === "approved" ? "#D1FAE5" : s === "rejected" ? "#FEE2E2" : "#FEF3C7";

export function LeaveApplicationsPage() {
  const { session } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiRequest<LeaveApplication[]>("/leaves", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setLeaves(data);
    } catch { showToast("Failed to load applications.", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [session?.accessToken]);

  const resolve = async (id: string, status: "approved" | "rejected") => {
    if (!session?.accessToken) return;
    setActionId(id);
    try {
      await apiRequest(`/leaves/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status, adminNote: noteInputs[id] || "" }),
      });
      showToast(`Leave ${status}.`, true);
      await load();
    } catch { showToast("Action failed.", false); }
    finally { setActionId(null); }
  };

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);
  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <PageSection
      eyebrow="Student Management"
      title="Leave Applications"
      description="Review and approve or reject student leave requests submitted by parents."
    >
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.ok ? "#10B981" : "#EF4444" }}
        >
          {toast.ok ? <CheckCircle size={18} weight="fill" /> : <XCircle size={18} weight="fill" />}
          {toast.msg}
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === f
                ? "bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/20"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><SpinnerGap size={40} className="animate-spin text-[#FF7F50]" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-slate-400 gap-4">
          <PaperPlaneTilt size={64} weight="duotone" className="opacity-20" />
          <p className="font-bold text-lg">No {filter === "all" ? "" : filter} applications.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((leave, i) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#e66a3e] text-white flex items-center justify-center font-black text-sm">
                      {leave.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg leading-none">{leave.studentName}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Class {leave.class}-{leave.section} · {leave.user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Submitted {new Date(leave.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider" style={{ background: statusBg(leave.status), color: statusColor(leave.status) }}>
                  {leave.status}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">From</p>
                  <p className="font-bold text-slate-800">{leave.startDate}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">To</p>
                  <p className="font-bold text-slate-800">{leave.endDate}</p>
                </div>
                {leave.documentUrl && (
                  <a href={leave.documentUrl} target="_blank" rel="noreferrer"
                    className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    <ArrowSquareOut size={16} className="text-blue-500" />
                    <p className="font-bold text-blue-600 text-sm">View Document</p>
                  </a>
                )}
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 mb-5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Reason</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{leave.reason}</p>
              </div>

              {leave.adminNote && (
                <p className="text-xs text-slate-500 italic mb-4">Admin note: {leave.adminNote}</p>
              )}

              {leave.status === "pending" && (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Add an optional note for the parent..."
                      value={noteInputs[leave.id] || ""}
                      onChange={(e) => setNoteInputs({ ...noteInputs, [leave.id]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/10 transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => resolve(leave.id, "approved")}
                      disabled={actionId === leave.id}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50"
                    >
                      {actionId === leave.id ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
                      Approve
                    </button>
                    <button
                      onClick={() => resolve(leave.id, "rejected")}
                      disabled={actionId === leave.id}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-50"
                    >
                      {actionId === leave.id ? <SpinnerGap size={16} className="animate-spin" /> : <XCircle size={16} weight="bold" />}
                      Reject
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PageSection>
  );
}
