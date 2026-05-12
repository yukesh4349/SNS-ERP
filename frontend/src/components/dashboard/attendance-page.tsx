"use client";

import { useCallback, useState } from "react";
import { useAuthResource } from "../../hooks/use-auth-resource";
import { getAttendance } from "../../services/mock-data-service";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { PageSection } from "./page-section";
import { ResourceError, ResourceLoading } from "./resource-states";
import { Users, Student, CheckCircle, XCircle, GraduationCap, CaretLeft, UserCircle, FloppyDisk, SpinnerGap, CheckSquare } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { markAttendance, markTeacherAttendance } from "../../services/attendance-service";
import { useAuth } from "../../hooks/use-auth";
import { Calendar } from "@phosphor-icons/react";

type AttendanceStatus = "Present" | "Absent" | "Not Marked";

export function AttendancePage() {
  const { session } = useAuth();
  const [view, setView] = useState<"student" | "class" | "teacher">("student");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  // localAttendance: keyed by class for students, "__TEACHERS__" for teachers
  const [localAttendance, setLocalAttendance] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  const loadAttendance = useCallback(
    (accessToken: string) => getAttendance(accessToken, selectedDate),
    [selectedDate],
  );
  const { data, error, isLoading } = useAuthResource(loadAttendance);

  const TEACHER_KEY = "__TEACHERS__";

  // ─── Student helpers ────────────────────────────────────────────
  const setStudentStatus = (rollNo: string, status: string) => {
    if (!selectedClass) return;
    setLocalAttendance({
      ...localAttendance,
      [selectedClass]: { ...(localAttendance[selectedClass] || {}), [rollNo]: status },
    });
  };

  const markAllStudentsPresent = () => {
    if (!selectedClass || !data) return;
    const students = data.studentsAttendance[selectedClass] || [];
    const all: Record<string, string> = {};
    students.forEach(s => { all[s.rollNo] = "Present"; });
    setLocalAttendance({ ...localAttendance, [selectedClass]: { ...(localAttendance[selectedClass] || {}), ...all } });
  };

  const markAllStudentsAbsent = () => {
    if (!selectedClass || !data) return;
    const students = data.studentsAttendance[selectedClass] || [];
    const all: Record<string, string> = {};
    students.forEach(s => { all[s.rollNo] = "Absent"; });
    setLocalAttendance({ ...localAttendance, [selectedClass]: { ...(localAttendance[selectedClass] || {}), ...all } });
  };

  const handleSaveStudentAttendance = async () => {
    if (!selectedClass || !data || !session?.accessToken) return;
    const students = data.studentsAttendance[selectedClass] || [];
    const [cls, sec] = selectedClass.split('-');
    const records = students.map(s => ({
      studentId: s.rollNo,
      status: localAttendance[selectedClass]?.[s.rollNo] || s.status || "Present",
    }));
    setSaving(true); setSaveMsg(null);
    try {
      const res = await markAttendance({ date: selectedDate, class: cls, section: sec ?? '', records });
      setSaveMsg(`✓ Saved ${res.marked} student records`);
      setShowConfirm(false);
    } catch { setSaveMsg("Failed to save. Try again."); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(null), 4000); }
  };

  const confirmSaveStudent = () => {
    setPendingAction(() => handleSaveStudentAttendance);
    setShowConfirm(true);
  };

  const getStudentCount = () => {
    if (!selectedClass || !data) return { present: 0, absent: 0, notMarked: 0, total: 0 };
    const students = data.studentsAttendance[selectedClass] || [];
    let present = 0, absent = 0, notMarked = 0;
    students.forEach(s => {
      const st = localAttendance[selectedClass]?.[s.rollNo] || s.status;
      if (st === "Present") present++; else if (st === "Absent") absent++; else notMarked++;
    });
    return { present, absent, notMarked, total: students.length };
  };

  // ─── Teacher helpers ────────────────────────────────────────────
  const toggleTeacherStatus = (empId: string) => {
    const teacher = data?.teachers?.find(t => t.empId === empId);
    const currentStatus = localAttendance[TEACHER_KEY]?.[empId] || teacher?.status || "Not Marked";
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    setLocalAttendance({
      ...localAttendance,
      [TEACHER_KEY]: { ...(localAttendance[TEACHER_KEY] || {}), [empId]: newStatus },
    });
  };

  const markAllTeachersPresent = () => {
    if (!data?.teachers) return;
    const all: Record<string, string> = {};
    data.teachers.forEach(t => { all[t.empId] = "Present"; });
    setLocalAttendance({ ...localAttendance, [TEACHER_KEY]: { ...(localAttendance[TEACHER_KEY] || {}), ...all } });
  };

  const markAllTeachersAbsent = () => {
    if (!data?.teachers) return;
    const all: Record<string, string> = {};
    data.teachers.forEach(t => { all[t.empId] = "Absent"; });
    setLocalAttendance({ ...localAttendance, [TEACHER_KEY]: { ...(localAttendance[TEACHER_KEY] || {}), ...all } });
  };

  const handleSaveTeacherAttendance = async () => {
    if (!data?.teachers || !session?.accessToken) return;
    const records = data.teachers.map(t => ({
      teacherId: t.empId,
      status: localAttendance[TEACHER_KEY]?.[t.empId] || t.status || "Present",
      department: t.department,
    }));
    setSaving(true); setSaveMsg(null);
    try {
      const res = await markTeacherAttendance({ date: selectedDate, records });
      setSaveMsg(`✓ Saved ${res.marked} teacher records`);
      setShowConfirm(false);
    } catch { setSaveMsg("Failed to save. Try again."); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(null), 4000); }
  };

  const confirmSaveTeacher = () => {
    setPendingAction(() => handleSaveTeacherAttendance);
    setShowConfirm(true);
  };

  const getTeacherCount = () => {
    if (!data?.teachers) return { present: 0, absent: 0, notMarked: 0, total: 0 };
    let present = 0, absent = 0, notMarked = 0;
    data.teachers.forEach(t => {
      const st = localAttendance[TEACHER_KEY]?.[t.empId] || t.status;
      if (st === "Present") present++; else if (st === "Absent") absent++; else notMarked++;
    });
    return { present, absent, notMarked, total: data.teachers.length };
  };

  // Derive class list
  const CLASSES = data ? Object.keys(data.studentsAttendance ?? {}).filter(k => k !== 'Unassigned') : [];

  return (
    <PageSection
      eyebrow="Attendance"
      title={
        selectedClass ? `Attendance: Class ${selectedClass}` :
        view === "teacher" ? "Teacher Attendance" :
        "Attendance Management"
      }
      description="Manage presence for both faculty and students. Mark and update records for any specific date."
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => { setView("student"); setSelectedClass(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${view === "student"
                ? "bg-[var(--text-primary)] text-[var(--bg-secondary)] shadow-lg shadow-black/20"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)]"
              }`}
          >
            <Student size={20} weight="duotone" />
            Student Attendance
          </button>
          <button
            onClick={() => { setView("class"); setSelectedClass(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${view === "class"
                ? "bg-[var(--text-primary)] text-[var(--bg-secondary)] shadow-lg shadow-black/20"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)]"
              }`}
          >
            <GraduationCap size={20} weight="duotone" />
            Attendance Report
          </button>
          <button
            onClick={() => { setView("teacher"); setSelectedClass(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${view === "teacher"
                ? "bg-[var(--text-primary)] text-[var(--bg-secondary)] shadow-lg shadow-black/20"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)]"
              }`}
          >
            <Users size={20} weight="duotone" />
            Teacher Attendance
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 rounded-2xl">
          <Calendar size={18} weight="duotone" className="text-[#FF7F50]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none cursor-pointer"
          />
        </div>
      </div>

      {isLoading ? <ResourceLoading label="attendance" /> : null}
      {error ? <ResourceError label="attendance" message={error} /> : null}
      
      {data && (
        <div className="space-y-8">

          {/* ═══════════════════════════════════════════════════════
              TEACHER ATTENDANCE TAB
              ═══════════════════════════════════════════════════════ */}
          {view === "teacher" && (
            <div className="space-y-6">
              {/* Teacher-specific metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Total Faculty" value={String(data.teacherSummary?.total ?? data.teachers?.length ?? 0)} />
                <MetricCard label="Present" value={String((() => { const c = getTeacherCount(); return c.present; })())} />
                <MetricCard label="Absent" value={String((() => { const c = getTeacherCount(); return c.absent; })())} />
                <MetricCard label="Not Marked" value={String((() => { const c = getTeacherCount(); return c.notMarked; })())} />
              </div>

              {/* Action bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Faculty Attendance</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Mark attendance for all teachers · {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Live counters */}
                  {(() => {
                    const counts = getTeacherCount();
                    return (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">{counts.present}P</span>
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg">{counts.absent}A</span>
                        {counts.notMarked > 0 && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">{counts.notMarked} unmarked</span>}
                      </div>
                    );
                  })()}

                  {saveMsg && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">{saveMsg}</span>}

                  {(session?.user.role === 'admin' || session?.user.role === 'superadmin') && (
                    <>
                      <button onClick={markAllTeachersPresent}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95">
                        <CheckSquare size={16} weight="bold" /> All Present
                      </button>
                      <button onClick={markAllTeachersAbsent}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-all active:scale-95">
                        <XCircle size={16} weight="bold" /> All Absent
                      </button>
                      <button onClick={confirmSaveTeacher} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7F50] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF7F50]/25 hover:bg-[#e66a3e] transition-all disabled:opacity-60">
                        {saving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
                        {saving ? "Saving..." : "Save Attendance"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Teacher table */}
              {data.teachers && data.teachers.length > 0 ? (
                <DataTable
                  columns={["Photo", "Emp ID", "Teacher Name", "Department", "Status", "Action"]}
                  rows={data.teachers.map((teacher) => {
                    const currentStatus = localAttendance[TEACHER_KEY]?.[teacher.empId] || teacher.status;
                    return [
                      <div key={`photo-${teacher.id}`} className="h-10 w-10 rounded-2xl overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`} alt={teacher.name} className="h-full w-full object-cover" />
                      </div>,
                      <span key={`emp-${teacher.id}`} className="font-bold text-[var(--text-secondary)] text-xs font-mono">#{teacher.empId.slice(0, 8)}</span>,
                      <div key={`name-${teacher.id}`}>
                        <div className="font-bold text-[var(--text-primary)]">{teacher.name}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-medium">{teacher.designation}</div>
                      </div>,
                      <span key={`dept-${teacher.id}`} className="text-sm text-[var(--text-secondary)] font-medium">{teacher.department || 'N/A'}</span>,
                      <span key={`status-${teacher.id}`} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        currentStatus === 'Present' ? 'bg-emerald-500/10 text-emerald-500' :
                        currentStatus === 'Absent' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {currentStatus}
                      </span>,
                      (session?.user.role === 'admin' || session?.user.role === 'superadmin') ? (
                        <button
                          key={`btn-${teacher.id}`}
                          onClick={() => toggleTeacherStatus(teacher.empId)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentStatus === 'Present'
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                        >
                          {currentStatus === 'Present' ? <XCircle size={14} weight="bold" /> : <CheckCircle size={14} weight="bold" />}
                          {currentStatus === 'Present' ? 'Mark Absent' : 'Mark Present'}
                        </button>
                      ) : <span key={`view-${teacher.id}`} className="text-[10px] text-slate-400 font-bold uppercase italic">View Only</span>
                    ];
                  })}
                />
              ) : (
                <div className="text-center py-16">
                  <Users size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-400 font-bold text-sm">No teachers found in the database.</p>
                  <p className="text-slate-300 text-xs mt-1">Add teacher accounts to see them here.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CLASS-WISE SUMMARY TAB
              ═══════════════════════════════════════════════════════ */}
          {view === "class" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Total Present" value={String(data.summary.present)} />
                <MetricCard label="On Leave/Absent" value={String(data.summary.onLeave)} />
                <MetricCard label="Late arrivals" value={String(data.summary.lateArrivals)} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] px-2">Class-wise Report</h3>
              <DataTable
                columns={["Class", "Total Students", "Present", "Absent", "Percentage"]}
                rows={(data.classWiseAttendance || []).map((entry) => [
                  <button
                    key={entry.class}
                    onClick={() => { setSelectedClass(entry.class); setView("student"); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {entry.class}
                  </button>,
                  String(entry.total),
                  String(entry.present),
                  String(entry.absent),
                  entry.percentage,
                ])}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STUDENT ATTENDANCE TAB
              ═══════════════════════════════════════════════════════ */}
          {view === "student" && (
            !selectedClass ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Total Present" value={String(data.summary.present)} />
                  <MetricCard label="On Leave/Absent" value={String(data.summary.onLeave)} />
                  <MetricCard label="Late arrivals" value={String(data.summary.lateArrivals)} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Select a Class</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Choose a class to mark or update student attendance records.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {CLASSES.map((cls) => (
                    <motion.button
                      key={cls}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedClass(cls)}
                      className="flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all gap-4"
                    >
                      <div className="h-16 w-16 rounded-3xl bg-[var(--bg-primary)] flex items-center justify-center text-[#FF7F50]">
                        <GraduationCap size={32} weight="duotone" />
                      </div>
                      <span className="text-2xl font-black text-[var(--text-primary)]">{cls}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                        {data.studentsAttendance[cls]?.length || 0} students
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <section className="w-full text-[var(--text-primary)]">
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-6"
                >
                  <CaretLeft size={16} weight="bold" /> Back to Classes
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Student Attendance</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Currently viewing records for <span className="text-blue-600 font-bold">Class {selectedClass}</span></p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {(() => {
                      const counts = getStudentCount();
                      return (
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">{counts.present}P</span>
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg">{counts.absent}A</span>
                          {counts.notMarked > 0 && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">{counts.notMarked} unmarked</span>}
                        </div>
                      );
                    })()}
                    {saveMsg && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">{saveMsg}</span>}
                    <button onClick={markAllStudentsPresent}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95">
                      <CheckSquare size={16} weight="bold" /> All Present
                    </button>
                    <button onClick={markAllStudentsAbsent}
                      className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-all active:scale-95">
                      <XCircle size={16} weight="bold" /> All Absent
                    </button>
                    <button onClick={confirmSaveStudent} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7F50] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF7F50]/25 hover:bg-[#e66a3e] transition-all disabled:opacity-60">
                      {saving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
                      {saving ? "Saving..." : "Save Attendance"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {(data.studentsAttendance?.[selectedClass] || []).map((student) => {
                    const currentStatus = localAttendance[selectedClass]?.[student.rollNo] || student.status;
                    return (
                      <motion.div
                        key={student.rollNo}
                        whileHover={{ y: -5 }}
                        onClick={() => setStudentStatus(student.rollNo, currentStatus === "Present" ? "Absent" : "Present")}
                        className={`relative group cursor-pointer overflow-hidden rounded-[2.5rem] border-2 transition-all ${
                          currentStatus === "Present" 
                            ? "border-emerald-500 bg-emerald-50/30 shadow-xl shadow-emerald-500/10" 
                            : currentStatus === "Absent"
                              ? "border-rose-500 bg-rose-50/30 shadow-xl shadow-rose-500/10"
                              : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#FF7F50]"
                        }`}
                      >
                        {/* Student Poster Image */}
                        <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-primary)]">
                          <img 
                            src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} 
                            alt={student.name} 
                            className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                          {/* Status Overlay */}
                          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                            currentStatus === "Present" ? "bg-emerald-500/10 opacity-100" : 
                            currentStatus === "Absent" ? "bg-rose-500/10 opacity-100" : "opacity-0"
                          }`}>
                             {currentStatus === "Present" && <CheckCircle size={80} weight="fill" className="text-emerald-500/40" />}
                             {currentStatus === "Absent" && <XCircle size={80} weight="fill" className="text-rose-500/40" />}
                          </div>
                        </div>

                        {/* Student Info Bar */}
                        <div className="p-5 space-y-1">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-[var(--text-secondary)] tracking-widest uppercase">#{student.rollNo}</span>
                             <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                               currentStatus === "Present" ? "bg-emerald-500 text-white" :
                               currentStatus === "Absent" ? "bg-rose-500 text-white" :
                               "bg-slate-200 text-slate-500"
                             }`}>
                               {currentStatus}
                             </span>
                          </div>
                          <h4 className="font-black text-lg text-[var(--text-primary)] leading-tight truncate">{student.name}</h4>
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold">Class {selectedClass}</p>
                        </div>

                        {/* Hover Prompt */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                              {currentStatus === "Present" ? <XCircle size={20} className="text-rose-500" /> : <CheckCircle size={20} className="text-emerald-500" />}
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      )}

      {/* Verification Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="h-16 w-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6">
              <CheckCircle size={32} weight="duotone" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Confirm Attendance</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-8 font-medium leading-relaxed">
              Are you sure you want to submit the attendance records for <span className="text-[var(--text-primary)] font-bold">{new Date(selectedDate).toLocaleDateString()}</span>? This will update the database in real-time.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 rounded-2xl border border-[var(--border)] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={pendingAction}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-2xl bg-[#FF7F50] text-white font-bold shadow-lg shadow-[#FF7F50]/25 hover:bg-[#e66a3e] transition-all disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageSection>
  );
}
