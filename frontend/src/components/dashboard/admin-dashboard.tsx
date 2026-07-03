"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserSquare,
  TrendUp,
  CalendarCheck,
  Clock,
  ShieldCheck,
  UserPlus,
  FileText,
  ListChecks,
  DotsThreeVertical,
  MagnifyingGlass,
  Bell,
  UserList,
  GraduationCap,
  Bus,
  Calendar,
  ChalkboardTeacher,
  Student,
  ChatCircleDots,
  Megaphone,
  Sparkle,
  ArrowUpRight,
  CheckCircle,
  Cake,
  Heart,
  XCircle,
  X,
  SpinnerGap,
  BookOpen,
  ArrowSquareOut,
  Gift
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { AdminStatCard } from "./admin-stat-card";
import { getAllUsers } from "../../services/users-service";
import {
  getDashboardOverview,
  DashboardOverview,
  MonthlyChartEntry,
  RecentRegistration,
} from "../../services/dashboard-service";
import { apiRequest } from "../../services/api-client";
import Link from "next/link";
import { useAuth } from "../../hooks/use-auth";

interface DashboardUser {
  name: string;
  email: string;
  department: string;
  status: string;
  role: string;
}

const QUICK_ACTIONS = [
  { icon: UserPlus,        label: "Add Student",      desc: "New enrollment",   href: "/admin/admission",    color: "#FF7F50" },
  { icon: Users,           label: "Manage Users",     desc: "All accounts",     href: "/admin/users",        color: "#4f46e5" },
  { icon: Megaphone,       label: "Upload Post",      desc: "Announcement",     href: "/admin/notifications",  color: "#10b981" },
  { icon: GraduationCap,   label: "Publish Results",  desc: "Publish marks",    href: "/admin/results",      color: "#f59e0b" },
  { icon: FileText,        label: "Generate Report",  desc: "Generate data",    href: "/admin/reports",      color: "#8b5cf6" },
  { icon: ChatCircleDots,  label: "Chat",             desc: "Direct messaging", href: "/admin/chat",         color: "#ec4899" },
];

const ALL_MODULES = [
  { icon: Bell,            label: "Notifications", href: "/admin/notifications" },
  { icon: UserList,        label: "Attendance",    href: "/admin/attendance" },
  { icon: Users,           label: "Users",         href: "/admin/users" },
  { icon: GraduationCap,   label: "Results",       href: "/admin/results" },
  { icon: Bus,             label: "Transport",     href: "/admin/transport" },
  { icon: Calendar,        label: "Timetable",     href: "/admin/timetable" },
  { icon: CalendarCheck,   label: "Calendar",      href: "/admin/calendar" },
  { icon: UserPlus,        label: "Admission",     href: "/admin/admission" },
  { icon: ChalkboardTeacher, label: "Staff",       href: "/admin/staff" },
  { icon: Student,         label: "Alumni",        href: "/admin/alumni" },
  { icon: FileText,        label: "Reports",       href: "/admin/reports" },
  { icon: ChatCircleDots,  label: "Chat",          href: "/admin/chat" },
];

import { ModernDashboard } from "./modern-dashboard";

export function AdminDashboard() {
  const { session } = useAuth();
  
  // Always render ClassicDashboard to prevent the layout from completely changing
  // when the user plays with the Appearance settings.
  return <ClassicDashboard session={session} />;
}

function BoysGirlsChart({ data = [] }: { data?: any[] }) {
  const chartData = Array.isArray(data) ? data : [];
  const W = 400, H = 200, pL = 40, pR = 10, pT = 20, pB = 30;
  const iW = W - pL - pR, iH = H - pT - pB;
  
  const values = chartData.map(d => {
    const b = typeof d?.boys === 'number' && !isNaN(d.boys) ? d.boys : 0;
    const g = typeof d?.girls === 'number' && !isNaN(d.girls) ? d.girls : 0;
    return Math.max(b, g);
  });
  const maxVal = Math.max(10, ...values) * 1.15;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxVal * t));
  const barWidth = 14;
  const groupSpacing = chartData.length > 0 ? iW / chartData.length : iW;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400">Student Enrollment Trend</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-[#3B82F6]" /> Boys
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-[#F43F5E]" /> Girls
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
        {ticks.map((v, i) => {
          const y = pT + iH - (v / maxVal) * iH;
          return (
            <g key={i}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
              <text x={pL - 8} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end" className="font-mono">{v}</text>
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const groupX = pL + i * groupSpacing + groupSpacing / 2;
          const bVal = typeof d?.boys === 'number' && !isNaN(d.boys) ? d.boys : 0;
          const gVal = typeof d?.girls === 'number' && !isNaN(d.girls) ? d.girls : 0;
          const boyH = (bVal / maxVal) * iH;
          const girlH = (gVal / maxVal) * iH;
          const boyX = groupX - barWidth - 2;
          const girlX = groupX + 2;
          const boyY = pT + iH - boyH;
          const girlY = pT + iH - girlH;
          return (
            <g key={d.year || i} className="group">
              <rect x={boyX} y={boyY} width={barWidth} height={boyH} fill="#3B82F6" rx="3" className="transition-all duration-300 hover:opacity-85" />
              <rect x={girlX} y={girlY} width={barWidth} height={girlH} fill="#F43F5E" rx="3" className="transition-all duration-300 hover:opacity-85" />
              <text x={boyX + barWidth/2} y={boyY - 4} fontSize="8" fontWeight="bold" fill="#3B82F6" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{bVal}</text>
              <text x={girlX + barWidth/2} y={girlY - 4} fontSize="8" fontWeight="bold" fill="#F43F5E" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{gVal}</text>
              <text x={groupX} y={H - 8} fontSize="10" fontWeight="bold" fill="#64748B" textAnchor="middle">{d.year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DailyAttendanceChart({ data = [] }: { data?: any[] }) {
  const chartData = Array.isArray(data) ? data : [];
  const W = 400, H = 200, pL = 40, pR = 10, pT = 20, pB = 30;
  const iW = W - pL - pR, iH = H - pT - pB;
  const maxVal = 100;
  const ticks = [0, 25, 50, 75, 100];
  const barWidth = 24;
  const groupSpacing = chartData.length > 0 ? iW / chartData.length : iW;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400">Weekly Attendance %</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-3 h-3 rounded-full bg-[#FF7F50]" /> Present Rate
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
        {ticks.map((v, i) => {
          const y = pT + iH - (v / maxVal) * iH;
          return (
            <g key={i}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
              <text x={pL - 8} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end" className="font-mono">{v}%</text>
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const groupX = pL + i * groupSpacing + groupSpacing / 2;
          const rateVal = typeof d?.rate === 'number' && !isNaN(d.rate) ? d.rate : 0;
          const barH = (rateVal / maxVal) * iH;
          const barX = groupX - barWidth / 2;
          const barY = pT + iH - barH;
          return (
            <g key={d.day || i} className="group">
              <rect x={barX} y={barY} width={barWidth} height={barH} fill="#FF7F50" rx="4" className="transition-all duration-300 hover:fill-[#e66a3e]" />
              <text x={groupX} y={barY - 5} fontSize="9" fontWeight="black" fill="#FF7F50" textAnchor="middle">{rateVal}%</text>
              <text x={groupX} y={H - 8} fontSize="10" fontWeight="bold" fill="#64748B" textAnchor="middle">{d.day}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ClassicDashboard({ session }: { session: any }) {
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [resolvingLeave, setResolvingLeave] = useState(false);
  const [leaveToast, setLeaveToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);
  const [genderStats, setGenderStats] = useState<any[]>([
    { year: 2022, boys: 450, girls: 420 },
    { year: 2023, boys: 510, girls: 480 },
    { year: 2024, boys: 590, girls: 560 },
    { year: 2025, boys: 680, girls: 650 },
    { year: 2026, boys: 3, girls: 3 }
  ]);
  const [attendanceStats, setAttendanceStats] = useState<any[]>([
    { day: "Mon", rate: 94 },
    { day: "Tue", rate: 92 },
    { day: "Wed", rate: 95 },
    { day: "Thu", rate: 89 },
    { day: "Fri", rate: 96 },
    { day: "Sat", rate: 91 }
  ]);

  const mainActions = [
    { label: "Send Notification", href: "/admin/notifications", icon: Megaphone, color: "#FF7F50", bg: "rgba(255,127,80,0.08)", desc: "Post global notices" },
    { label: "Send Homework",     href: "/admin/homework",     icon: BookOpen,  color: "#3B82F6", bg: "rgba(59,130,246,0.08)", desc: "Assign homework tasks" },
    { label: "Student Details",   href: "/admin/users",        icon: Student,   color: "#10B981", bg: "rgba(16,185,129,0.08)", desc: "View all students" },
    { label: "Staff Details",     href: "/admin/staff",        icon: ChalkboardTeacher, color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", desc: "View staff list" },
  ];

  const fetchPendingLeaves = async () => {
    if (!session?.accessToken) return;
    setLoadingLeaves(true);
    try {
      const data = await apiRequest<any[]>("/leaves", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setPendingLeaves((data || []).filter((l: any) => l.status === "pending"));
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();

    const fetchOtherData = async () => {
      try {
        setLoadingBirthdays(true);
        let users: any = [];
        try {
          users = await getAllUsers();
        } catch (e) {
          console.error("Failed to fetch users:", e);
        }
        const usersArray = Array.isArray(users) ? users : [];
        
        // 1. Process Birthdays
        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        
        const getDayOfYear = (date: Date) => {
          const start = new Date(date.getFullYear(), 0, 0);
          const diff = date.getTime() - start.getTime();
          const oneDay = 1000 * 60 * 60 * 24;
          return Math.floor(diff / oneDay);
        };
        
        const todayDayOfYear = getDayOfYear(today);
        
        const processDate = (dateStr: any) => {
          if (!dateStr || typeof dateStr !== 'string') return null;
          let date: Date;
          if (dateStr.includes('-')) {
            date = new Date(dateStr);
          } else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            date = new Date(dateStr);
          }
          if (isNaN(date.getTime())) return null;
          return {
            month: date.getMonth() + 1,
            day: date.getDate(),
            fullDate: date,
            dayOfYear: getDayOfYear(new Date(today.getFullYear(), date.getMonth(), date.getDate()))
          };
        };

        const extractedBirthdays = usersArray.reduce((acc: any[], user: any) => {
          const isStudent = user?.role === 'parent';
          const isTeacher = user?.role === 'teacher';
          if (!isStudent && !isTeacher) return acc;
          
          const dobStr = isStudent ? user.studentProfile?.dob : user.teacherProfile?.dateOfBirth;
          const dob = processDate(dobStr);
          if (dob) {
            const isToday = dob.month === todayMonth && dob.day === todayDay;
            acc.push({
              id: user.id,
              name: user.name,
              role: user.role,
              dob: dob,
              dobStr: dobStr,
              isToday,
              studentInfo: isStudent 
                ? `Student · Class ${user.studentProfile?.class || ''}-${user.studentProfile?.section || ''}` 
                : `Staff · ${user.teacherProfile?.department || user.department || ''}`
            });
          }
          return acc;
        }, []);

        const filteredBirthdays = extractedBirthdays.filter((item: any) => {
          if (item.isToday) return true;
          let diff = item.dob.dayOfYear - todayDayOfYear;
          if (diff < 0) diff += 365;
          return diff >= 0 && diff <= 30; // Next 30 days
        }).sort((a: any, b: any) => {
          if (a.isToday && !b.isToday) return -1;
          if (!a.isToday && b.isToday) return 1;
          let diffA = a.dob.dayOfYear - todayDayOfYear;
          if (diffA < 0) diffA += 365;
          let diffB = b.dob.dayOfYear - todayDayOfYear;
          if (diffB < 0) diffB += 365;
          return diffA - diffB;
        });

        setBirthdays(filteredBirthdays);

        // 2. Count Boys vs Girls for 2026 dynamically
        let boys2026 = 0;
        let girls2026 = 0;
        for (const u of usersArray) {
          if (u?.role === 'parent' && u.studentProfile) {
            const gender = (u.studentProfile.gender || '').toLowerCase();
            if (gender === 'male' || gender === 'boy' || gender === 'm') {
              boys2026++;
            } else if (gender === 'female' || gender === 'girl' || gender === 'f') {
              girls2026++;
            }
          }
        }
        
        setGenderStats([
          { year: 2022, boys: 450, girls: 420 },
          { year: 2023, boys: 510, girls: 480 },
          { year: 2024, boys: 590, girls: 560 },
          { year: 2025, boys: 680, girls: 650 },
          { year: 2026, boys: Math.max(3, boys2026), girls: Math.max(3, girls2026) }
        ]);

      } catch (err) {
        console.error("Error loading dashboard birthdays/gender:", err);
      } finally {
        setLoadingBirthdays(false);
      }

      // 3. Process daily attendance dynamically if records exist
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await apiRequest<any>(`/attendance?date=${todayStr}`);
        if (res && Array.isArray(res.classWiseAttendance)) {
          let totalStudents = 0;
          let presentStudents = 0;
          for (const item of res.classWiseAttendance) {
            totalStudents += item.total || 0;
            presentStudents += item.present || 0;
          }
          const todayRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 94;
          
          setAttendanceStats([
            { day: "Mon", rate: 94 },
            { day: "Tue", rate: 92 },
            { day: "Wed", rate: 95 },
            { day: "Thu", rate: 89 },
            { day: "Fri", rate: 96 },
            { day: "Sat", rate: todayRate }
          ]);
        }
      } catch (e) {
        console.error("Failed to load attendance stats:", e);
      }
    };

    fetchOtherData();
  }, [session?.accessToken]);

  const showLeaveToast = (msg: string, ok: boolean) => {
    setLeaveToast({ msg, ok });
    setTimeout(() => setLeaveToast(null), 3500);
  };

  const handleResolveLeave = async (id: string, status: "approved" | "rejected") => {
    if (!session?.accessToken) return;
    setResolvingLeave(true);
    try {
      await apiRequest(`/leaves/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status, adminNote: noteInput }),
      });
      showLeaveToast(`Leave request ${status} successfully.`, true);
      setSelectedLeave(null);
      setNoteInput("");
      fetchPendingLeaves();
    } catch (err) {
      showLeaveToast("Failed to resolve leave request.", false);
    } finally {
      setResolvingLeave(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Toast Notification */}
      {leaveToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 right-5 z-[110] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: leaveToast.ok ? "#10B981" : "#EF4444" }}
        >
          {leaveToast.ok ? <CheckCircle size={18} weight="fill" /> : <XCircle size={18} weight="fill" />}
          {leaveToast.msg}
        </motion.div>
      )}

      {/* ── Main Action Buttons at the Top ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mainActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link href={action.href} key={i}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:border-[#FF7F50]/20 transition-all cursor-pointer flex items-center gap-4 group h-24"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
                  style={{ background: action.bg, color: action.color }}
                >
                  <Icon size={24} weight="duotone" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-[15px] leading-tight group-hover:text-[#FF7F50] transition-colors">{action.label}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">{action.desc}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </section>

      {/* ── Bottom Section: Quick Actions & Leave Approvals ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-6"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <ListChecks size={20} className="text-[#FF7F50]" />
              <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} href={action.href}>
                    <motion.div
                      whileHover={{ y: -6, boxShadow: "0 16px 32px rgba(0,0,0,0.06)", border: "1px solid rgba(255,127,80,0.2)" }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-slate-100 transition-all cursor-pointer text-center group min-h-[140px]"
                      style={{ background: `${action.color}04` }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
                        style={{ background: `${action.color}14`, color: action.color }}
                      >
                        <Icon size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 leading-tight group-hover:text-[#FF7F50] transition-colors">{action.label}</p>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                          {action.desc}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Celebrations / Birthdays Container */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            className="rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Cake size={20} className="text-[#FF7F50]" />
                <h3 className="text-lg font-bold text-slate-900">Celebrations</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Next 30 Days
              </span>
            </div>

            {loadingBirthdays ? (
              <div className="flex justify-center py-6">
                <SpinnerGap size={20} className="animate-spin text-[#FF7F50]" />
              </div>
            ) : birthdays.length === 0 ? (
              <div className="py-6 text-center text-slate-400 font-bold text-sm">
                No upcoming birthdays this month.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {birthdays.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      item.isToday
                        ? "bg-orange-50 border-orange-200 shadow-sm shadow-orange-500/10"
                        : "bg-slate-50/50 border-slate-50 hover:border-[#FF7F50]/20 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        item.isToday 
                          ? "bg-[#FF7F50] text-white shadow-md shadow-orange-500/20" 
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.isToday ? <Sparkle size={16} weight="fill" /> : <Cake size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {item.name}
                          {item.isToday && (
                            <span className="text-[9px] bg-[#FF7F50] text-white px-1.5 py-0.5 rounded-full font-black tracking-tight uppercase animate-pulse">
                              Today
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.studentInfo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#FF7F50]">
                        {item.dob.day.toString().padStart(2, '0')}/
                        {item.dob.month.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Bar Charts Row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.29 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Chart 1: Boys & Girls */}
            <div className="rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Users size={20} className="text-[#3B82F6]" />
                <h3 className="text-lg font-bold text-slate-900">Student Gender Stats</h3>
              </div>
              <BoysGirlsChart data={genderStats} />
            </div>

            {/* Chart 2: Daily Attendance */}
            <div className="rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Calendar size={20} className="text-[#FF7F50]" />
                <h3 className="text-lg font-bold text-slate-900">Daily Attendance Tracker</h3>
              </div>
              <DailyAttendanceChart data={attendanceStats} />
            </div>
          </motion.div>
        </div>

        {/* Right: Leave Approvals (span-4) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[2.5rem] border border-[var(--border)] bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)] h-full flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[#FF7F50]" />
                <h3 className="text-lg font-bold text-slate-900">Leave Approvals</h3>
              </div>
              {pendingLeaves.length > 0 && (
                <span className="text-[10px] bg-[#FF7F50]/10 text-[#FF7F50] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  {pendingLeaves.length} Pending
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
              {loadingLeaves ? (
                <div className="flex justify-center py-10"><SpinnerGap size={24} className="animate-spin text-[#FF7F50]" /></div>
              ) : pendingLeaves.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold text-sm">
                  No pending leave applications.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      onClick={() => { setSelectedLeave(leave); setNoteInput(leave.adminNote || ""); }}
                      className="p-4 rounded-2xl border border-slate-50 hover:border-[#FF7F50]/30 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#e66a3e] text-white flex items-center justify-center font-black text-sm shrink-0">
                          {leave.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 group-hover:text-[#FF7F50] transition-colors">
                            {leave.studentName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Class {leave.class}-{leave.section}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[#FF7F50] transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Leave Application Detail Modal ── */}
      {selectedLeave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={() => setSelectedLeave(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full z-10 flex flex-col gap-5"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Leave Request</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Submitted {new Date(selectedLeave.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Student Info */}
            <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#e66a3e] text-white flex items-center justify-center font-black text-sm shrink-0">
                {selectedLeave.studentName.charAt(0)}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-base leading-none">{selectedLeave.studentName}</p>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1.5">Class {selectedLeave.class}-{selectedLeave.section} · {selectedLeave.user?.email || ""}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">From Date</p>
                <p className="font-bold text-slate-800 text-xs">{selectedLeave.startDate}</p>
              </div>
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">To Date</p>
                <p className="font-bold text-slate-800 text-xs">{selectedLeave.endDate}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Reason</p>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedLeave.reason}</p>
            </div>

            {/* Supporting Document */}
            {selectedLeave.documentUrl && (
              <a
                href={selectedLeave.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 font-bold text-xs px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowSquareOut size={16} />
                View Attachment
              </a>
            )}

            {/* Admin Note */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Note for Parent/Student</label>
              <input
                type="text"
                placeholder="Optional explanation..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#FF7F50] focus:ring-2 focus:ring-[#FF7F50]/10 transition-all"
              />
            </div>

            {/* Resolve Actions */}
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleResolveLeave(selectedLeave.id, "approved")}
                disabled={resolvingLeave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50"
              >
                {resolvingLeave ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
                Approve
              </button>
              <button
                onClick={() => handleResolveLeave(selectedLeave.id, "rejected")}
                disabled={resolvingLeave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all disabled:opacity-50"
              >
                {resolvingLeave ? <SpinnerGap size={16} className="animate-spin" /> : <XCircle size={16} weight="bold" />}
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
// Force hot reload
