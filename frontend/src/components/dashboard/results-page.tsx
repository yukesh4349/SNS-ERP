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
  SpinnerGap
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getStudents } from "../../services/data-service";
import { bulkSaveResults } from "../../services/exam-service";

type Step = 1 | 2 | 3;

interface MarkEntry { name: string; studentProfileId: string; math: string; science: string; english: string; }
interface ClassInfo { label: string; count: number; students: { name: string; profileId: string }[]; rawClass: string; rawSection: string; }

export function ResultsPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassInfo, setSelectedClassInfo] = useState<ClassInfo | null>(null);
  const [term, setTerm] = useState("Term Exams");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [marks, setMarks] = useState<MarkEntry[]>([]);

  useEffect(() => {
    getStudents()
      .then((data: any) => {
        const grouped: Record<string, { students: { name: string; profileId: string }[]; rawClass: string; rawSection: string }> = {};
        for (const u of data) {
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

  return (
    <PageSection
      eyebrow="Academic Performance"
      title="Results Flow"
      description="Record, validate, and publish academic results following the official grading workflow."
    >
      <div className="max-w-5xl mx-auto">
        <div className="rounded-[2.5rem] border border-[var(--border)] bg-white overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.05)]">

          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#FF7F50] flex items-center justify-center text-white shadow-lg shadow-[#FF7F50]/20">
                   <GraduationCap size={28} weight="fill" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900">Result Management</h3>
                   <p className="text-xs text-slate-500 font-medium">Session 2024-25 • Term 1</p>
                </div>
             </div>
             <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-[#FF7F50]" : "bg-slate-200"}`} />
                ))}
             </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center max-w-md mx-auto py-6">
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">Select Class</h4>
                    <p className="text-sm text-slate-500">Choose the class to begin mark entry for the current term.</p>
                  </div>

                  {isLoadingClasses ? (
                    <div className="flex items-center justify-center py-12">
                      <SpinnerGap size={32} className="animate-spin text-[#FF7F50]" />
                    </div>
                  ) : classes.length === 0 ? (
                    <p className="text-center text-slate-400 py-12">No classes found. Add students via Admission first.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {classes.map((c) => (
                        <button
                          key={c.label}
                          onClick={() => handleSelectClass(c)}
                          className={`p-6 rounded-3xl border-2 transition-all group ${
                            selectedClass === c.label ? "border-[#FF7F50] bg-[#FF7F50]/5" : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <Table size={32} className={`mb-3 transition-colors ${selectedClass === c.label ? "text-[#FF7F50]" : "text-slate-300 group-hover:text-slate-400"}`} />
                          <div className="font-bold text-slate-900">{c.label}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{c.count} {c.count === 1 ? "Student" : "Students"}</div>
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
                     <h4 className="text-xl font-bold text-slate-900">Entering Marks for {selectedClass}</h4>
                      <select value={term} onChange={e => setTerm(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                        {["Periodic Tests", "Term Exams", "Cycle Tests", "Assessment Scores"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  {publishError && <p className="text-sm font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl">{publishError}</p>}

                  <div className="overflow-hidden border border-slate-100 rounded-3xl">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Mathematics</th>
                          <th className="px-6 py-4">Science</th>
                          <th className="px-6 py-4">English</th>
                          <th className="px-6 py-4">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {marks.map((student, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.math} 
                                 onChange={(e) => updateMark(i, "math", e.target.value)}
                                 className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.science} 
                                 onChange={(e) => updateMark(i, "science", e.target.value)}
                                 className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.english} 
                                 onChange={(e) => updateMark(i, "english", e.target.value)}
                                 className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4 font-bold text-[#FF7F50]">
                               {safeTotal(student)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                      <CaretLeft size={20} /> Back
                    </button>
                    <div className="flex gap-4">
                       <button className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                          Save Draft
                       </button>
                       <button 
                         onClick={handlePublish}
                         className="flex items-center gap-2 px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all"
                       >
                         {isPublishing ? "Publishing..." : "Publish Results"}
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
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-8">
                    <CheckCircle size={64} weight="fill" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Results Published</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed">
                    Term 1 results for <span className="font-bold text-slate-900">{selectedClass}</span> have been sent to all students and parents.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => { setStep(1); setSelectedClass(""); }}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-[#FF7F50] text-white rounded-2xl font-bold shadow-lg shadow-[#FF7F50]/30 hover:bg-[#e66a3e] transition-all"
                    >
                      Process Another Class
                    </button>
                    <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                      <FilePdf size={20} /> Generate Report Cards
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Warning Panel */}
        {step === 2 && (
          <div className="mt-8 p-6 rounded-3xl bg-rose-50 border border-rose-100 flex gap-4">
             <Warning size={24} className="text-rose-500 shrink-0" />
             <p className="text-sm text-rose-700 leading-relaxed">
                <span className="font-bold">Attention:</span> Publishing results is an irreversible action. Ensure all marks have been cross-verified against the physical answer scripts before final submission.
             </p>
          </div>
        )}
      </div>
    </PageSection>
  );
}
