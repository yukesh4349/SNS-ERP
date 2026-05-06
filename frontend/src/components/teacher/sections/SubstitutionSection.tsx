"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";

export default function SubstitutionSection() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [isCreating, setIsCreating] = useState(false);
  const [newSub, setNewSub] = useState({ 
    teacher: "", 
    class: "", 
    period: "I", 
    time: "09:00 AM - 09:45 AM",
    note: "" 
  });

  const substitutions: any[] = [];

  const handleCreateSub = () => {
    // This is where we would call an API
    console.log("Creating substitution:", newSub);
    setIsCreating(false);
    // For now, just show a success alert or similar
    alert(`Substitution created for ${newSub.teacher} in ${newSub.class} (Period ${newSub.period})`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">
            Class <span className="text-[var(--accent)]">Substitution</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Manage your assigned proxy classes</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-[var(--accent-glow)] hover:scale-105 transition-all"
          >
            Create Substitution
          </button>
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border)]">
            <button 
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "pending" ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "history" ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[40px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent)]">
              <UserCheck size={24} />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">New Assignment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Staff Name</label>
              <input 
                type="text" 
                placeholder="Enter teacher name..." 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[var(--accent)] transition-all"
                value={newSub.teacher}
                onChange={(e) => setNewSub({...newSub, teacher: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Assigned Class</label>
              <input 
                type="text" 
                placeholder="e.g. Grade 10-A" 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[var(--accent)] transition-all"
                value={newSub.class}
                onChange={(e) => setNewSub({...newSub, class: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Period Number</label>
              <select 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer"
                value={newSub.period}
                onChange={(e) => setNewSub({...newSub, period: e.target.value})}
              >
                {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map(p => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Administrative Note</label>
            <textarea 
              placeholder="Add any specific instructions for the proxy teacher..." 
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[var(--accent)] transition-all min-h-[100px] resize-none"
              value={newSub.note}
              onChange={(e) => setNewSub({...newSub, note: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setIsCreating(false)}
              className="flex-1 py-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateSub}
              disabled={!newSub.teacher || !newSub.class}
              className="flex-1 py-4 rounded-2xl bg-[var(--accent)] text-white font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-[var(--accent-glow)] transition-all disabled:opacity-50"
            >
              Post Assignment
            </button>
          </div>
        </motion.div>
      )}

      {substitutions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-[40px] border-2 border-dashed border-[var(--border)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center mb-4">
            <UserCheck size={32} />
          </div>
          <h3 className="text-lg font-black italic uppercase tracking-tight text-[var(--text-primary)] mb-1">No pending substitutions</h3>
          <p className="text-xs font-medium">You are all caught up with your schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {substitutions.map((sub, i) => (
            <motion.div 
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-[32px] bg-[var(--bg-secondary)] border border-[var(--border)] relative overflow-hidden group hover:border-[var(--accent)] transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Absent Teacher</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{sub.teacher}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">
                  Action Required
                </span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
                  <Clock size={16} className="text-[var(--accent)]" />
                  <span><strong className="text-[var(--text-primary)]">{sub.period}</strong> ({sub.time})</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
                  <CalendarIcon size={16} className="text-[var(--accent)]" />
                  <span><strong className="text-[var(--text-primary)]">{sub.date}</strong> - Class <strong className="text-[var(--accent)]">{sub.class}</strong></span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] font-black text-[10px] uppercase tracking-widest hover:border-[var(--accent)] transition-all flex items-center justify-center gap-2">
                  <AlertCircle size={14} /> Request Change
                </button>
                <button className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-[var(--accent-glow)] transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Accept Proxy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
