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

type Tab = "homework" | "events";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "homework",       label: "Homework",        icon: <BookOpen size={16} /> },
  { key: "events",         label: "Upcoming Events", icon: <CalendarBlank size={16} /> },
];

// Removed mock arrays (hwData, classTT, examTT, upcomingEvents, notifications)
// using real API calls instead.

export default function DiarySection({ student, theme }: { student: Student; theme: DashboardTheme }) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("homework");
  const [hwFilter, setHwFilter] = useState<string>("All");
  const [homework, setHomework] = useState<Homework[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<{ day: string; periods: string[] }[]>([]);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student.class || !student.section) return;
    
    setIsLoading(true);
    
    Promise.all([
      getHomework(student.class, student.section).then(setHomework).catch(() => {}),
      apiRequest<any[]>('/announcements').then(setAnnouncements).catch(() => {}),
      apiRequest<any[]>(`/timetable/student?class=${student.class}&section=${student.section}`).then((data) => {
        // Transform TimetableEntry[] to { day, periods } format
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const formatted = days.map(day => {
          const dayEntries = (data || []).filter(e => e.day === day).sort((a, b) => a.period - b.period);
          const maxPeriod = Math.max(6, ...dayEntries.map(e => e.period));
          const periods = Array.from({ length: maxPeriod }, (_, i) => {
            const entry = dayEntries.find(e => e.period === i + 1);
            return entry ? entry.subject : "-";
          });
          return { day, periods };
        });
        setTimetable(formatted);
      }).catch(() => {}),
      apiRequest<any[]>(`/exams/schedule?class=${student.class}&section=${student.section}`).then(setExamSchedule).catch(() => {})
    ]).finally(() => {
      setIsLoading(false);
    });
    
  }, [student.class, student.section]);

  const subjects = ["All", ...Array.from(new Set(homework.map(h => h.subject)))];
  const filteredHw = hwFilter === "All" ? homework : homework.filter(h => h.subject === hwFilter);

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
                  cursor: "pointer", fontSize: 14, fontWeight: 700,
                  background: isActive ? (theme.isDark ? "rgba(255,255,255,0.1)" : "#FFFFFF") : "transparent",
                  color: isActive ? "#FF7F50" : theme.textMuted,
                  boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s",
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 12,
                      background: theme.text,
                      color: theme.bg,
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    View Details
                  </motion.button>
                </motion.div>
              ))}
            </div>
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
