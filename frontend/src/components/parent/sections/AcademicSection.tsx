"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChartBar, 
  CalendarCheck, 
  CalendarBlank, 
  PaperPlaneTilt, 
  ClipboardText,
  FileArrowUp,
  DownloadSimple,
  SealCheck,
  TrendUp,
  User,
  IdentificationCard,
  Quotes,
  CaretLeft,
  CaretRight
} from "@phosphor-icons/react";

import { Student, AcademicTab } from "../../../types/dashboard";
import { DashboardTheme } from "../../../types/theme";
import { apiRequest } from "../../../services/api-client";
import { useAuth } from "../../../hooks/use-auth";
import { getStudentTimetable, TimetableEntry } from "../../../services/timetable-service";
import { getStudentExamResults, ExamResult, getExamSchedule, ExamScheduleEntry } from "../../../services/exam-service";
import { getAnnouncements } from "../../../services/announcements-service";
import { getStudentAttendance, AttendanceRecord } from "../../../services/attendance-service";

const tabs: { key: AcademicTab | "timetable"; label: string; icon: React.ReactNode }[] = [
  { key: "calendar",   label: "Academic Calendar", icon: <CalendarBlank size={15} /> },
  { key: "attendance", label: "Attendance",         icon: <CalendarCheck size={15} /> },
  { key: "timetable",  label: "Time Table",         icon: <ClipboardText size={15} /> },
  { key: "exam",       label: "Exam Report Card",   icon: <ChartBar size={15} /> },
  { key: "schedule",   label: "Exam Schedule",      icon: <ClipboardText size={15} /> },
  { key: "assessment", label: "Assessment Reports", icon: <ClipboardText size={15} /> },
  { key: "leave",      label: "Leave Application",  icon: <PaperPlaneTilt size={15} /> },
];

const periodHeaders = ["I", "II", "III", "IV", "LUNCH", "V", "VI", "VII", "VIII"];

export default function AcademicSection({ student, theme, initialTab, mode = "academic" }: { student: Student; theme: DashboardTheme; initialTab?: AcademicTab | "timetable", mode?: "academic" | "reports" }) {
  const { session } = useAuth();
  
  const displayTabs = tabs.filter(t => {
    if (mode === "reports") {
      return ["exam", "schedule", "assessment"].includes(t.key);
    }
    return ["calendar", "attendance", "timetable", "leave"].includes(t.key);
  });

  const defaultTab = mode === "reports" ? "exam" : "calendar";
  const [activeTab, setActiveTab] = useState<AcademicTab | "calendar" | "attendance" | "exam" | "schedule" | "leave" | "timetable" | "assessment">(
    (initialTab && displayTabs.some(t => t.key === initialTab)) ? initialTab : defaultTab
  );
  const [examType, setExamType] = useState<"periodic" | "cycle" | "term">("term");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [examSchedule, setExamSchedule] = useState<ExamScheduleEntry[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportAttendance, setReportAttendance] = useState("0%");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!student.id || student.id === "N/A") return;

    setIsLoading(true);
    
    // Fetch Timetable
    if (student.class && student.section && student.class !== "N/A" && student.section !== "N/A") {
      getStudentTimetable(student.class, student.section)
        .then(setTimetable)
        .catch(() => {});
    }

    // Fetch Exam Results
    getStudentExamResults(student.id)
      .then(setExamResults)
      .catch(() => {});

    // Fetch Attendance Percentage for Report Card
    apiRequest<{ attendance: { value: string } }>(`/dashboard/parent/${student.id}`)
      .then(stats => setReportAttendance(stats.attendance.value))
      .catch(() => setReportAttendance("0%"));

    // Fetch announcements for calendar events
    getAnnouncements(0, 100)
      .then(setAnnouncements)
      .catch(() => {});

    // Fetch exam schedule
    if (student.class && student.section && student.class !== "N/A" && student.section !== "N/A") {
      getExamSchedule(student.class, student.section)
        .then(setExamSchedule)
        .catch(() => {});
    }

    setIsLoading(false);
  }, [student.id, student.class, student.section]);

  // Re-fetch attendance whenever the displayed month changes
  useEffect(() => {
    if (!student.studentId || student.studentId === "N/A") return;
    const month = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    getStudentAttendance(student.studentId, month)
      .then(setAttendanceRecords)
      .catch(() => {});
  }, [student.studentId, currentDate]);

  // Map flat timetable entries to the 2D grid format used in the UI
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mappedTimeTable = days.map(day => {
    const dayEntries = timetable.filter(e => e.day === day);
    const periods = Array(9).fill("");
    periods[4] = "LUNCH"; // Standard lunch period
    
    dayEntries.forEach(entry => {
      // Mapping: 1->0, 2->1, 3->2, 4->3, (LUNCH at 4), 5->5, 6->6, 7->7, 8->8
      const idx = entry.period <= 4 ? entry.period - 1 : entry.period;
      if (idx < 9) periods[idx] = entry.subject;
    });
    
    return { day, periods };
  });

  const displayTimeTable = mappedTimeTable;

  // Filter exam results by selected term
  const termMapping: Record<string, string> = {
    periodic: "Periodic I",
    cycle: "Cycle II",
    term: "Annual"
  };
  const filteredResults = examResults.filter(r => r.term.includes(termMapping[examType]) || r.term === examType);
  const displayResults = filteredResults.length > 0 ? {
    term: filteredResults[0].term,
    subjects: filteredResults.map(r => ({ name: r.subject, internal: r.internal, exam: r.exam, total: r.total, grade: r.grade })),
    attendance: reportAttendance,
    percentage: (filteredResults.reduce((acc, r) => acc + r.total, 0) / (filteredResults.length * 100) * 100).toFixed(1) + "%",
    remarks: filteredResults[0].remarks || `Good performance in ${filteredResults[0].term}.`
  } : {
    term: "No Data",
    subjects: [],
    attendance: reportAttendance,
    percentage: "0%",
    remarks: "No examination records found for this term."
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Build monthData from real API records (falls back to empty if none)
  const monthData: Record<number, { status: string; reason?: string }> = {};
  attendanceRecords.forEach(r => {
    const day = parseInt(r.date.split('-')[2]);
    monthData[day] = { status: r.status, reason: r.reason };
  });
  const totalPresent = Object.values(monthData).filter(d => d.status === "P").length;
  const totalAbsent = Object.values(monthData).filter(d => d.status === "A").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", padding: "6px", borderRadius: 16, width: "fit-content" }}>
        {displayTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 800,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: isActive 
                  ? "linear-gradient(135deg, #FF7F50, #e66a3e)" 
                  : "transparent",
                color: isActive ? "#FFFFFF" : theme.textMuted,
                boxShadow: isActive 
                  ? "0 10px 20px rgba(255, 127, 80, 0.25)" 
                  : "none",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
              }}
            >
              {tab.icon}
              <span style={{ letterSpacing: "0.02em" }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {/* Exam Type Filter (only for Exam tabs) */}
      {(activeTab === "exam" || activeTab === "schedule") && (
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {[
            { id: "periodic", label: "Periodic Exam" },
            { id: "cycle",    label: "Cycle Exam" },
            { id: "term",     label: "Term Exam" },
          ].map(type => (
            <button 
              key={type.id} 
              onClick={() => setExamType(type.id as any)}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: examType === type.id 
                  ? "linear-gradient(135deg, #FF7F50, #e66a3e)" 
                  : (theme.isDark ? "rgba(255,255,255,0.03)" : "#F1F5F9"),
                color: examType === type.id ? "#FFFFFF" : theme.textMuted,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "0.3s ease",
                boxShadow: examType === type.id ? "0 6px 12px rgba(255,127,80,0.15)" : "none"
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
          
          {(activeTab === "attendance" || activeTab === "calendar") && (
            <div className="premium-card" style={{ padding: "16px" }}>
              {activeTab === "attendance" && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#10B981", textTransform: "uppercase", marginBottom: 2 }}>Present</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#10B981" }}>{totalPresent} Days</p>
                  </div>
                  <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#EF4444", textTransform: "uppercase", marginBottom: 2 }}>Absent</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#EF4444" }}>{totalAbsent} Day{totalAbsent !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              <CalendarGrid 
                theme={theme} 
                date={currentDate} 
                onPrev={handlePrevMonth} 
                onNext={handleNextMonth}
                data={monthData} 
                announcements={announcements}
                type={activeTab === "attendance" ? "attendance" : "events"} 
              />
              <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <LegendItem color={theme.success} label="Present" theme={theme} />
                <LegendItem color={theme.danger} label="Absent" theme={theme} />
                <LegendItem color="#3B82F6" label="Leave" theme={theme} />
                <LegendItem color={theme.isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9"} label="Holiday" theme={theme} />
              </div>
            </div>
          )}

          {activeTab === "timetable" && (
            <div className="premium-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${theme.border}` }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                      <th style={{ padding: "20px", textAlign: "left", fontSize: 11, fontWeight: 900, color: "#475569", textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>DAY/PERIOD</th>
                      {periodHeaders.map(h => (
                        <th key={h} style={{ padding: "20px", textAlign: "center", fontSize: 13, fontWeight: 900, color: "#1e293b", borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTimeTable.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: ri < displayTimeTable.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                        <td style={{ padding: "20px", fontSize: 14, fontWeight: 900, color: "#1e293b", background: theme.isDark ? "rgba(255,255,255,0.01)" : "transparent" }}>{row.day}</td>
                        {row.periods.map((p, pi) => {
                          const isLunch = p === "LUNCH";
                          const isSpecial = p === "L A B" || p === "L I B R A R Y" || p === "S E M I N A R" || p === "SPORTS";
                          return (
                            <td key={pi} style={{ 
                              padding: "20px", 
                              textAlign: "center", 
                              fontSize: 13, 
                              fontWeight: isLunch || isSpecial ? 900 : 700,
                              color: isLunch ? "#94a3b8" : (isSpecial ? "#475569" : "#334155"),
                              background: isLunch ? "transparent" : (p === "" ? "transparent" : (theme.isDark ? "rgba(255,255,255,0.02)" : "white")),
                              letterSpacing: isSpecial ? "0.2em" : "normal",
                              opacity: isLunch ? 0.6 : 1
                            }}>
                              {p === "SPORTS" ? (
                                <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>SPORTS</span>
                              ) : p}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "exam" && (
            <div className="premium-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${theme.border}` }}>
              {/* Report Card Header */}
              <div style={{ padding: "40px", background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: "white", padding: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
                      <img src="/images/logo.png" alt="SNS Logo" style={{ width: "100%", height: "auto" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 900, color: theme.text, letterSpacing: "-0.02em" }}>SNS ACADEMY</h2>
                      <p style={{ fontSize: 13, fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>{displayResults.term}</p>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: "12px 20px", borderRadius: 12, background: theme.primary, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 14 }}>
                    <DownloadSimple size={20} weight="bold" /> Download PDF
                  </motion.button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                  <InfoField icon={<User size={18} />} label="Student Name" value={student.name} theme={theme} />
                  <InfoField icon={<IdentificationCard size={18} />} label="Student ID" value={student.studentId !== "N/A" ? student.studentId : "Not Assigned"} theme={theme} />
                  <InfoField icon={<ChartBar size={18} />} label="Grade & Section" value={`${student.class}-${student.section}`} theme={theme} />
                </div>
              </div>

              {/* Marks Table */}
              <div style={{ padding: "0 40px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "24px 0", textAlign: "left", fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>Subject</th>
                      <th style={{ padding: "24px 0", textAlign: "center", fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>Internal (20)</th>
                      <th style={{ padding: "24px 0", textAlign: "center", fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>Exam (80)</th>
                      <th style={{ padding: "24px 0", textAlign: "center", fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>Total (100)</th>
                      <th style={{ padding: "24px 0", textAlign: "right", fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayResults.subjects.map((s: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: "20px 0", fontSize: 16, fontWeight: 800, color: theme.text }}>{s.name}</td>
                        <td style={{ padding: "20px 0", textAlign: "center", fontSize: 15, fontWeight: 600, color: theme.textMuted }}>{s.internal}</td>
                        <td style={{ padding: "20px 0", textAlign: "center", fontSize: 15, fontWeight: 600, color: theme.textMuted }}>{s.exam}</td>
                        <td style={{ padding: "20px 0", textAlign: "center", fontSize: 16, fontWeight: 900, color: theme.primary }}>{s.total}</td>
                        <td style={{ padding: "20px 0", textAlign: "right" }}>
                          <span style={{ padding: "6px 12px", borderRadius: 8, background: theme.primary + "10", color: theme.primary, fontWeight: 800, fontSize: 13 }}>{s.grade}</span>
                        </td>
                      </tr>
                    ))}
                    {displayResults.subjects.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: theme.textMuted, fontWeight: 600 }}>
                          No subjects recorded for this exam term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div style={{ padding: "40px", background: theme.isDark ? "rgba(255,255,255,0.01)" : "#FFFFFF" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <SummaryCard label="Percentage" value={displayResults.percentage} icon={<TrendUp size={24} />} theme={theme} />
                    <SummaryCard label="Attendance" value={displayResults.attendance} icon={<SealCheck size={24} />} theme={theme} />
                  </div>
                  <div style={{ padding: "24px", borderRadius: 20, background: theme.isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${theme.border}`, position: "relative" }}>
                    <Quotes size={32} weight="fill" style={{ position: "absolute", top: -16, left: 20, color: theme.primary + "30" }} />
                    <p style={{ fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", marginBottom: 12 }}>Teacher's Remarks</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, lineHeight: "1.7", fontStyle: "italic" }}>{displayResults.remarks}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="premium-card" style={{ padding: "32px" }}>
              {examSchedule.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: theme.textMuted }}>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No exam schedule published yet.</p>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>The school admin will publish the exam timetable soon.</p>
                </div>
              ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
                {examSchedule.map((e, i) => (
                  <div key={e.id} style={{
                    padding: "24px",
                    borderRadius: 20,
                    border: `1px solid ${theme.border}`,
                    background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: theme.primary, textTransform: "uppercase", background: theme.primary + "10", padding: "4px 10px", borderRadius: 8 }}>{e.term}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted }}>{new Date(e.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{e.subject}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <p style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>⏰ {e.startTime}{e.duration ? ` (${e.duration})` : ''}</p>
                      {e.hall && <p style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>📍 {e.hall}</p>}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeTab === "assessment" && (
            <div className="premium-card" style={{ padding: "32px" }}>
              <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>Assessment Reports</h3>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                {examResults.filter(r => r.term.toLowerCase().includes('assessment')).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: theme.textMuted, gridColumn: "1/-1" }}>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No assessment reports available.</p>
                  </div>
                ) : (
                  examResults.filter(r => r.term.toLowerCase().includes('assessment')).map((r, i) => (
                    <div key={r.id} style={{
                      padding: "20px",
                      borderRadius: 16,
                      border: `1px solid ${theme.border}`,
                      background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: theme.primary, textTransform: "uppercase" }}>{r.term}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted }}>{r.subject}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <p style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Total Score</p>
                          <h4 style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>{r.total}/100</h4>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ padding: "6px 12px", borderRadius: 8, background: theme.primary + "10", color: theme.primary, fontWeight: 800, fontSize: 13 }}>Grade: {r.grade}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "leave" && (
            <div className="premium-card" style={{ padding: "32px", maxWidth: 650 }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: theme.text, marginBottom: 4 }}>Apply for Leave</h3>
                <p style={{ color: theme.textMuted, fontWeight: 600, fontSize: 13 }}>Student: {student.name} ({student.class}-{student.section})</p>
              </div>

              {leaveSubmitted ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eefdf3", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>✓</div>
                  <h4 style={{ fontSize: 20, fontWeight: 900, color: theme.text, marginBottom: 8 }}>Application Submitted!</h4>
                  <p style={{ color: theme.textMuted, fontWeight: 600, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px", fontSize: 14 }}>The leave request for <strong>{student.name}</strong> of class <strong>{student.class}-{student.section}</strong> has been sent to the administrator.</p>
                  <button onClick={() => { setLeaveSubmitted(false); setAttachedFile(null); }} style={{ padding: "12px 28px", borderRadius: 14, background: theme.text, color: theme.bg, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Apply for Another Date</button>
                </motion.div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!session?.accessToken) return;
                    setLeaveError(null);
                    setIsUploadingDoc(true);

                    let documentUrl: string | undefined;
                    if (attachedFile) {
                      try {
                        const { uploadDocument } = await import("../../../lib/supabase");
                        documentUrl = await uploadDocument(attachedFile) ?? undefined;
                      } catch {
                        // non-fatal — submit without doc
                      }
                    }

                    try {
                      await apiRequest("/leaves", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${session.accessToken}` },
                        body: JSON.stringify({
                          studentName: student.name,
                          class: student.class,
                          section: student.section,
                          startDate: leaveForm.startDate,
                          endDate: leaveForm.endDate,
                          reason: leaveForm.reason,
                          documentUrl,
                        }),
                      });
                      setLeaveSubmitted(true);
                      setLeaveForm({ startDate: "", endDate: "", reason: "" });
                      setAttachedFile(null);
                    } catch (err: unknown) {
                      setLeaveError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
                    } finally {
                      setIsUploadingDoc(false);
                    }
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {leaveError && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FEE2E2", color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
                      {leaveError}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className="form-group">
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Start Date</label>
                      <input type="date" required value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", outline: "none", fontSize: 13, fontWeight: 600, color: theme.text }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>End Date</label>
                      <input type="date" required value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", outline: "none", fontSize: 13, fontWeight: 600, color: theme.text }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Reason for Leave</label>
                    <textarea rows={3} required placeholder="Please provide a valid reason..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", outline: "none", fontSize: 13, fontWeight: 600, resize: "none", color: theme.text }} />
                  </div>

                  <div className="form-group">
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Supporting Documents (Optional)</label>
                    <input type="file" ref={fileInputRef} onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        width: "100%", 
                        padding: "20px", 
                        borderRadius: 12, 
                        border: `2px dashed ${attachedFile ? theme.primary : theme.border}`, 
                        background: attachedFile ? theme.primary + "05" : "transparent",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        transition: "0.2s"
                      }}
                    >
                      <FileArrowUp size={24} weight="bold" color={attachedFile ? theme.primary : theme.textMuted} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: attachedFile ? theme.primary : theme.textMuted }}>
                        {attachedFile ? attachedFile.name : "Click to upload attachment"}
                      </span>
                      {attachedFile && <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted }}>{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</span>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingDoc}
                    style={{ padding: "14px", borderRadius: 14, background: "linear-gradient(135deg, #FF7F50, #e66a3e)", color: "white", border: "none", cursor: isUploadingDoc ? "not-allowed" : "pointer", fontWeight: 900, fontSize: 15, boxShadow: "0 8px 24px rgba(255,127,80,0.25)", opacity: isUploadingDoc ? 0.7 : 1 }}
                  >
                    {isUploadingDoc ? "Submitting…" : "Submit Leave Application"}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InfoField({ icon, label, value, theme }: any) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.primary + "10", color: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, theme }: any) {
  return (
    <div style={{ padding: "24px", borderRadius: 20, background: theme.isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: theme.primary + "15", color: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>{value}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, theme }: { color: string, label: string, theme: DashboardTheme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>{label}</span>
    </div>
  );
}

function CalendarGrid({ theme, date, onPrev, onNext, data, announcements, type }: any) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Map announcements to calendar days
  const events: Record<number, { label: string, color: string, category: string }[]> = {};
  
  announcements?.forEach((ann: any) => {
    const annDate = new Date(ann.createdAt);
    if (annDate.getMonth() === date.getMonth() && annDate.getFullYear() === date.getFullYear()) {
      const d = annDate.getDate();
      if (!events[d]) events[d] = [];
      events[d].push({
        label: ann.title.toUpperCase(),
        color: ann.target === 'all' ? '#D9F9E6' : '#E0F2FE',
        category: ann.target === 'all' ? 'event' : 'academic'
      });
    }
  });

  if (type === "attendance" && data) {
    Object.keys(data).forEach(day => {
      const d = parseInt(day);
      if (!events[d]) events[d] = [];
      const status = data[d].status;
      if (status === "P") {
        events[d].push({ label: "PRESENT", color: "#D1FAE5", category: "event" }); // event color = green
      } else if (status === "A") {
        events[d].push({ label: "ABSENT", color: "#FFE4E6", category: "holiday" }); // holiday color = red
      }
    });
  }

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'academic': return '#3B82F6';
      case 'holiday': return '#F43F5E';
      case 'exam': return '#F59E0B';
      case 'event': return '#10B981';
      default: return theme.primary;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 10, 
            background: "rgba(255,127,80,0.1)", color: "#FF7F50",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <CalendarBlank size={20} weight="bold" />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", fontFamily: "var(--font-poppins)", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              SCHOOL SCHEDULE
            </h3>
            <p style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>
              Academic events, exams and holidays for the current year.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#1e293b" }}>{monthNames[date.getMonth()]}</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#cbd5e1", marginLeft: 8 }}>{date.getFullYear()}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onPrev} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><CaretLeft size={16} weight="bold" /></button>
            <button onClick={onNext} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><CaretRight size={16} weight="bold" /></button>
          </div>
        </div>
      </div>
      
      {/* Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(7, 1fr)", 
        border: "1px solid #f1f5f9",
        borderRadius: "0 0 24px 24px",
        overflow: "hidden"
      }}>
        {weekDays.map(d => (
          <div key={d} style={{ 
            textAlign: "center", fontSize: 10, fontWeight: 900, color: "#94a3b8", 
            padding: "8px 0", borderBottom: "1px solid #f1f5f9", letterSpacing: "0.05em"
          }}>{d}</div>
        ))}
        
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`offset-${i}`} style={{ borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", height: 50, background: "#fcfcfd" }} />
        ))}
        
        {days.map(d => {
          const dayEvents = events[d] || [];
          return (
            <div key={d} style={{ 
              height: 50, 
              borderRight: "1px solid #f1f5f9", 
              borderBottom: "1px solid #f1f5f9",
              padding: "4px",
              position: "relative",
              background: "white",
              overflow: "hidden"
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{d}</span>
              <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {dayEvents.map((ev, i) => (
                  <div key={i} style={{ 
                    padding: "2px 4px", 
                    borderRadius: 4, 
                    background: ev.color, 
                    fontSize: 8, 
                    fontWeight: 900, 
                    color: getCategoryColor(ev.category),
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: getCategoryColor(ev.category) }} />
                    {ev.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Next Events & Legend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Next Events Card */}
        <div style={{ 
          background: "linear-gradient(135deg, #FF7F50 0%, #FF6347 100%)", 
          borderRadius: 20, 
          padding: "16px",
          color: "white",
          boxShadow: "0 10px 20px rgba(255,127,80,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: 18, fontWeight: 900 }}>Next Events</h4>
            <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>Academic Focus</span>
          </div>
          
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { date: "MAY 1", title: "Labor Day", time: "Full Day" },
              { date: "MAY 15", title: "Mid-Terms", time: "09:00 AM" },
              { date: "MAY 22", title: "Sports Meet", time: "08:30 AM" },
              { date: "MAY 28", title: "PTM", time: "10:00 AM" },
            ].map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: "50%", 
                  background: "rgba(255,255,255,0.2)", 
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 900
                }}>
                  <span>{ev.date.split(' ')[0]}</span>
                  <span style={{ fontSize: 12 }}>{ev.date.split(' ')[1]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</p>
                  <p style={{ fontSize: 10, opacity: 0.8 }}>{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend Card */}
        <div style={{ 
          background: "white", 
          borderRadius: 20, 
          padding: "16px", 
          border: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <LegendItem color="#3B82F6" label="ACADEMIC" theme={theme} />
            <LegendItem color="#F43F5E" label="HOLIDAY" theme={theme} />
            <LegendItem color="#F59E0B" label="EXAM" theme={theme} />
            <LegendItem color="#10B981" label="EVENT" theme={theme} />
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", opacity: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src="/images/logo.png" alt="Logo" style={{ width: 16, height: 16, filter: "grayscale(1)" }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: "#1e293b", letterSpacing: "0.05em" }}>SNS ACADEMY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

