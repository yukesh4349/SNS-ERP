"use client";

import { useState } from "react";
import ParentSidebar from "../../components/parent/ParentSidebar";
import EventsGallery from "../../components/parent/sections/EventsGallery";
import ProfileSection from "../../components/parent/sections/ProfileSection";
import DiarySection from "../../components/parent/sections/DiarySection";
import AcademicSection from "../../components/parent/sections/AcademicSection";
import TransportSection from "../../components/parent/sections/TransportSection";
import SettingsSection from "../../components/parent/sections/SettingsSection";

import NotificationsSection from "../../components/parent/sections/NotificationsSection";
import DashboardHome from "../../components/parent/sections/DashboardHome";
import { List, Bell, MagnifyingGlass, Sun, Moon } from "@phosphor-icons/react";

import { DashboardTheme } from "../../types/theme";
import { MenuKey, Student, AcademicTab } from "../../types/dashboard";

// ── Student data will be fetched from the backend API ────────────────────────
// Replace the empty array below with a useEffect + API call (e.g. /api/students?parentId=...)
// Once connected, both the Parent Dashboard and Teacher Dashboard will automatically
// reflect real student data from the database — no hardcoded values needed.
const students: Student[] = [];

export default function ParentDashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>("events");
  const [academicTab, setAcademicTab] = useState<AcademicTab>("calendar");
  const [activeStudent, setActiveStudent] = useState<Student | null>(students[0] ?? null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme: DashboardTheme = {
    isDark: isDarkMode,
    bg: isDarkMode ? "#0A0A0A" : "#f8fafc",
    sidebarBg: isDarkMode ? "#121212" : "#ffffff",
    cardBg: isDarkMode ? "#1A1A1A" : "#ffffff",
    text: isDarkMode ? "#FFFFFF" : "#1e293b",
    textMuted: isDarkMode ? "#A0A0A0" : "#94a3b8",
    border: isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0",
    accent: "#FF7F50",
    primary: "#FF7F50",
    success: "#10B981",
    danger: "#EF4444",
  };

  const renderContent = () => {
    // Placeholder student: keeps all UI structure (tabs, filters, buttons) visible
    // while data sections show empty states until the backend is connected.
    const placeholderStudent: Student = {
      id: "", studentId: "", name: "", class: "", section: "", avatar: "?"
    };
    const student = activeStudent ?? placeholderStudent;

    // Only Profile hides completely when no real student is loaded
    const noStudentState = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,127,80,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>📋</span>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>No Student Data</h3>
        <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, maxWidth: 360 }}>Student information will appear here once connected to the school database.</p>
      </div>
    );

    switch (activeMenu) {
      case "dashboard":     return <DashboardHome theme={theme} onNavigate={(tab) => { setAcademicTab(tab); setActiveMenu("academic"); }} />;
      case "events":        return <EventsGallery theme={theme} />;
      case "profile":       return <ProfileSection student={student} theme={theme} />;
      case "diary":         return <DiarySection student={student} theme={theme} />;
      case "notifications": return <NotificationsSection theme={theme} />;
      case "academic":      return <AcademicSection student={student} theme={theme} initialTab={academicTab} />;
      case "transport":     return <TransportSection theme={theme} />;
      case "settings":      return <SettingsSection theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      default:              return <EventsGallery theme={theme} />;
    }
  };

  return (
    <div className={`mesh-bg${isDarkMode ? " dark-mode" : ""} flex min-h-screen font-sans relative overflow-hidden`} style={{ background: theme.bg, transition: "background 0.3s ease" }}>
      {/* Background Decorative Elements */}
      <div className="bg-glow" style={{ top: "-10%", left: "-10%", width: 700, height: 700, background: "radial-gradient(circle, rgba(255, 127, 80, 0.12), transparent 70%)", position: "absolute", zIndex: 0 }} />
      <div className="bg-glow" style={{ bottom: "-10%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(79, 70, 229, 0.1), transparent 70%)", animationDelay: "-5s", position: "absolute", zIndex: 0 }} />
      
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div 
        className={`fixed lg:relative inset-y-0 left-0 z-[70] transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} transition-transform duration-300 ease-in-out`}
        style={{ background: theme.sidebarBg }}
      >
        <ParentSidebar
          students={students}
          activeStudent={activeStudent}
          setActiveStudent={(s) => { setActiveStudent(s); setIsSidebarOpen(false); }}
          activeMenu={activeMenu}
          setActiveMenu={(m) => { setActiveMenu(m); setIsSidebarOpen(false); }}
          theme={theme}
        />
      </div>

      <main className="flex-1 h-screen lg:h-screen w-full min-w-0 relative z-10 flex flex-col overflow-hidden">
        {/* Global Dashboard Header */}
        <div 
          className="flex items-center px-6 py-4 shrink-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          style={{ background: theme.isDark ? "rgba(18,18,18,0.8)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="font-extrabold text-[15px] tracking-tight font-poppins leading-none" style={{ color: theme.text }}>
              {activeStudent ? activeStudent.name : "Parent Portal"}
            </span>
            <span className="text-[11px] font-semibold tracking-wide mt-0.5" style={{ color: theme.textMuted }}>
              {activeStudent ? `Class ${activeStudent.class}-${activeStudent.section}` : "No student linked yet"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl transition-all hover:bg-orange-50 active:scale-95"
              style={{ color: "#FF7F50" }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} weight="duotone" /> : <Moon size={24} weight="duotone" />}
            </button>

            <button 
              onClick={() => setActiveMenu("notifications")}
              className="relative p-2 rounded-xl transition-all hover:bg-orange-50 active:scale-95"
              style={{ color: "#FF7F50" }}
              title="Notifications"
            >
              <Bell size={24} weight="duotone" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#e66a3e] text-white flex items-center justify-center font-bold text-xs shadow-[0_2px_8px_rgba(255,127,80,0.3)] ring-2 ring-white">
              {activeStudent ? activeStudent.avatar : "?"}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-8 lg:p-10`}>
          {activeStudent && activeMenu !== 'dashboard' && (
            <div className="mb-8 md:mb-10 shrink-0">
              <h2 style={{ fontSize: 32, fontWeight: 900, color: theme.text, fontFamily: "var(--font-poppins,'Poppins',sans-serif)", letterSpacing: "-0.03em" }}>
                {activeStudent.name}
              </h2>
              <p style={{ color: theme.textMuted, fontWeight: 600, fontSize: 16 }}>Class {activeStudent.class}-{activeStudent.section} Student</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
