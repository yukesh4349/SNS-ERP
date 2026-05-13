"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Plus, 
  Trash,
  X,
  CalendarBlank,
  Users
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { ResourceLoading, ResourceError } from "./resource-states";

export function HomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    class: "",
    section: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any[]>("/homework");
      setHomeworkList(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load homework.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newHomework.title || !newHomework.subject || !newHomework.dueDate || !newHomework.class || !newHomework.section) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiRequest("/homework", {
        method: "POST",
        body: JSON.stringify(newHomework),
      });
      setIsModalOpen(false);
      setNewHomework({ title: "", description: "", subject: "", dueDate: "", class: "", section: "" });
      fetchHomework();
    } catch (err: any) {
      alert(`Failed to create homework: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) return;
    try {
      await apiRequest(`/homework/${id}`, { method: "DELETE" });
      fetchHomework();
    } catch (err: any) {
      alert(`Failed to delete homework: ${err.message}`);
    }
  };

  return (
    <PageSection
      eyebrow="Academics"
      title="Homework Management"
      description="Create, view, and manage homework assignments across all classes."
    >
      <div className="flex flex-col gap-8">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#FF7F50]">
                 <BookOpen size={24} weight="duotone" />
              </div>
              <div>
                 <h4 className="text-lg font-bold text-slate-900">Active Assignments</h4>
                 <p className="text-xs text-slate-500 font-medium">Manage student workload</p>
              </div>
           </div>
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-6 py-3 bg-[#FF7F50] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all"
           >
             <Plus size={18} weight="bold" /> Create Homework
           </button>
        </div>

        {isLoading ? <ResourceLoading label="homework" /> : null}
        {error ? <ResourceError label="homework" message={error} /> : null}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homeworkList.map((hw) => (
              <motion.div
                key={hw.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <BookOpen size={14} className="text-[#FF7F50]" />
                    {hw.subject}
                  </div>
                  <button 
                    onClick={() => handleDelete(hw.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{hw.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{hw.description}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Users size={16} className="text-slate-400" />
                    <span>Class {hw.class}-{hw.section}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <CalendarBlank size={16} className="text-slate-400" />
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {homeworkList.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <BookOpen size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">No homework assignments found.</p>
                <p className="text-sm text-slate-400 mt-1">Click "Create Homework" to add one.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-black text-slate-900">Create Homework</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all hover:rotate-90">
                  <X size={24} weight="bold" />
                </button>
              </div>
              
              <div className="p-6 md:p-8 space-y-5 overflow-y-auto hide-scrollbar flex-1">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Algebra Exercise 5"
                    value={newHomework.title}
                    onChange={e => setNewHomework({...newHomework, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                  <textarea 
                    placeholder="Provide details about the assignment..."
                    rows={3}
                    value={newHomework.description}
                    onChange={e => setNewHomework({...newHomework, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10"
                      value={newHomework.class}
                      onChange={e => setNewHomework({...newHomework, class: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Section</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A"
                      value={newHomework.section}
                      onChange={e => setNewHomework({...newHomework, section: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mathematics"
                      value={newHomework.subject}
                      onChange={e => setNewHomework({...newHomework, subject: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 capitalize"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                    <input 
                      type="date" 
                      value={newHomework.dueDate}
                      onChange={e => setNewHomework({...newHomework, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                <button 
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="w-full bg-[#FF7F50] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? "Creating..." : "Post Homework"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageSection>
  );
}
