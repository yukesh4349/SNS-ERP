"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Clock, 
  CalendarCheck, 
  Bell, 
  CalendarBlank,
  Funnel,
  MapPin,
  CaretRight
} from "@phosphor-icons/react";

import { Student } from "../../../types/dashboard";
import { DashboardTheme } from "../../../types/theme";
import { getHomework, Homework } from "../../../services/homework-service";
import { apiRequest } from "../../../services/api-client";
import { useAuth } from "../../../hooks/use-auth";

type Tab = "homework" | "classtimetable" | "examtimetable" | "events";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "homework",       label: "Homework",        icon: <BookOpen size={16} /> },
  { key: "classtimetable", label: "Class Timetable", icon: <Clock size={16} /> },
  { key: "examtimetable",  label: "Exam Timetable",  icon: <CalendarCheck size={16} /> },
  { key: "events",         label: "Upcoming Events", icon: <CalendarBlank size={16} /> },
];



export default function DiarySection({ student, theme }: { student: Student; theme: DashboardTheme }) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("homework");
  const [hwFilter, setHwFilter] = useState<string>("All");
  const [homework, setHomework] = useState<Homework[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student.class || !student.section || student.class === "N/A" || student.section === "N/A") return;
    
    setIsLoading(true);
    getHomework(student.class, student.section)
      .then(setHomework)
      .catch(() => {});

    apiRequest<any[]>('/announcements')
      .then(setAnnouncements)
      .catch(() => {});

    apiRequest<any[]>(`/timetable/student?class=${student.class}&section=${student.section}`)
      .then(setTimetable)
      .catch(() => {});

    apiRequest<any[]>(`/exams/schedule?class=${student.class}&section=${student.section}`)
      .then(setExamSchedule)
      .catch(() => {});
    
    setIsLoading(false);
  }, [student.class, student.section]);

  const subjects = ["All", ...Array.from(new Set(homework.map(h => h.subject)))];
  const filteredHw = hwFilter === "All" ? homework : homework.filter(h => h.subject === hwFilter);

  // Traditional Timetable Mapping
  const daysTT = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periodHeaders = ["I", "II", "III", "IV", "V", "VI"];

  const classTT = daysTT.map(day => {
    const dayEntries = timetable.filter(e => e.day === day);
    const periods = Array(6).fill("-");
    dayEntries.forEach(entry => {
      if (entry.period <= 6) periods[entry.period - 1] = entry.subject;
    });
    return { day, periods };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", padding: "6px", borderRadius: 16, width: "fit-content" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 20px", borderRadius: 12, border: "none",
                    cursor: "pointer", fontSize: 14, fontWeight: 800,
                    background: isActive 
                      ? "linear-gradient(135deg, #FF7F50, #e66a3e)" 
                      : "transparent",
                    color: isActive ? "#FFFFFF" : theme.textMuted,
                    boxShadow: isActive ? "0 8px 24px rgba(255,127,80,0.2)" : "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isActive ? "translateY(-1px)" : "none",
                    fontFamily: "var(--font-inter,'Inter',sans-serif)",
                  }}>
                  {tab.icon} {tab.label}
                </button>
            );
          })}
        </div>


      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "homework" && (
          <motion.div 
            key="homework" 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }} 
            transition={{ duration: 0.2 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}
          >
            {/* Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.textMuted, marginRight: 8 }}>
                <Funnel size={18} weight="bold" />
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Filter:</span>
              </div>
              {subjects.map(sub => (
                <button 
                  key={`filter-${sub}`}
                  onClick={() => setHwFilter(sub)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 100,
                    border: `1px solid ${hwFilter === sub ? theme.primary : theme.border}`,
                    background: hwFilter === sub ? theme.primary + "10" : "transparent",
                    color: hwFilter === sub ? theme.primary : theme.textMuted,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredHw.map((hw, i) => (
                <motion.div
                  key={`hw-${hw.subject}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="premium-card"
                  style={{
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.1em", background: theme.primary + "10", padding: "3px 8px", borderRadius: 6 }}>{hw.subject}</span>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: theme.text, marginBottom: 4 }}>{hw.title}</p>
                    <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>{hw.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.textMuted, fontSize: 13, fontWeight: 600 }}>
                        <CalendarBlank size={16} weight="bold" />
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #1e293b, #0f172a)",
                      color: "white",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    View Details
                  </motion.button>
                </motion.div>
              ))}
              {filteredHw.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted, fontWeight: 600 }}>
                  No homework assignments found.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "classtimetable" && (
          <motion.div 
            key="classtimetable" 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }} 
            transition={{ duration: 0.2 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}
          >
            <div className="premium-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${theme.border}` }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 900, color: theme.textMuted, textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>Day</th>
                      {periodHeaders.map(h => (
                        <th key={h} style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 900, color: theme.text, borderBottom: `1px solid ${theme.border}` }}>P{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classTT.map((day, di) => (
                      <tr key={di} style={{ borderBottom: di < classTT.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                        <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 900, color: theme.text, background: theme.isDark ? "rgba(255,255,255,0.01)" : "transparent" }}>{day.day}</td>
                        {day.periods.map((p, pi) => (
                          <td key={pi} style={{ 
                            padding: "16px 20px", 
                            textAlign: "center", 
                            fontSize: 13, 
                            fontWeight: 700,
                            color: theme.textMuted,
                            background: pi % 2 === 0 ? "transparent" : (theme.isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)")
                          }}>
                            {p}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "examtimetable" && (
          <motion.div 
            key="examtimetable" 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }} 
            transition={{ duration: 0.2 }}
            style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
          >
            {examSchedule.map((e, i) => (
              <motion.div
                key={`exam-${e.id}-${i}`}
                className="premium-card"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  border: `1px solid ${theme.border}`,
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 14, 
                    background: "linear-gradient(135deg, #FF7F50, #e66a3e)", 
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center", 
                    fontSize: 13, fontWeight: 900, flexShrink: 0, 
                    boxShadow: "0 6px 12px rgba(255,127,80,0.2)",
                  }}>
                    {e.subject.slice(0,1)}
                  </div>
                  <div style={{ background: theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase" }}>
                    Box No: {100 + i}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontWeight: 900, fontSize: 20, color: theme.text, marginBottom: 6, letterSpacing: "-0.02em" }}>{e.subject}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.textMuted, fontSize: 14, fontWeight: 600 }}>
                      <CalendarBlank size={18} weight="bold" color={theme.primary} />
                      <span>{new Date(e.examDate).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.textMuted, fontSize: 14, fontWeight: 600 }}>
                      <Clock size={18} weight="bold" color={theme.primary} />
                      <span>{e.startTime} {e.duration ? `(${e.duration})` : ""}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.textMuted, fontSize: 14, fontWeight: 600 }}>
                      <MapPin size={18} weight="bold" color={theme.primary} />
                      <span>Location: {e.hall}</span>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: 8, 
                  paddingTop: 20, 
                  borderTop: `1px solid ${theme.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.primary, textTransform: "uppercase" }}>Instructions</span>
                  <CaretRight size={16} weight="bold" color={theme.primary} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "events" && (
          <motion.div 
            key="events" 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }} 
            transition={{ duration: 0.2 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}
          >
            {announcements.map((ev, i) => (
              <motion.div
                key={`event-${ev.id}-${i}`}
                className="premium-card"
                style={{
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,127,80,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CalendarBlank size={24} color="#FF7F50" weight="bold" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>{ev.title}</p>
                    <p style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600, marginTop: 2 }}>{new Date(ev.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span style={{ 
                  padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 800, 
                  background: theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                  color: "#FF7F50",
                }}>{ev.target === 'all' ? 'Announcement' : ev.target.toUpperCase()}</span>
              </motion.div>
            ))}
            {announcements.length === 0 && (
              <p style={{ textAlign: "center", color: theme.textMuted, padding: "40px" }}>No upcoming events or announcements.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
