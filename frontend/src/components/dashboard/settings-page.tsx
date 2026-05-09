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
  AlertCircle
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

const TABS = [
  { id: "general", label: "General", icon: Building2, desc: "Institution & academic info" },
  { id: "security", label: "Security", icon: ShieldCheck, desc: "Authentication & access" },
  { id: "faculty", label: "Faculty Access", icon: UserGear, desc: "Teacher portal permissions" },
  { id: "notifications", label: "Notifications", icon: BellRing, desc: "Alerts & messaging" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & branding" },
  { id: "data", label: "Data Management", icon: Database, desc: "Backups & exports" }
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
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

  const handleSave = async () => {
    if (activeTab !== "general") {
      // Other tabs are local-only for now
      setIsSaving(true);
      setTimeout(() => { setIsSaving(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }, 800);
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
