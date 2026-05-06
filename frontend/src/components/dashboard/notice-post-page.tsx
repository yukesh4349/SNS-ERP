"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PaperPlaneTilt, 
  CheckCircle,
  Plus,
  Image as ImageIcon,
  VideoCamera,
  X,
  Megaphone,
  Bell,
  Globe
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { toast } from "sonner";

export function NoticePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"all" | "parents" | "staff">("all");
  const [isPosting, setIsPosting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePost = () => {
    if (!title || !content) {
      toast.error("Please provide both title and content");
      return;
    }
    setIsPosting(true);
    // Mock API call
    setTimeout(() => {
      setIsPosting(false);
      setIsSuccess(true);
      toast.success("Notice posted successfully!");
    }, 1500);
  };

  if (isSuccess) {
    return (
      <PageSection eyebrow="Success" title="Post Published" description="Your announcement is now live on the school platform.">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-8">
            <CheckCircle size={48} weight="fill" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Notice is Live!</h3>
          <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">This announcement has been broadcasted to all selected groups and is now visible on their dashboards.</p>
          <button 
            onClick={() => { setIsSuccess(false); setTitle(""); setContent(""); }}
            className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Create Another Post
          </button>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection
      eyebrow="School Bulletin"
      title="Create New Post"
      description="Publish official announcements, event updates, and news stories with rich media to the school community."
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Post Editor */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm space-y-8">
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Headline</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Cultural Festival 2026"
                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-2 focus:ring-[#FF7F50]/10 focus:border-[#FF7F50] outline-none transition-all font-black text-xl placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Content Detail</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement details here..."
                    className="w-full h-64 px-8 py-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:ring-2 focus:ring-[#FF7F50]/10 focus:border-[#FF7F50] outline-none transition-all resize-none leading-relaxed text-slate-700 font-medium placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Media Attachments</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <button className="h-32 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#FF7F50]/30 hover:text-[#FF7F50] transition-all group">
                        <ImageIcon size={28} weight="duotone" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Image</span>
                     </button>
                     <button className="h-32 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#FF7F50]/30 hover:text-[#FF7F50] transition-all group">
                        <VideoCamera size={28} weight="duotone" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Video</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Publishing Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Globe size={18} weight="fill" className="text-[#FF7F50]" />
                 Publish Settings
               </h4>
               
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</p>
                  {[
                    { id: "all", label: "Global", desc: "Everyone", icon: <Globe size={20} /> },
                    { id: "parents", label: "Parents", desc: "Parent Portal", icon: <Bell size={20} /> },
                    { id: "staff", label: "Faculty", desc: "Staff Only", icon: <Megaphone size={20} /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTarget(t.id as any)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        target === t.id ? "border-[#FF7F50] bg-[#FF7F50]/5" : "border-slate-50 hover:border-slate-100"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        target === t.id ? "bg-[#FF7F50] text-white" : "bg-slate-50 text-slate-400"
                      }`}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{t.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.desc}</p>
                      </div>
                    </button>
                  ))}
               </div>

               <div className="mt-8 pt-8 border-t border-slate-50">
                  <button 
                    onClick={handlePost}
                    disabled={isPosting}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#FF7F50] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#FF7F50]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isPosting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <PaperPlaneTilt size={20} weight="fill" />
                        Publish Post
                      </>
                    )}
                  </button>
               </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
               <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Post Guidelines</h5>
               <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-xs font-medium text-white/80">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F50] mt-1.5 shrink-0" />
                     <span>Postings are immediate and cannot be undone once published.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs font-medium text-white/80">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F50] mt-1.5 shrink-0" />
                     <span>Media files are optimized for mobile consumption.</span>
                  </li>
               </ul>
            </div>
          </div>

        </div>
      </div>
    </PageSection>
  );
}
