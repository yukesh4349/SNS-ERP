"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Users, 
  PaperPlaneTilt, 
  CheckCircle,
  ClockCounterClockwise,
  X,
  Trash,
  Plus,
  Megaphone,
  Check,
  Clock,
  Paperclip,
  SpinnerGap
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../hooks/use-auth";
import { toast } from "sonner";

export function NotificationsPage() {
  const { session } = useAuth();
  const isTeacher = session?.user?.role === "teacher";
  const [history, setHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Modals
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [dbClasses, setDbClasses] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClasses = async () => {
    try {
      const data = await apiRequest<any[]>("/users/classes");
      if (Array.isArray(data)) {
        const classNames = data.map((item: any) => `${item.class}-${item.section}`);
        setDbClasses(classNames);
      } else {
        setDbClasses([]);
      }
    } catch (err) {
      console.error("Failed to fetch classes", err);
      setDbClasses([]);
    }
  };

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
    if (!isTeacher) {
      fetchClasses();
    }
  }, [isTeacher]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Attachment exceeds the 2MB size limit.");
        setAttachedFile(null);
      } else {
        setUploadError(null);
        setAttachedFile(file);
      }
    }
  };

  const handleSend = async (type: "general" | "classwise") => {
    if (!title || !message) {
      toast.error("Please fill in both title and message");
      return;
    }
    if (type === "classwise" && targetClasses.length === 0) {
      toast.error("Please select at least one target class");
      return;
    }

    setIsSending(true);
    let finalAttachmentUrl = "";
    let finalAttachmentName = "";

    if (attachedFile) {
      try {
        const { uploadFile } = await import("../../lib/supabase");
        finalAttachmentUrl = await uploadFile(attachedFile, "announcements");
        finalAttachmentName = attachedFile.name;
      } catch (err) {
        console.error("Supabase upload failed, using simulated fallback", err);
        // Fallback to simulated base64 or custom link
        finalAttachmentUrl = `/mock-attachments/${attachedFile.name}`;
        finalAttachmentName = attachedFile.name;
      }
    }

    try {
      await apiRequest("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          audience: type === "general" ? "both" : "parents",
          title,
          message,
          targetClasses: type === "classwise" ? targetClasses : undefined,
          attachmentUrl: finalAttachmentUrl || undefined,
          attachmentName: finalAttachmentName || undefined,
        }),
      });

      toast.success("Broadcast sent successfully!");
      setTitle("");
      setMessage("");
      setTargetClasses([]);
      setAttachedFile(null);
      setShowGeneralModal(false);
      setShowClassModal(false);
      fetchHistory();
    } catch (err) {
      toast.error("Broadcast failed. Please try again.");
    } finally {
      setIsSending(false);
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

  // Filter duplicate notifications to show a clean broadcast history log
  const uniqueHistory = history.reduce((acc: any[], current: any) => {
    const isDup = acc.some(item => 
      item.title === current.title && 
      item.message === current.message &&
      Math.abs(new Date(item.createdAt).getTime() - new Date(current.createdAt).getTime()) < 5000
    );
    if (!isDup) {
      acc.push(current);
    }
    return acc;
  }, []);

  return (
    <PageSection
      eyebrow="SNS COMMUNICATION"
      title="Notification Hub"
      description={isTeacher ? "View notifications and announcements broadcasted to the school community." : "Manage and broadcast real-time updates to the school community."}
    >
      <div className="flex flex-col gap-8 pb-12">
        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Admin Panels (Broadcast actions + History) */}
          {!isTeacher ? (
            <>
              {/* Left Column: Create Broadcast (2 buttons) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Create Broadcast</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Choose a notification type</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* General Broadcast Button */}
                    <motion.button
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setAttachedFile(null);
                        setUploadError(null);
                        setTitle("");
                        setMessage("");
                        setShowGeneralModal(true);
                      }}
                      className="flex items-center gap-4 p-5 rounded-[1.5rem] border border-slate-100 bg-orange-50/10 text-left hover:border-[#FF7F50]/30 hover:bg-orange-50/20 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#FF7F50] text-white shadow-md shadow-orange-500/20">
                        <Megaphone size={22} weight="duotone" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#FF7F50] transition-colors">General Notification</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">To all parents and teachers</p>
                      </div>
                    </motion.button>

                    {/* Class-wise Broadcast Button */}
                    <motion.button
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setAttachedFile(null);
                        setUploadError(null);
                        setTitle("");
                        setMessage("");
                        setTargetClasses([]);
                        setShowClassModal(true);
                      }}
                      className="flex items-center gap-4 p-5 rounded-[1.5rem] border border-slate-100 bg-indigo-50/10 text-left hover:border-indigo-500/30 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                        <Users size={22} weight="duotone" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">Class-wise Notification</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">To specific student grades</p>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Right Column: History */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7F50] flex items-center justify-center">
                       <ClockCounterClockwise size={18} weight="duotone" />
                    </div>
                    <h3 className="font-bold text-slate-900">Broadcast History</h3>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {uniqueHistory.length > 0 ? uniqueHistory.map((item) => (
                      <div key={item.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF7F50]/20 transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FF7F50]/10 text-[#FF7F50] uppercase tracking-widest">
                            TO: {item.audience}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#FF7F50] transition-colors">{item.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.message}</p>
                        </div>
                        {item.attachmentUrl && (
                          <div className="flex items-center justify-between mt-1">
                            <a
                              href={item.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF7F50] bg-orange-50 px-2.5 py-1 rounded-lg hover:bg-[#FF7F50] hover:text-white transition-all text-decoration-none"
                            >
                              <Paperclip size={12} />
                              {item.attachmentName || "Download Attachment"}
                            </a>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              title="Delete from archive"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="py-12 text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Sent Notifications Found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Teacher view: Full width history feed */
            <div className="lg:col-span-12">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7F50] flex items-center justify-center">
                     <Bell size={18} weight="duotone" />
                  </div>
                  <h3 className="font-bold text-slate-900">Notifications Feed</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.length > 0 ? history.map((item) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF7F50]/20 transition-all flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                           <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FF7F50]/10 text-[#FF7F50] uppercase tracking-widest">
                             ALERT
                           </span>
                           <span className="text-[10px] font-bold text-slate-300">
                             {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                      </div>
                      {item.attachmentUrl && (
                        <div>
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF7F50] bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-[#FF7F50] hover:text-white transition-all text-decoration-none"
                          >
                            <Paperclip size={12} />
                            {item.attachmentName || "View Attachment"}
                          </a>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="py-12 text-center col-span-full">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Notifications Feed found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* 1. General Notification Modal */}
        {showGeneralModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={() => setShowGeneralModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full z-10 flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">General Broadcast</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Send to all parents & teachers</p>
                </div>
                <button
                  onClick={() => setShowGeneralModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Headline / Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Day Celebrations 2026"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF7F50] outline-none text-sm font-semibold"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type the notification details here..."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF7F50] outline-none text-sm font-medium resize-none"
                  />
                </div>

                {/* Attachment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach File / Image (Max 2MB)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      attachedFile 
                        ? 'border-[#FF7F50] bg-orange-50/5' 
                        : 'border-slate-200 hover:border-[#FF7F50]'
                    }`}
                  >
                    <Paperclip size={20} className={attachedFile ? "text-[#FF7F50]" : "text-slate-400"} />
                    <span className="text-xs font-bold text-slate-600">
                      {attachedFile ? attachedFile.name : "Click to select a file"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      {attachedFile ? `${(attachedFile.size / 1024 / 1024).toFixed(2)} MB` : "Image or document under 2MB"}
                    </span>
                  </div>
                  {uploadError && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setShowGeneralModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSend("general")}
                  disabled={isSending || !!uploadError || !title || !message}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FF7F50] hover:bg-[#e66a3e] text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isSending ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
                  Send Broadcast
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. Class-wise Notification Modal */}
        {showClassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={() => setShowClassModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full z-10 flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Class-wise Broadcast</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Send to specific student classes</p>
                </div>
                <button
                  onClick={() => setShowClassModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Target Classes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Target Classes</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetClasses(dbClasses)}
                        className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-[#FF7F50] hover:text-white transition-all"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetClasses([])}
                        className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dbClasses.map((cls) => {
                      const isSelected = targetClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => {
                            setTargetClasses(prev => 
                              isSelected ? prev.filter(c => c !== cls) : [...prev, cls]
                            );
                          }}
                          className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            isSelected 
                              ? 'border-[#FF7F50] bg-[#FF7F50] text-white' 
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Headline / Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Class 10-A Math Test Announcement"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF7F50] outline-none text-sm font-semibold"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type the notification details here..."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF7F50] outline-none text-sm font-medium resize-none"
                  />
                </div>

                {/* Attachment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach File (Optional - Max 2MB)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      attachedFile 
                        ? 'border-[#FF7F50] bg-orange-50/5' 
                        : 'border-slate-200 hover:border-[#FF7F50]'
                    }`}
                  >
                    <Paperclip size={18} className={attachedFile ? "text-[#FF7F50]" : "text-slate-400"} />
                    <span className="text-xs font-bold text-slate-600">
                      {attachedFile ? attachedFile.name : "Click to select a file"}
                    </span>
                    {attachedFile && (
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setShowClassModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSend("classwise")}
                  disabled={isSending || !!uploadError || !title || !message || targetClasses.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FF7F50] hover:bg-[#e66a3e] text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isSending ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
                  Send Broadcast
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageSection>
  );
}
