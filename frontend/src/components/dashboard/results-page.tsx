"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Table,
  CloudArrowUp,
  CheckCircle,
  CaretLeft,
  CaretRight,
  FilePdf,
  Warning,
  SpinnerGap,
  Printer,
  XCircle,
  User,
  Medal,
  Certificate
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getStudents } from "../../services/data-service";
import { bulkSaveResults, approveResults } from "../../services/exam-service";
import { toast } from "sonner";

type Step = 1 | 2 | 3;

interface MarkEntry {
  name: string;
  studentProfileId: string;
  math: string;
  science: string;
  english: string;
}

interface ClassInfo {
  label: string;
  count: number;
  students: { name: string; profileId: string }[];
  rawClass: string;
  rawSection: string;
}

function getGradeInfo(score: number): { grade: string; remarks: string; color: string } {
  if (score >= 90) return { grade: "A+", remarks: "Outstanding", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 80) return { grade: "A", remarks: "Excellent", color: "text-emerald-500" };
  if (score >= 70) return { grade: "B+", remarks: "Very Good", color: "text-blue-500" };
  if (score >= 60) return { grade: "B", remarks: "Good", color: "text-blue-400" };
  if (score >= 50) return { grade: "C", remarks: "Satisfactory", color: "text-amber-500" };
  if (score >= 35) return { grade: "D", remarks: "Pass", color: "text-orange-500" };
  return { grade: "F", remarks: "Needs Improvement", color: "text-rose-500" };
}

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

  // Report Card Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

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
    const num = value.replace(/[^0-9]/g, "");
    if (num && parseInt(num, 10) > 100) return;
    const newMarks = [...marks];
    (newMarks[index] as any)[subject] = num;
    setMarks(newMarks);
  };

  const safeTotal = (m: MarkEntry) => {
    const a = parseInt(m.math) || 0;
    const b = parseInt(m.science) || 0;
    const c = parseInt(m.english) || 0;
    if (!m.math && !m.science && !m.english) return "—";
    return a + b + c;
  };

  const handleSaveDraft = async () => {
    if (!selectedClassInfo) return;
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
      toast.success("Draft marks saved successfully.");
    } catch (err: any) {
      setPublishError(err?.message || "Failed to save draft.");
    }
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
      await approveResults(selectedClassInfo.rawClass, selectedClassInfo.rawSection, term);
      setStep(3);
      toast.success("Results published and report cards ready!");
    } catch (err: any) {
      setPublishError(err?.message || "Failed to publish results.");
    } finally {
      setIsPublishing(false);
    }
  };

  const openReportCardModal = (studentIndex = 0) => {
    if (marks.length === 0) {
      toast.error("No students available to generate report cards.");
      return;
    }
    setSelectedStudentIndex(studentIndex);
    setShowReportModal(true);
  };

  // Active student for report card
  const activeStudent = marks[selectedStudentIndex] || marks[0] || { name: "Student", studentProfileId: "ID", math: "0", science: "0", english: "0" };
  const mathScore = parseInt(activeStudent.math) || 0;
  const sciScore = parseInt(activeStudent.science) || 0;
  const engScore = parseInt(activeStudent.english) || 0;
  const totalScore = mathScore + sciScore + engScore;
  const percentage = Math.round((totalScore / 300) * 100);
  const overallGrade = getGradeInfo(percentage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageSection
      eyebrow="Academic Performance"
      title="Results & Report Cards"
      description="Record marks, validate student evaluations, generate formal report cards, and publish term results."
    >
      {/* REPORT CARD VIEWER & PRINT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Top Control Bar */}
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl">
                    <Certificate size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Academic Report Card</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Preview & Print Student Evaluation</p>
                  </div>
                </div>

                {/* Student Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student:</span>
                  <select
                    value={selectedStudentIndex}
                    onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#FF7F50]"
                  >
                    {marks.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {idx + 1}. {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md"
                  >
                    <Printer size={16} weight="bold" />
                    Print / PDF
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    <XCircle size={24} weight="fill" />
                  </button>
                </div>
              </div>

              {/* REPORT CARD PRINTABLE CANVAS */}
              <div id="sns-report-card" className="p-8 sm:p-12 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {/* Official School Header */}
                <div className="text-center pb-6 border-b-2 border-slate-900 dark:border-slate-100">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#FF7F50] mb-1">
                    <GraduationCap size={20} weight="fill" /> SNS ACADEMY
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                    An International CBSE Fingerprint School
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    SNS Kalvi Nagar, Sathy Main Road, Saravanampatti Post, Coimbatore - 641035
                  </p>
                  <div className="mt-3 inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Official Student Progress Report • {term} (2024–2025)
                  </div>
                </div>

                {/* Student Profile Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Student Name</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{activeStudent.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Class & Section</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedClass || "Class 10A"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Roll / ID</div>
                    <div className="font-bold font-mono text-slate-900 dark:text-white text-sm mt-0.5">{activeStudent.studentProfileId.slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Attendance</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">96.8% (Present)</div>
                  </div>
                </div>

                {/* Scholastic Evaluation Table */}
                <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3 text-center">Max Marks</th>
                        <th className="px-5 py-3 text-center">Obtained</th>
                        <th className="px-5 py-3 text-center">Grade</th>
                        <th className="px-5 py-3 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {[
                        { name: "Mathematics", score: mathScore },
                        { name: "Science", score: sciScore },
                        { name: "English Language & Literature", score: engScore },
                      ].map((sub, idx) => {
                        const gi = getGradeInfo(sub.score);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                            <td className="px-5 py-3.5 text-center text-slate-400">100</td>
                            <td className="px-5 py-3.5 text-center font-bold font-mono text-sm">{sub.score || "0"}</td>
                            <td className={`px-5 py-3.5 text-center font-black ${gi.color}`}>{gi.grade}</td>
                            <td className="px-5 py-3.5 text-right text-slate-500 dark:text-slate-400">{gi.remarks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <td className="px-5 py-3.5 uppercase tracking-wider text-slate-900 dark:text-white">Aggregate Result</td>
                        <td className="px-5 py-3.5 text-center text-slate-400">300</td>
                        <td className="px-5 py-3.5 text-center font-mono text-base text-[#FF7F50]">{totalScore}</td>
                        <td className={`px-5 py-3.5 text-center font-black text-base ${overallGrade.color}`}>
                          {overallGrade.grade}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-900 dark:text-white">
                          {percentage}% ({overallGrade.remarks})
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Co-Curricular & Traits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Discipline & Conduct</div>
                    <div className="text-slate-500 dark:text-slate-400">Exemplary behavior in classroom & campus activities.</div>
                    <div className="mt-2 font-bold text-emerald-600">Grade: A+</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Teamwork & Leadership</div>
                    <div className="text-slate-500 dark:text-slate-400">Active participation in school projects & sports.</div>
                    <div className="mt-2 font-bold text-emerald-600">Grade: A</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Teacher Remarks</div>
                    <div className="text-slate-500 dark:text-slate-400">Consistent effort and strong critical thinking abilities.</div>
                    <div className="mt-2 font-bold text-blue-600">Status: Promoted</div>
                  </div>
                </div>

                {/* Signatures Line */}
                <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-slate-600 dark:text-slate-400">
                    Class Teacher Signature
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-slate-600 dark:text-slate-400">
                    Exam Controller Seal
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-slate-600 dark:text-slate-400">
                    Principal's Signature
                  </div>
                </div>
              </div>

              {/* Modal Pagination Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
                <button
                  disabled={selectedStudentIndex <= 0}
                  onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                >
                  <CaretLeft size={16} /> Previous Student
                </button>
                <span className="text-xs font-bold text-slate-400">
                  Student {selectedStudentIndex + 1} of {marks.length}
                </span>
                <button
                  disabled={selectedStudentIndex >= marks.length - 1}
                  onClick={() => setSelectedStudentIndex(prev => Math.min(marks.length - 1, prev + 1))}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                >
                  Next Student <CaretRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="rounded-[2.5rem] border border-[var(--border)] bg-white dark:bg-slate-900 overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.05)]">

          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 px-8 py-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#FF7F50] flex items-center justify-center text-white shadow-lg shadow-[#FF7F50]/20">
                   <GraduationCap size={28} weight="fill" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Result Management</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Session 2024-25 • Term 1</p>
                </div>
             </div>
             <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-[#FF7F50]" : "bg-slate-200 dark:bg-slate-700"}`} />
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
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select Class</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose the class to begin mark entry and report card generation.</p>
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
                            selectedClass === c.label 
                              ? "border-[#FF7F50] bg-[#FF7F50]/5 dark:bg-[#FF7F50]/10" 
                              : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                          }`}
                        >
                          <Table size={32} className={`mb-3 transition-colors ${selectedClass === c.label ? "text-[#FF7F50]" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"}`} />
                          <div className="font-bold text-slate-900 dark:text-white">{c.label}</div>
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
                     <h4 className="text-xl font-bold text-slate-900 dark:text-white">Entering Marks for {selectedClass}</h4>
                     <div className="flex items-center gap-3">
                        <select 
                          value={term} 
                          onChange={e => setTerm(e.target.value)} 
                          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none"
                        >
                          {["Periodic Tests", "Term Exams", "Cycle Tests", "Assessment Scores"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          onClick={() => openReportCardModal(0)}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                          <FilePdf size={16} className="text-[#FF7F50]" />
                          Preview Report Card
                        </button>
                     </div>
                  </div>
                  {publishError && <p className="text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 rounded-xl">{publishError}</p>}

                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-3xl">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Mathematics (100)</th>
                          <th className="px-6 py-4">Science (100)</th>
                          <th className="px-6 py-4">English (100)</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4 text-right">Card</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {marks.map((student, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{student.name}</td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.math} 
                                 onChange={(e) => updateMark(i, "math", e.target.value)}
                                 placeholder="0"
                                 className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.science} 
                                 onChange={(e) => updateMark(i, "science", e.target.value)}
                                 placeholder="0"
                                 className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                 type="text" 
                                 value={student.english} 
                                 onChange={(e) => updateMark(i, "english", e.target.value)}
                                 placeholder="0"
                                 className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white focus:border-[#FF7F50] outline-none"
                               />
                            </td>
                            <td className="px-6 py-4 font-bold text-[#FF7F50]">
                               {safeTotal(student)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openReportCardModal(i)}
                                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#FF7F50] transition-colors inline-flex items-center gap-1"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white transition-colors">
                      <CaretLeft size={20} /> Back
                    </button>
                    <div className="flex gap-4">
                       <button 
                         onClick={handleSaveDraft}
                         className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                       >
                          Save Draft
                       </button>
                       <button 
                         onClick={handlePublish}
                         disabled={isPublishing}
                         className="flex items-center gap-2 px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-sm disabled:opacity-50"
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
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 mb-8">
                    <CheckCircle size={64} weight="fill" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Results Published</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                    Term results for <span className="font-bold text-slate-900 dark:text-white">{selectedClass}</span> have been finalized and recorded in the database.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => { setStep(1); setSelectedClass(""); }}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-[#FF7F50] text-white rounded-2xl font-bold shadow-lg shadow-[#FF7F50]/30 hover:bg-[#e66a3e] transition-all"
                    >
                      Process Another Class
                    </button>
                    <button 
                      onClick={() => openReportCardModal(0)}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                      <FilePdf size={20} className="text-[#FF7F50]" /> Generate Report Cards
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Warning Panel */}
        {step === 2 && (
          <div className="mt-8 p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex gap-4">
             <Warning size={24} className="text-rose-500 shrink-0" />
             <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                <span className="font-bold">Attention:</span> Publishing results is an official action. Ensure all marks have been cross-verified before publishing. You can click "Preview Report Card" at any point to examine the formal student certificates.
             </p>
          </div>
        )}
      </div>
    </PageSection>
  );
}
