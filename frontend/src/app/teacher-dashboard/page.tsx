"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import TeacherSidebar from "../../components/teacher/TeacherSidebar";
import TeacherHeader from "../../components/teacher/TeacherHeader";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import DashboardOverview from "../../components/teacher/DashboardOverview";
import ClassesSubjects from "../../components/teacher/ClassesSubjects";
import ScheduleManager from "../../components/teacher/ScheduleManager";
import AssignmentsExams from "../../components/teacher/AssignmentsExams";
import { ChatPage } from "../../components/dashboard/chat-page";
import LearningResources from "../../components/teacher/LearningResources";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart3, HelpCircle } from "lucide-react";
import { AttendancePage } from "../../components/dashboard/attendance-page";
import { CalendarPage } from "../../components/dashboard/calendar-page";
import { ResultsPage } from "../../components/dashboard/results-page";
import { TransportPage } from "../../components/dashboard/transport-page";
import { ReportsPage } from "../../components/dashboard/reports-page";
import { SettingsPage } from "../../components/dashboard/settings-page";
import { NotificationsPage } from "../../components/dashboard/notifications-page";
import { ProfilePage } from "../../components/dashboard/profile-page";
import { StudentDirectoryPage } from "../../components/dashboard/student-directory-page";

export default function TeacherDashboard() {
  const { session, isBootstrapping } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isBootstrapping && !session) router.replace("/");
  }, [session, isBootstrapping, router]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (isBootstrapping || !session) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <DashboardOverview setActiveTab={setActiveTab} />;
      case "notifications": return <NotificationsPage />;
      case "students": return <StudentDirectoryPage />;
      case "attendance": return <AttendancePage />;
      case "timetable": return <ScheduleManager />;
      case "calendar": return <CalendarPage />;
      case "results": return <ResultsPage />;
      case "transport": return <TransportPage />;
      case "tasks": return <ReportsPage />;
      case "communication": return <div className="flex-1 -mx-6 lg:-mx-10 -mt-8 overflow-hidden"><ChatPage /></div>;
      case "settings": return <SettingsPage />;
      case "profile": return <ProfilePage />;
      default: return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <main className="teacher-dashboard min-h-screen flex text-[var(--text-primary)]">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <TeacherSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col pb-24 lg:pb-0">
        <TeacherHeader 
          theme={theme} 
          toggleTheme={toggleTheme} 
          setActiveTab={setActiveTab}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-6 lg:p-10 flex-1 max-w-[1600px] mx-auto w-full">
          {activeTab !== "communication" && (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black italic tracking-tight uppercase">
                  {activeTab} <span className="text-[var(--accent)]">Dashboard</span>
                </h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium mt-1 uppercase tracking-widest">Academic Year 2026-27</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <TeacherBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}
