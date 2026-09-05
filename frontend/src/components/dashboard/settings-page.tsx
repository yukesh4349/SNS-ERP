"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  BellRing,
  Database,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  GraduationCap as GraduationCapLucide,
  RotateCcw,
  ArrowRight,
  CheckCheck,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { PageSection } from "./page-section";
import {
  UserGear,
  Users,
  ChalkboardTeacher,
  UserPlus,
  ShieldCheck as ShieldCheckIcon,
  Calendar,
  Bell,
  FileText,
  GraduationCap,
} from "@phosphor-icons/react";
import { apiRequest } from "../../services/api-client";
import { useAuth } from "../../hooks/use-auth";
import { ProfileContent } from "./profile-page";

const ADMIN_TABS = [
  { id: "general", label: "General", icon: Building2, desc: "Institution & academic info" },
  { id: "security", label: "Security", icon: ShieldCheck, desc: "Authentication & access" },
  { id: "faculty", label: "Faculty Access", icon: UserGear, desc: "Teacher portal permissions" },
  { id: "notifications", label: "Notifications", icon: BellRing, desc: "Alerts & messaging" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & branding" },
  { id: "data", label: "Data Management", icon: Database, desc: "Backups & exports" },
  { id: "academic", label: "Academic Session", icon: GraduationCapLucide, desc: "Promotion & year-end" }
];

const TEACHER_TABS = [
  { id: "profile", label: "Profile Settings", icon: UserGear, desc: "Change photo & details" },
  { id: "security", label: "Security", icon: ShieldCheck, desc: "Change password" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & branding" }
];

export function SettingsPage() {
  const { session } = useAuth();
  const isTeacher = session?.user?.role === "teacher";
  const TABS = isTeacher ? TEACHER_TABS : ADMIN_TABS;

  const [activeTab, setActiveTab] = useState(isTeacher ? "profile" : "general");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [generalState, setGeneralState] = useState({
    institutionName: "SNS Academy",
    academicYear: "2026-2027",
    timezone: "Asia/Kolkata",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  // Load settings from backend on mount
  useEffect(() => {
    apiRequest<{ institution: Record<string, string> }>("/settings")
      .then((data) => {
        const inst = data.institution;
        setGeneralState({
          institutionName: inst.name ?? "SNS Academy",
          academicYear: inst.academicYear ?? "2026-2027",
          timezone: inst.timezone ?? "Asia/Kolkata",
          contactEmail: inst.contactEmail ?? "",
          contactPhone: inst.contactPhone ?? "",
          address: inst.address ?? "",
        });
      })
      .catch(() => setLoadError("Could not load settings from server."));

    try {
      const sec = localStorage.getItem("sns_settings_security");
      if (sec) {
        const parsed = JSON.parse(sec);
        if (parsed.security) setSecurityState((p) => ({ ...p, ...parsed.security }));
      }
      const fac = localStorage.getItem("sns_settings_faculty");
      if (fac) {
        const parsed = JSON.parse(fac);
        if (parsed.faculty) setFacultyState((p) => ({ ...p, ...parsed.faculty }));
      }
      const notif = localStorage.getItem("sns_settings_notifications");
      if (notif) {
        const parsed = JSON.parse(notif);
        if (parsed.notifications) setNotificationState((p) => ({ ...p, ...parsed.notifications }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [securityState, setSecurityState] = useState({
    mfaEnabled: true,
    passwordExpiry: "90",
    sessionTimeout: "30",
    enforceStrongPass: true
  });

  const [notificationState, setNotificationState] = useState({
    emailAlerts: true,
    smsAlerts: true,
    attendanceNotify: true,
    feeReminders: true,
    examResults: false
  });

  const [facultyState, setFacultyState] = useState({
    canViewUsers: false,
    canManageStaff: false,
    canAccessAdmissions: false,
    canViewFinance: false,
    canEditTimetable: true,
    canBroadcastNotifications: true,
    canViewReports: true,
    canManageExams: false,
    canViewTransport: true,
  });

  // ─── Promotion state ─────────────────────────────────────────
  const [promoPreview, setPromoPreview] = useState<any>(null);
  const [promoHistory, setPromoHistory] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoStatuses, setPromoStatuses] = useState<Record<string, string>>({});
  const [promoConfirm, setPromoConfirm] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [newAcademicYear, setNewAcademicYear] = useState("");

  const loadPromoPreview = async () => {
    setPromoLoading(true);
    try {
      const [preview, history] = await Promise.all([
        apiRequest<any>("/settings/promotion-preview"),
        apiRequest<any[]>("/settings/promotion-history"),
      ]);
      setPromoPreview(preview);
      setPromoHistory(history);
      // Default all students to 'promoted'
      const defaults: Record<string, string> = {};
      preview.classGroups?.forEach((g: any) => {
        g.students?.forEach((s: any) => { defaults[s.profileId] = 'promoted'; });
      });
      setPromoStatuses(defaults);
      // Auto-calculate next academic year
      const yr = preview.currentAcademicYear || '2026-2027';
      const [start] = yr.split('-').map(Number);
      setNewAcademicYear(`${start + 1}-${start + 2}`);
    } catch { /* silently fail */ }
    finally { setPromoLoading(false); }
  };

  useEffect(() => { if (activeTab === 'academic') loadPromoPreview(); }, [activeTab]);

  const executePromotion = async () => {
    if (!promoPreview) return;
    setPromoLoading(true);
    try {
      const allStudents = promoPreview.classGroups.flatMap((g: any) =>
        g.students.map((s: any) => ({
          profileId: s.profileId,
          studentId: s.studentId,
          studentName: s.name,
          fromClass: s.currentClass,
          fromSection: s.currentSection,
          toClass: g.toClass,
          toSection: g.toSection,
          status: promoStatuses[s.profileId] || 'promoted',
        }))
      );
      const res = await apiRequest<any>("/settings/promote", {
        method: "POST",
        body: JSON.stringify({
          fromAcademicYear: promoPreview.currentAcademicYear,
          toAcademicYear: newAcademicYear,
          students: allStudents,
        }),
      });
      setPromoResult(res);
      setPromoConfirm(false);
      loadPromoPreview();
    } catch { setPromoResult({ message: 'Promotion failed. Please try again.' }); }
    finally { setPromoLoading(false); }
  };

  const rollbackBatch = async (batchId: string) => {
    setPromoLoading(true);
    try {
      await apiRequest("/settings/promote-rollback", {
        method: "POST",
        body: JSON.stringify({ batchId }),
      });
      loadPromoPreview();
    } catch { /* fail silently */ }
    finally { setPromoLoading(false); }
  };

  const handleSave = async () => {
    if (activeTab !== "general") {
      setIsSaving(true);
      try {
        localStorage.setItem(`sns_settings_${activeTab}`, JSON.stringify({
          security: securityState,
          faculty: facultyState,
          notifications: notificationState,
        }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        /* localStorage unavailable */
      } finally {
        setIsSaving(false);
      }
      return;
    }
    setIsSaving(true);
    try {
      await apiRequest("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: generalState.institutionName,
          academicYear: generalState.academicYear,
          timezone: generalState.timezone,
          contactEmail: generalState.contactEmail,
          contactPhone: generalState.contactPhone,
          address: generalState.address,
        }),
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setLoadError("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageSection
      eyebrow="System Administration"
      title="Global Settings"
      description="Manage institution configurations, security protocols, and system-wide preferences."
    >
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Settings Navigation Sidebar */}
        <div className="w-full xl:w-80 shrink-0 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-start gap-4 p-5 rounded-[2rem] transition-all text-left group ${
                activeTab === tab.id 
                  ? "bg-white border-2 border-[#FF7F50] shadow-lg shadow-[#FF7F50]/10" 
                  : "bg-slate-50 border-2 border-transparent hover:bg-white hover:border-slate-200"
              }`}
            >
              <div className={`p-3 rounded-2xl transition-colors ${
                activeTab === tab.id ? "bg-[#FF7F50] text-white" : "bg-white text-slate-400 group-hover:text-[#FF7F50]"
              }`}>
                <tab.icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className={`font-bold ${activeTab === tab.id ? "text-slate-900" : "text-slate-600"}`}>
                  {tab.label}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-[0_24px_70px_rgba(15,23,42,0.05)] relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <ProfileContent />
                </motion.div>
              )}

              {activeTab === "general" && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="mb-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Institution Profile</h2>
                    <p className="text-slate-500 font-medium">Update the core details of your educational institution.</p>
                  </div>

                  {loadError && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} /> {loadError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Name</label>
                      <input
                        type="text"
                        value={generalState.institutionName}
                        onChange={e => setGeneralState({...generalState, institutionName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Year</label>
                      <select
                        value={generalState.academicYear}
                        onChange={e => setGeneralState({...generalState, academicYear: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all appearance-none cursor-pointer"
                      >
                        <option>2024-2025</option>
                        <option>2025-2026</option>
                        <option>2026-2027</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Timezone</label>
                      <input
                        type="text"
                        value={generalState.timezone}
                        onChange={e => setGeneralState({...generalState, timezone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Email</label>
                      <input
                        type="email"
                        value={generalState.contactEmail}
                        onChange={e => setGeneralState({...generalState, contactEmail: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Phone</label>
                      <input
                        type="tel"
                        value={generalState.contactPhone}
                        onChange={e => setGeneralState({...generalState, contactPhone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                      <input
                        type="text"
                        value={generalState.address}
                        onChange={e => setGeneralState({...generalState, address: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="mb-10 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Security & Access</h2>
                      <p className="text-slate-500 font-medium">Configure multi-factor authentication and password policies.</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                      <ShieldCheck size={32} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!isTeacher && (
                      <>
                        {/* Toggle Item */}
                        <div className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                          <div>
                            <h4 className="font-bold text-slate-900">Multi-Factor Authentication (MFA)</h4>
                            <p className="text-sm text-slate-500 mt-1">Require MFA for all administrative staff accounts.</p>
                          </div>
                          <button 
                            onClick={() => setSecurityState({...securityState, mfaEnabled: !securityState.mfaEnabled})}
                            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${securityState.mfaEnabled ? "bg-[#FF7F50]" : "bg-slate-300"}`}
                          >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${securityState.mfaEnabled ? "translate-x-6" : ""}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                          <div>
                            <h4 className="font-bold text-slate-900">Enforce Strong Passwords</h4>
                            <p className="text-sm text-slate-500 mt-1">Require 12+ chars, numbers, and special symbols.</p>
                          </div>
                          <button 
                            onClick={() => setSecurityState({...securityState, enforceStrongPass: !securityState.enforceStrongPass})}
                            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${securityState.enforceStrongPass ? "bg-[#FF7F50]" : "bg-slate-300"}`}
                          >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${securityState.enforceStrongPass ? "translate-x-6" : ""}`} />
                          </button>
                        </div>
                      </>
                    )}

                    {isTeacher && (
                      <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-slate-900 mb-4">Change Password</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                            <input type="password" placeholder="Enter current password" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#FF7F50]/20 transition-all outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                            <input type="password" placeholder="Enter new password" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#FF7F50]/20 transition-all outline-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isTeacher && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password Expiry (Days)</label>
                          <input 
                            type="number" 
                            value={securityState.passwordExpiry}
                            onChange={e => setSecurityState({...securityState, passwordExpiry: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Timeout (Mins)</label>
                          <input 
                            type="number" 
                            value={securityState.sessionTimeout}
                            onChange={e => setSecurityState({...securityState, sessionTimeout: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[#FF7F50] focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "faculty" && (
                <motion.div
                  key="faculty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="mb-10 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Faculty Access Control</h2>
                      <p className="text-slate-500 font-medium">Define which modules are accessible globally to the Teacher role.</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                      <UserGear size={32} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: "canViewUsers", title: "Users", icon: <Users size={24} weight="duotone" />, desc: "Directory Search" },
                      { id: "canManageStaff", title: "Staff", icon: <ChalkboardTeacher size={24} weight="duotone" />, desc: "Colleague Info" },
                      { id: "canAccessAdmissions", title: "Admission", icon: <UserPlus size={24} weight="duotone" />, desc: "Process Logs" },
                      { id: "canViewFinance", title: "Finance", icon: <ShieldCheckIcon size={24} weight="duotone" />, desc: "Fee Status" },
                      { id: "canEditTimetable", title: "Timetable", icon: <Calendar size={24} weight="duotone" />, desc: "Master Schedules" },
                      { id: "canBroadcastNotifications", title: "Broadcast", icon: <Bell size={24} weight="duotone" />, desc: "Push Alerts" },
                      { id: "canViewReports", title: "Reports", icon: <FileText size={24} weight="duotone" />, desc: "Academic Data" },
                      { id: "canManageExams", title: "Exams", icon: <GraduationCap size={24} weight="duotone" />, desc: "Marks & Control" },
                    ].map((item) => {
                      const isActive = (facultyState as any)[item.id];
                      return (
                        <button 
                          key={item.id}
                          onClick={() => setFacultyState({...facultyState, [item.id]: !isActive})}
                          className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all text-center group ${
                            isActive 
                              ? "border-[#FF7F50] bg-white shadow-lg shadow-[#FF7F50]/10" 
                              : "border-slate-50 bg-slate-50/50 hover:border-slate-100 hover:bg-white"
                          }`}
                        >
                          <div className={`transition-colors ${isActive ? "text-[#FF7F50]" : "text-slate-400 group-hover:text-[#FF7F50]"}`}>
                            {item.icon}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-600"}`}>{item.title}</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{item.desc}</p>
                          </div>
                          <div className={`mt-2 w-8 h-4 rounded-full transition-colors relative ${isActive ? "bg-[#FF7F50]" : "bg-slate-200"}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isActive ? "left-4.5" : "left-0.5"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 flex items-center gap-4 mt-6">
                    <AlertCircle className="text-orange-500 shrink-0" size={24} />
                    <p className="text-xs font-bold text-orange-700 leading-relaxed uppercase tracking-tight">
                      Note: These are global overrides. Individual teacher permissions set in the Staff module will still apply.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="mb-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Communication Preferences</h2>
                    <p className="text-slate-500 font-medium">Control automated messaging and notification channels.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: "emailAlerts", title: "Global Email Alerts", desc: "Allow system to send automated emails." },
                      { id: "smsAlerts", title: "Global SMS Alerts", desc: "Enable SMS gateways for critical updates." },
                      { id: "attendanceNotify", title: "Automated Attendance Alerts", desc: "Notify parents immediately if a student is marked absent." },
                      { id: "feeReminders", title: "Automated Fee Reminders", desc: "Send invoice reminders 7 days before due dates." },
                      { id: "examResults", title: "Publish Exam Results", desc: "Automatically notify students when grades are posted." },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-100 bg-slate-50">
                        <div>
                          <h4 className="font-bold text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => setNotificationState({...notificationState, [item.id]: !(notificationState as any)[item.id]})}
                          className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${(notificationState as any)[item.id] ? "bg-[#FF7F50]" : "bg-slate-300"}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${(notificationState as any)[item.id] ? "translate-x-6" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "appearance" && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="mb-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Interface Customization</h2>
                    <p className="text-slate-500 font-medium">Choose between our signature dashboard layouts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { id: "classic", name: "Classic ERP", desc: "The balanced, card-based interface with orange accents.", img: "/images/themes/classic.png" },
                      { id: "modern", name: "Modern Control", desc: "Minimalist, high-contrast layout with advanced analytics.", img: "/images/themes/modern.png" }
                    ].map((theme) => {
                      const isSelected = localStorage.getItem("sns_theme") === theme.id || (!localStorage.getItem("sns_theme") && theme.id === "classic");
                      return (
                        <button
                          key={theme.id}
                          onClick={() => { localStorage.setItem("sns_theme", theme.id); window.location.reload(); }}
                          className={`group relative flex flex-col items-start p-6 rounded-[2.5rem] border-2 transition-all text-left ${
                            isSelected 
                              ? "border-[#FF7F50] bg-white shadow-2xl shadow-[#FF7F50]/10" 
                              : "border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="w-full aspect-[16/10] bg-slate-100 rounded-[1.5rem] mb-6 overflow-hidden border border-slate-100">
                             {/* Small mock of the theme */}
                             <div className={`w-full h-full p-4 ${theme.id === 'modern' ? 'bg-[#FAF9F6]' : 'bg-white'}`}>
                                <div className="w-1/3 h-2 bg-slate-200 rounded-full mb-4" />
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                  <div className="h-10 bg-slate-100 rounded-xl" />
                                  <div className="h-10 bg-slate-100 rounded-xl" />
                                  <div className="h-10 bg-slate-100 rounded-xl" />
                                </div>
                                <div className="w-full h-20 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200" />
                             </div>
                          </div>
                          
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <h4 className={`font-black ${isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"}`}>
                                {theme.name}
                              </h4>
                              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tight">{theme.desc}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? "border-[#FF7F50] bg-[#FF7F50]" : "border-slate-200"
                            }`}>
                              {isSelected && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                          </div>

                          {isSelected && (
                             <div className="absolute -top-3 -right-3 px-4 py-1 bg-[#FF7F50] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                               Active Theme
                             </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "data" && (
                <motion.div
                  key="placeholder-data"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-20 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                    <Database size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Database Management</h2>
                  <p className="text-slate-500 max-w-sm">
                    This module is currently being provisioned for your tenant. Advanced data settings will be available shortly.
                  </p>
                </motion.div>
              )}

              {activeTab === "academic" && (
                <motion.div
                  key="academic"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Academic Session & Promotion</h2>
                    <p className="text-slate-500 font-medium">Promote students to the next class at the end of the academic year. Student IDs remain permanent.</p>
                  </div>

                  {promoResult && (
                    <div className={`p-5 rounded-2xl border flex items-center gap-3 mb-4 ${
                      promoResult.summary ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                      {promoResult.summary ? <CheckCheck size={20} /> : <AlertCircle size={20} />}
                      <div>
                        <p className="font-bold text-sm">{promoResult.message}</p>
                        {promoResult.summary && (
                          <p className="text-xs mt-1 opacity-80">
                            Promoted: {promoResult.summary.promoted} · Failed: {promoResult.summary.failed} · Transferred: {promoResult.summary.transferred} · Graduated: {promoResult.summary.graduated}
                          </p>
                        )}
                      </div>
                      <button onClick={() => setPromoResult(null)} className="ml-auto text-xs font-bold opacity-50 hover:opacity-100">✕</button>
                    </div>
                  )}

                  {/* Current Session Card */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 p-6 rounded-[2rem] bg-gradient-to-br from-[#FF7F50]/10 to-[#FF7F50]/5 border border-[#FF7F50]/20">
                      <p className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest mb-2">Current Academic Year</p>
                      <p className="text-3xl font-black text-slate-900">{promoPreview?.currentAcademicYear || generalState.academicYear}</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium">{promoPreview?.totalStudents || 0} active students</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight size={32} className="text-slate-300" />
                    </div>
                    <div className="flex-1 p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Academic Year</p>
                      <input
                        type="text"
                        value={newAcademicYear}
                        onChange={e => setNewAcademicYear(e.target.value)}
                        className="text-3xl font-black text-slate-900 bg-transparent outline-none w-full"
                        placeholder="2027-2028"
                      />
                    </div>
                  </div>

                  {/* Promotion Preview Table */}
                  {promoLoading ? (
                    <div className="py-16 text-center">
                      <div className="w-10 h-10 border-4 border-[#FF7F50] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-slate-400 font-bold">Loading student data...</p>
                    </div>
                  ) : promoPreview?.classGroups?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Promotion Preview</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const all: Record<string, string> = {};
                              promoPreview.classGroups.forEach((g: any) => g.students.forEach((s: any) => { all[s.profileId] = 'promoted'; }));
                              setPromoStatuses(all);
                            }}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                          >
                            <CheckCheck size={14} /> Select All Promote
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left">
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">From</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">To</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promoPreview.classGroups.map((g: any) =>
                              g.students.map((s: any) => (
                                <tr key={s.profileId} className="border-t border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{s.studentId.slice(0, 8)}</td>
                                  <td className="px-6 py-3 font-bold text-slate-900">{s.name}</td>
                                  <td className="px-6 py-3">
                                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{g.fromClass}-{g.fromSection}</span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      g.toClass === 'graduated' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>{g.toClass === 'graduated' ? 'Graduated' : `${g.toClass}-${g.toSection}`}</span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <select
                                      value={promoStatuses[s.profileId] || 'promoted'}
                                      onChange={e => setPromoStatuses({ ...promoStatuses, [s.profileId]: e.target.value })}
                                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-[#FF7F50] cursor-pointer"
                                    >
                                      <option value="promoted">✅ Promote</option>
                                      <option value="failed">🔁 Retain (Failed)</option>
                                      <option value="transferred">↗️ Transferred</option>
                                      <option value="discontinued">⛔ Discontinued</option>
                                    </select>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Execute Promotion */}
                      <div className="flex items-center justify-end gap-4 pt-4">
                        {!promoConfirm ? (
                          <button
                            onClick={() => setPromoConfirm(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#FF7F50] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all"
                          >
                            <GraduationCapLucide size={18} /> Execute Promotion
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-amber-900">Confirm promotion for {promoPreview.totalStudents} students?</p>
                              <p className="text-xs text-amber-600">This can be reversed using the rollback feature below.</p>
                            </div>
                            <button onClick={executePromotion} disabled={promoLoading}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shrink-0">
                              Yes, Promote
                            </button>
                            <button onClick={() => setPromoConfirm(false)}
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 shrink-0">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <GraduationCapLucide size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-400 font-bold">No active students found to promote.</p>
                    </div>
                  )}

                  {/* Promotion History */}
                  {promoHistory.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">Promotion History</h3>
                      {promoHistory.map((batch: any) => (
                        <div key={batch.batchId} className={`p-6 rounded-[2rem] border ${
                          batch.rolledBack ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-100 bg-white'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">
                                {batch.fromAcademicYear} → {batch.toAcademicYear}
                                {batch.rolledBack && <span className="ml-2 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">Rolled Back</span>}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(batch.promotedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · 
                                {batch.totalStudents} students · 
                                {batch.promoted} promoted · {batch.failed} retained · {batch.graduated} graduated
                              </p>
                            </div>
                            {!batch.rolledBack && (
                              <button
                                onClick={() => rollbackBatch(batch.batchId)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                              >
                                <RotateCcw size={14} /> Rollback
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Action Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
               {showSuccess ? (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-3 text-emerald-500 font-bold"
                 >
                   <CheckCircle2 size={24} />
                   <span>Settings saved successfully!</span>
                 </motion.div>
               ) : (
                 <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                   <AlertCircle size={16} />
                   <span>Unsaved changes will be lost.</span>
                 </div>
               )}

               <button
                 onClick={handleSave}
                 disabled={isSaving || showSuccess}
                 className="flex items-center gap-3 px-8 py-4 bg-[#FF7F50] hover:bg-[#FF6A00] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#FF7F50]/20 transition-all disabled:opacity-50"
               >
                 {isSaving ? (
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <Save size={18} />
                 )}
                 {isSaving ? "Saving..." : "Save Settings"}
               </button>
            </div>

          </div>
        </div>
      </div>
    </PageSection>
  );
}
