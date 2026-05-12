"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Users, 
  UserCircle, 
  PaperPlaneTilt, 
  CheckCircle,
  ClockCounterClockwise,
  X,
  PencilLine,
  Trash,
  Plus,
  MagnifyingGlass,
  Funnel,
  Megaphone,
  Check,
  Clock
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../hooks/use-auth";
import { toast } from "sonner";

import { useSearchParams } from "next/navigation";

export function NotificationsPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [audience, setAudience] = useState<"parents" | "staff" | "both" | "notice" | "">("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setAudience("notice");
      setStep(2);
    }
  }, [searchParams]);

  const { session } = useAuth();
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin';

  const fetchHistory = async () => {
    try {
      const data = await apiRequest<any[]>("/notifications");
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notification history", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!message || !title) {
      toast.error("Please fill in both title and message");
      return;
    }
    setIsSending(true);
    try {
      await apiRequest("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          audience: audience || "both",
          title,
          message,
        }),
      });
      setIsSending(false);
      setStep(4); // Success step
      setTitle("");
      setMessage("");
      setAudience("");
      toast.success("Broadcast delivered successfully!");
      fetchHistory();
    } catch (err) {
      setIsSending(false);
      toast.error("Delivery failed. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("/notifications/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      toast.success("Notification removed from archive");
      fetchHistory();
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <PageSection
      eyebrow="SNS COMMUNICATION"
      title="Notification Hub"
      description="Manage and broadcast real-time updates to the school community."
    >
      <div className="flex flex-col gap-8">
        
        {/* Tool Panel */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-[var(--bg-secondary)] px-8 py-5 rounded-[2rem] border border-[var(--border)] shadow-sm mb-8">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">System Online</p>
              </div>
              <div className="h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                 <Bell size={18} weight="duotone" className="text-[#FF7F50]" />
                 <p className="text-xs font-black uppercase tracking-tight">{history.length} Announcements</p>
              </div>
           </div>
        </div>

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-8`}>
          
          {/* Left Column: Broadcast Wizard (Admins Only) */}
          {isAdmin && (
            <div className="lg:col-span-8">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-sm">
                
                {/* Stepper Header */}
                <div className="flex items-center justify-center mb-8 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--border)] -translate-y-1/2" />
                  <div className="relative flex justify-between w-full max-w-md">
                    {[1, 2, 3, 4].map((s) => (
                      <div 
                        key={s}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all duration-500 ${
                          step >= s ? "bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/30" : "bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {step > s ? <Check size={16} weight="bold" /> : s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Content Rendering */}
                <div className="flex-1">
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 uppercase tracking-tight">Step 1: Select Notification Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => { setAudience("both"); setStep(2); }}
                          className={`p-4 rounded-[1.25rem] border-2 transition-all text-left group ${
                            audience === "both" ? 'border-[#FF7F50] bg-[#FF7F50]/5' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#FF7F50]/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                            audience === "both" ? 'bg-[#FF7F50] text-white' : 'bg-[#FF7F50]/10 text-[#FF7F50]'
                          }`}>
                            <Bell size={18} weight="duotone" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">General Alert</h4>
                          <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Broadcast to everyone.</p>
                        </button>

                        <button 
                          onClick={() => { setAudience("parents"); setStep(2); }}
                          className={`p-4 rounded-[1.25rem] border-2 transition-all text-left group ${
                            audience === "parents" ? 'border-[#FF7F50] bg-[#FF7F50]/5' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#FF7F50]/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                            audience === "parents" ? 'bg-[#FF7F50] text-white' : 'bg-[var(--accent-glow)] text-[var(--accent)]'
                          }`}>
                            <Users size={18} weight="duotone" />
                          </div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">Class-wise</h4>
                          <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Target specific grades.</p>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 uppercase tracking-tight">Step 2: Compose Message</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Message Headline</label>
                          <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Annual Sports Meet 2026"
                            className="w-full px-8 py-5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[1.5rem] focus:ring-2 focus:ring-[#FF7F50]/10 focus:border-[#FF7F50] outline-none transition-all font-bold text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Content</label>
                            <textarea 
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="What would you like to say to the community?"
                              className="w-full h-32 px-8 py-6 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[2rem] focus:ring-2 focus:ring-[#FF7F50]/10 focus:border-[#FF7F50] outline-none transition-all resize-none leading-relaxed text-[var(--text-primary)]"
                            />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 uppercase tracking-tight">Step 3: Review & Schedule</h3>
                      <div className="bg-[var(--bg-primary)] rounded-[2.5rem] p-10 border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[#FF7F50] shadow-sm"><Megaphone size={24} weight="duotone" /></div>
                              <div>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Broadcast Preview</p>
                                <h4 className="text-xl font-bold text-[var(--text-primary)]">{title || "Untitled Message"}</h4>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-[10px] font-bold text-[#FF7F50] border border-[#FF7F50]/20 uppercase tracking-wider">
                              To: {audience}
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed text-lg italic">&quot;{message || "No content provided..."}&quot;</p>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10">
                      <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-8">
                        <PaperPlaneTilt size={48} weight="fill" className="rotate-12" />
                      </div>
                      <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-4">Broadcast Launched!</h3>
                      <p className="text-[var(--text-secondary)] max-w-sm mb-10 leading-relaxed">Your message has been delivered to all registered devices in the {audience} group.</p>
                      <button 
                        onClick={() => { setStep(1); setTitle(""); setMessage(""); setAudience(""); }}
                        className="px-12 py-5 bg-[var(--text-primary)] text-[var(--bg-secondary)] rounded-3xl font-black uppercase tracking-widest hover:bg-[var(--text-secondary)] transition-all shadow-xl"
                      >
                        New Broadcast
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Wizard Footer Navigation */}
                {step < 4 && (
                  <div className="mt-12 flex items-center justify-between pt-8 border-t border-[var(--border)]">
                    <button 
                      onClick={() => setStep(s => Math.max(1, s - 1))}
                      disabled={step === 1}
                      className="px-8 py-4 text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] transition-all disabled:opacity-0"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => step === 3 ? handleSend() : setStep(s => s + 1)}
                      disabled={(step === 1 && !audience) || (step === 2 && (!title || !message)) || isSending}
                      className={`px-10 py-4 bg-[#FF7F50] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#FF7F50]/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-30 disabled:scale-100 flex items-center gap-3 ${
                        step === 1 ? 'hidden' : ''
                      }`}
                    >
                      {step === 3 ? (isSending ? "Launching..." : "Deliver Now") : "Continue"}
                      <Plus size={20} weight="bold" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Column: Recent History (Full width if not admin) */}
          <div className={isAdmin ? "lg:col-span-4" : "col-span-1"}>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7F50] flex items-center justify-center">
                    <Clock size={22} weight="duotone" />
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase">Recent Activity</h3>
                </div>
              </div>

              <div className="space-y-4">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.id} className="p-6 rounded-[2rem] bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[#FF7F50]/20 transition-all group relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[#FF7F50]/10">
                         TO: {item.audience}
                       </span>
                       <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                         {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                    </div>
                    <h4 className="text-lg font-black text-[var(--text-primary)] mb-2 truncate group-hover:text-[#FF7F50] transition-colors uppercase italic">{item.title}</h4>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed font-medium">{item.message}</p>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-4 right-4 p-2 bg-[var(--bg-secondary)] text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    )}
                  </div>
                )) : (
                  <div className="py-20 text-center">
                    <Bell size={48} weight="duotone" className="mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Zero Broadcasts Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
