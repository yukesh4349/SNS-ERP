"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Download, ChevronLeft, ChevronRight } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = ["08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM"];

const timetable = [
  { day: "Mon", start: "09 AM", end: "10 AM", subject: "Mathematics", class: "10-A", color: "var(--accent)" },
  { day: "Tue", start: "10 AM", end: "11 AM", subject: "Physics", class: "11-C", color: "var(--accent)" },
  { day: "Wed", start: "08 AM", end: "09 AM", subject: "Science", class: "9-B", color: "var(--accent)" },
  { day: "Thu", start: "11 AM", end: "12 PM", subject: "Calculus", class: "12-B", color: "var(--accent)" },
  { day: "Fri", start: "09 AM", end: "10 AM", subject: "Math Lab", class: "10-A", color: "var(--accent)" },
];

export default function ScheduleManager() {
  const [view, setView] = React.useState<"mine" | "class">("mine");
  const [selectedClass, setSelectedClass] = React.useState<{ class: string, section: string } | null>(null);

  const classes = [
    { class: "10", section: "A" },
    { class: "10", section: "B" },
    { class: "11", section: "A" },
    { class: "11", section: "C" },
    { class: "12", section: "B" },
  ];

  const handleClassSelect = (cls: { class: string, section: string }) => {
    setSelectedClass(cls);
  };

  return (
    <div className="space-y-8">
      {/* View Switcher */}
      <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] p-1.5 rounded-2xl w-fit shadow-sm">
        <button 
          onClick={() => { setView("mine"); setSelectedClass(null); }}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "mine" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
        >
          My Timetable
        </button>
        <button 
          onClick={() => setView("class")}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "class" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
        >
          Class Timetable
        </button>
      </div>

      {view === "class" && !selectedClass ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {classes.map((cls) => (
            <motion.button
              key={`${cls.class}-${cls.section}`}
              whileHover={{ y: -5 }}
              onClick={() => handleClassSelect(cls)}
              className="flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all gap-4"
            >
              <div className="h-16 w-16 rounded-3xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent)]">
                <Clock size={32} />
              </div>
              <span className="text-2xl font-black text-[var(--text-primary)]">{cls.class}-{cls.section}</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">View Schedule</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[32px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[var(--card-shadow)]"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              {view === "class" && (
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {view === "mine" ? "My Weekly Timetable" : `Class ${selectedClass?.class}-${selectedClass?.section} Timetable`}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">Academic Session 2026-27</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[var(--bg-primary)] rounded-xl p-1 border border-[var(--border)]">
                <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"><ChevronLeft size={16}/></button>
                <span className="px-4 text-xs font-bold text-[var(--text-primary)]">This Week</span>
                <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"><ChevronRight size={16}/></button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:shadow-lg hover:shadow-[var(--accent-glow)] transition-all">
                <Download size={14} /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-[var(--border)] pb-4">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">Time</div>
                {days.map(day => (
                  <div key={day} className="text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{day}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="relative mt-4 space-y-2">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] items-center h-16 group">
                    <div className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">{hour}</div>
                    {days.map(day => {
                      const entry = timetable.find(t => t.day === day && t.start === hour);
                      return (
                        <div key={day} className="px-1 h-full">
                          {entry ? (
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="h-full w-full rounded-xl p-2 bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)] flex flex-col justify-center cursor-pointer"
                            >
                              <span className="text-[10px] font-bold leading-tight line-clamp-1">{entry.subject}</span>
                              <span className="text-[9px] opacity-80">{entry.class}</span>
                            </motion.div>
                          ) : (
                            <div className="h-full w-full rounded-xl border border-dashed border-[var(--border)] opacity-20 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
