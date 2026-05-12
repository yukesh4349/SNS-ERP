"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Table,
  CloudArrowUp,
  CheckCircle,
  CaretLeft,
  FilePdf,
  Warning,
  SpinnerGap,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getAllUsers } from "../../services/users-service";
import { bulkSaveResults } from "../../services/exam-service";

type Step = 1 | 2 | 3;

interface MarkEntry { name: string; studentProfileId: string; math: string; science: string; english: string; }
interface ClassInfo { label: string; count: number; students: { name: string; profileId: string }[]; rawClass: string; rawSection: string; }

export function ResultsPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassInfo, setSelectedClassInfo] = useState<ClassInfo | null>(null);
  const [term, setTerm] = useState("Term Exam");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [marks, setMarks] = useState<MarkEntry[]>([]);

  useEffect(() => {
    getAllUsers()
      .then((data: any) => {
        const grouped: Record<string, { students: { name: string; profileId: string }[]; rawClass: string; rawSection: string }> = {};
        for (const u of data) {
          if (u.role !== 'parent') continue;
          const profile = u.studentProfile;
          if (!profile?.class) continue;
          const cls = profile.section ? `Class ${profile.class}${profile.section}` : `Class ${profile.class}`;
          if (!grouped[cls]) grouped[cls] = { students: [], rawClass: profile.class, rawSection: profile.section ?? '' };
          grouped[cls].students.push({ name: u.name, profileId: profile.id });
        }
        setClasses(
          Object.entries(grouped).map(([label, info]) => ({ label, count: info.students.length, students: info.students, rawClass: info.rawClass, rawSection: info.rawSection }))
        );
      })
      .catch(console.error)
      .finally(() => setIsLoadingClasses(false));
  }, []);

  const [activeMode, setActiveMode] = useState<"view" | "mark">("mark");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewSelectedClass, setViewSelectedClass] = useState("");
  const [allResults, setAllResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch some initial data or classes
    // ... existing classes fetch logic ...
  }, []);

  const examCategories = [
    { id: "Term Exam", label: "Term Exams" },
    { id: "Cycle Exam", label: "Cycle Exams" },
    { id: "Assessment", label: "Assessments" },
    { id: "Periodic", label: "Periodic Assessments" },
  ];

  const handleSelectClass = (info: ClassInfo) => {
    setSelectedClass(info.label);
    setSelectedClassInfo(info);
    setMarks(info.students.map((s) => ({ name: s.name, studentProfileId: s.profileId, math: "", science: "", english: "" })));
    setStep(2);
  };

  const updateMark = (index: number, subject: string, value: string) => {
    const newMarks = [...marks];
    (newMarks[index] as any)[subject] = value;
    setMarks(newMarks);
  };

  const safeTotal = (m: MarkEntry) => {
    const a = parseInt(m.math) || 0;
    const b = parseInt(m.science) || 0;
    const c = parseInt(m.english) || 0;
    return a + b + c || "—";
  };

  const handlePublish = async () => {
    if (!selectedClassInfo) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const students = marks
        .filter(m => m.math || m.science || m.english)
        .map(m => ({
          studentId: m.studentProfileId,
          name: m.name,
          subjects: [
            ...(m.math ? [{ subject: "Mathematics", internal: 0, exam: parseInt(m.math) || 0, total: parseInt(m.math) || 0 }] : []),
            ...(m.science ? [{ subject: "Science", internal: 0, exam: parseInt(m.science) || 0, total: parseInt(m.science) || 0 }] : []),
            ...(m.english ? [{ subject: "English", internal: 0, exam: parseInt(m.english) || 0, total: parseInt(m.english) || 0 }] : []),
          ],
        }));
      await bulkSaveResults({
        class: selectedClassInfo.rawClass,
        section: selectedClassInfo.rawSection,
        term,
        academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
        students,
      });
      setStep(3);
    } catch (err: any) {
      setPublishError(err?.message || "Failed to publish results.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Mock search or actual API call if student results can be searched by class/name
      // For now, let's keep it simple
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <PageSection
      eyebrow="Academic Performance"
      title="Results Management"
      description="Record, validate, and search academic results across all assessment categories."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Mode Switcher */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] p-1.5 rounded-2xl w-fit mx-auto shadow-sm">
           <button 
             onClick={() => setActiveMode("view")}
             className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === "view" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
           >
             View Results
           </button>
           <button 
             onClick={() => setActiveMode("mark")}
             className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === "mark" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
           >
             Mark Results
           </button>
        </div>

        <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden shadow-[var(--card-shadow)]">
          {/* Header */}
          <div className="bg-[var(--bg-primary)] border-b border-[var(--border)] px-8 py-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#FF7F50] flex items-center justify-center text-white shadow-lg shadow-[#FF7F50]/20">
                   <GraduationCap size={28} weight="fill" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[var(--text-primary)]">{activeMode === 'mark' ? 'Entry Portal' : 'Search Portal'}</h3>
                   <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-widest">Session 2026-27</p>
                </div>
             </div>
             {activeMode === 'mark' && (
               <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                     <div key={s} className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-[#FF7F50]" : "bg-[var(--border)]"}`} />
                  ))}
               </div>
             )}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeMode === 'view' ? (
                <motion.div
                  key="view-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                      <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Search student name..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <select 
                      value={viewSelectedClass}
                      onChange={e => setViewSelectedClass(e.target.value)}
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                    <button 
                      onClick={handleSearch}
                      className="bg-[var(--text-primary)] text-[var(--bg-secondary)] rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-[var(--text-secondary)] transition-all flex items-center justify-center gap-2"
                    >
                      {isSearching ? <SpinnerGap size={18} className="animate-spin" /> : "Apply Filters"}
                    </button>
                  </div>

                  {/* Empty state for now */}
                  <div className="py-20 text-center space-y-4 flex flex-col items-center">
                     <div className="p-6 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)]">
                       <Table size={48} weight="duotone" />
                     </div>
                     <div>
                       <h4 className="text-xl font-bold text-[var(--text-primary)]">No Records Found</h4>
                       <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Select a class or search for a student to view their marks.</p>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div key="mark-mode">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="text-center max-w-md mx-auto py-6">
                        <h4 className="text-2xl font-black text-[var(--text-primary)] mb-2 italic">Select Class & Category</h4>
                        <p className="text-sm text-[var(--text-secondary)] font-medium">Choose the assessment group to begin mark entry.</p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {examCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setTerm(cat.id)}
                            className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${term === cat.id ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'}`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {isLoadingClasses ? (
                        <div className="flex items-center justify-center py-12">
                          <SpinnerGap size={32} className="animate-spin text-[#FF7F50]" />
                        </div>
                      ) : classes.length === 0 ? (
                        <p className="text-center text-slate-400 py-12">No classes found.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {classes.map((c) => (
                            <button
                              key={c.label}
                              onClick={() => handleSelectClass(c)}
                              className={`p-6 rounded-[2rem] border-2 transition-all group ${
                                selectedClass === c.label ? "border-[#FF7F50] bg-[#FF7F50]/5" : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#FF7F50]/50"
                              }`}
                            >
                              <Table size={32} className={`mb-3 transition-colors ${selectedClass === c.label ? "text-[#FF7F50]" : "text-[var(--text-secondary)] group-hover:text-[var(--accent)]"}`} weight="duotone" />
                              <div className="font-black text-[var(--text-primary)] italic">{c.label}</div>
                              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-1 tracking-tighter">{c.count} Students</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                         <h4 className="text-xl font-black text-[var(--text-primary)] italic">Entering {term} Marks • {selectedClass}</h4>
                         <div className="px-4 py-2 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Draft Status
                         </div>
                      </div>
                      {publishError && <p className="text-sm font-bold text-rose-600 bg-rose-500/10 px-4 py-2 rounded-xl">{publishError}</p>}

                      <div className="overflow-hidden border border-[var(--border)] rounded-[2rem] bg-[var(--bg-primary)]">
                        <table className="w-full text-left">
                          <thead className="bg-[var(--bg-secondary)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] border-b border-[var(--border)]">
                            <tr>
                              <th className="px-8 py-5">Student</th>
                              <th className="px-8 py-5">Mathematics</th>
                              <th className="px-8 py-5">Science</th>
                              <th className="px-8 py-5">English</th>
                              <th className="px-8 py-5">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {marks.map((student, i) => (
                              <tr key={i} className="hover:bg-[var(--accent-glow)]/20 transition-colors">
                                <td className="px-8 py-5">
                                   <div className="font-bold text-[var(--text-primary)]">{student.name}</div>
                                   <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter">{student.studentProfileId.slice(0,8)}</div>
                                </td>
                                <td className="px-8 py-5">
                                   <input 
                                     type="text" 
                                     value={student.math} 
                                     onChange={(e) => updateMark(i, "math", e.target.value)}
                                     className="w-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-2 py-2.5 text-center font-black text-[var(--text-primary)] focus:border-[#FF7F50] outline-none shadow-sm"
                                   />
                                </td>
                                <td className="px-8 py-5">
                                   <input 
                                     type="text" 
                                     value={student.science} 
                                     onChange={(e) => updateMark(i, "science", e.target.value)}
                                     className="w-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-2 py-2.5 text-center font-black text-[var(--text-primary)] focus:border-[#FF7F50] outline-none shadow-sm"
                                   />
                                </td>
                                <td className="px-8 py-5">
                                   <input 
                                     type="text" 
                                     value={student.english} 
                                     onChange={(e) => updateMark(i, "english", e.target.value)}
                                     className="w-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-2 py-2.5 text-center font-black text-[var(--text-primary)] focus:border-[#FF7F50] outline-none shadow-sm"
                                   />
                                </td>
                                <td className="px-8 py-5 font-black text-[#FF7F50] text-lg italic">
                                   {safeTotal(student)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                       <div className="flex items-center justify-between pt-6">
                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] transition-colors uppercase text-[10px] tracking-widest">
                          <CaretLeft size={20} /> Change Selection
                        </button>
                        <div className="flex gap-4">
                           <button className="px-8 py-4 border border-[var(--border)] text-[var(--text-secondary)] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[var(--bg-primary)] transition-all">
                              Save Draft
                           </button>
                           <button 
                             onClick={handlePublish}
                             disabled={isPublishing}
                             className="flex items-center gap-2 px-12 py-4 bg-[var(--text-primary)] text-[var(--bg-secondary)] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                           >
                             {isPublishing ? "Syncing..." : "Submit to Admin"}
                             <CloudArrowUp size={20} weight="fill" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-8">
                    <CheckCircle size={64} weight="fill" />
                  </div>
                  <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Results Published</h3>
                  <p className="text-[var(--text-secondary)] max-w-sm mx-auto mb-10 leading-relaxed">
                    Term 1 results for <span className="font-bold text-[var(--text-primary)]">{selectedClass}</span> have been sent to all students and parents.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => { setStep(1); setSelectedClass(""); }}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-[#FF7F50] text-white rounded-2xl font-bold shadow-lg shadow-[#FF7F50]/30 hover:bg-[#e66a3e] transition-all"
                    >
                      Process Another Class
                    </button>
                    <button className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl font-bold hover:bg-[var(--bg-primary)] transition-all">
                      <FilePdf size={20} /> Generate Report Cards
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
          </div>
        </div>

        {/* Warning Panel */}
        {step === 2 && (
          <div className="mt-8 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex gap-4">
             <Warning size={24} className="text-rose-500 shrink-0" />
             <p className="text-sm text-rose-500 leading-relaxed">
                <span className="font-bold">Attention:</span> Publishing results is an irreversible action. Ensure all marks have been cross-verified against the physical answer scripts before final submission.
             </p>
          </div>
        )}
      </div>
    </PageSection>
  );
}
