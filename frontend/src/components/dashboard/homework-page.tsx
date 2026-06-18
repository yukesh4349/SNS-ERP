"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  PaperPlaneRight,
  MagnifyingGlass,
  GraduationCap,
  CalendarBlank,
  Users,
  CaretLeft,
  Trash
} from "@phosphor-icons/react";
import { apiRequest } from "../../services/api-client";
import { getSchoolClasses } from "../../services/data-service";

export function HomeworkPage() {
  const [classes, setClasses] = useState<{class: string, section: string, total: number}[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<{class: string, section: string} | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClasses();
    fetchHomework();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new homework is loaded or selected class changes
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [homeworkList, selectedClass]);

  const fetchClasses = async () => {
    try {
      const data = await getSchoolClasses();
      setClasses(data || []);
    } catch (err) {
      console.error("Failed to load classes");
    }
  };

  const fetchHomework = async () => {
    try {
      const data = await apiRequest<any[]>("/homework");
      setHomeworkList(data || []);
    } catch (err) {
      console.error("Failed to load homework");
    }
  };

  const handleSend = async () => {
    if (!selectedClass) return;
    if (!title || !description || !subject || !dueDate) {
      alert("Please fill in all fields (Title, Description, Subject, Due Date)");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/homework", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          subject,
          dueDate,
          class: selectedClass.class,
          section: selectedClass.section
        }),
      });
      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      // Refresh homework list
      await fetchHomework();
    } catch (err: any) {
      alert(`Failed to send homework: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this homework?")) return;
    try {
      await apiRequest(`/homework/${id}`, { method: "DELETE" });
      fetchHomework();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredClasses = classes.filter(c => 
    `${c.class} ${c.section}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentHomework = selectedClass 
    ? homeworkList.filter(h => h.class === selectedClass.class && h.section === selectedClass.section)
    : [];

  return (
    <div className="h-[calc(100vh-120px)] w-full flex bg-slate-50 overflow-hidden border border-slate-200 rounded-[2rem] shadow-sm">
      
      {/* LEFT SIDEBAR (Classes List) */}
      <div className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col bg-white border-r border-slate-100 transition-all ${selectedClass ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen size={24} className="text-[#FF7F50]" weight="duotone" />
            Homework
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Select a class to send assignments</p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <MagnifyingGlass size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Class List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-bold">No classes found</p>
            </div>
          ) : (
            filteredClasses.map((cls, idx) => {
              const isSelected = selectedClass?.class === cls.class && selectedClass?.section === cls.section;
              // Last homework snippet for preview
              const hwForClass = homeworkList.filter(h => h.class === cls.class && h.section === cls.section);
              const lastHw = hwForClass[hwForClass.length - 1];

              return (
                <div 
                  key={`${cls.class}-${cls.section}-${idx}`}
                  onClick={() => setSelectedClass(cls)}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all mb-1 ${
                    isSelected ? 'bg-[#FF7F50] text-white shadow-md shadow-[#FF7F50]/20' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#FF7F50]'}`}>
                    <GraduationCap size={24} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>Class {cls.class} - {cls.section}</h4>
                      {lastHw && <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {new Date(lastHw.createdAt).toLocaleDateString()}
                      </span>}
                    </div>
                    <p className={`text-xs truncate font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {lastHw ? `${lastHw.subject}: ${lastHw.title}` : 'No recent homework'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE (Chat / Homework Area) */}
      <div className={`flex-1 flex flex-col bg-[#F8FAFC] relative ${!selectedClass ? 'hidden md:flex' : 'flex'}`}>
        {!selectedClass ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6 text-slate-300">
              <BookOpen size={48} weight="duotone" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Homework Center</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm">
              Select a class from the left menu to view past assignments and send new homework to students.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 z-10 shadow-sm">
              <button 
                onClick={() => setSelectedClass(null)}
                className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
              <div className="h-10 w-10 rounded-xl bg-[#FF7F50]/10 text-[#FF7F50] flex items-center justify-center">
                <Users size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Class {selectedClass.class} - {selectedClass.section}</h3>
                <p className="text-xs text-slate-500 font-bold tracking-wide uppercase">Broadcast Homework</p>
              </div>
            </div>

            {/* Chat History Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
              style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            >
              {currentHomework.length === 0 ? (
                <div className="m-auto bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-sm font-bold text-slate-500 text-center">
                  No homework sent to this class yet.
                </div>
              ) : (
                currentHomework.map((hw) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={hw.id} 
                    className="self-end max-w-[85%] md:max-w-[70%] flex flex-col"
                  >
                    <div className="bg-white border border-[#FF7F50]/20 shadow-md shadow-[#FF7F50]/5 rounded-3xl rounded-tr-sm p-5 relative group">
                      <button 
                        onClick={() => handleDelete(hw.id)}
                        className="absolute -left-10 top-2 p-2 rounded-full text-slate-300 hover:text-rose-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Homework"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                      <div className="flex justify-between items-start mb-3 gap-4">
                        <span className="bg-[#FF7F50]/10 text-[#FF7F50] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                          {hw.subject}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-lg">
                          <CalendarBlank size={12} /> Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <h4 className="text-slate-900 font-black text-lg leading-tight mb-2">{hw.title}</h4>
                      <p className="text-slate-600 text-sm font-medium whitespace-pre-wrap leading-relaxed">{hw.description}</p>
                      <div className="text-right text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-wider">
                        Sent {new Date(hw.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 md:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Subject (e.g. Science)" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-1/3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/20 transition-all"
                  />
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-1/3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/20 transition-all"
                  />
                </div>
                
                <input 
                  type="text" 
                  placeholder="Homework Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/20 transition-all"
                />

                <div className="flex gap-3 items-end">
                  <textarea 
                    placeholder="Type homework instructions here..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/20 transition-all resize-none"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isSubmitting}
                    className="bg-[#FF7F50] text-white p-4 rounded-2xl shadow-lg shadow-[#FF7F50]/30 hover:bg-[#e66a3e] active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    <PaperPlaneRight size={20} weight="fill" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
