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
  { icon: UserPlus,        label: "Add Student",   desc: "New enrollment",   href: "/dashboard/admission",    color: "#FF7F50" },
  { icon: Users,           label: "Manage Users",  desc: "All accounts",     href: "/dashboard/users",         color: "#4f46e5" },
  { icon: Megaphone,       label: "Post Notice",   desc: "Announcement",     href: "/dashboard/notice-post",   color: "#10b981" },
  { icon: GraduationCap,   label: "Results",       desc: "Publish marks",    href: "/dashboard/results",       color: "#f59e0b" },
  { icon: FileText,        label: "Reports",       desc: "Generate data",    href: "/dashboard/reports",       color: "#8b5cf6" },
  { icon: ChatCircleDots,  label: "Chat",          desc: "Direct messaging", href: "/dashboard/chat",          color: "#ec4899" },
];

const ALL_MODULES = [
  { icon: Bell,            label: "Notifications", href: "/dashboard/notifications" },
  { icon: UserList,        label: "Attendance",    href: "/dashboard/attendance" },
  { icon: Users,           label: "Users",         href: "/dashboard/users" },
  { icon: GraduationCap,   label: "Results",       href: "/dashboard/results" },
  { icon: Bus,             label: "Transport",     href: "/dashboard/transport" },
  { icon: Calendar,        label: "Timetable",     href: "/dashboard/timetable" },
  { icon: CalendarCheck,   label: "Calendar",      href: "/dashboard/calendar" },
  { icon: UserPlus,        label: "Admission",     href: "/dashboard/admission" },
  { icon: ChalkboardTeacher, label: "Staff",       href: "/dashboard/staff" },
  { icon: Student,         label: "Alumni",        href: "/dashboard/alumni" },
  { icon: FileText,        label: "Reports",       href: "/dashboard/reports" },
  { icon: ChatCircleDots,  label: "Chat",          href: "/dashboard/chat" },
];

export function AdminDashboard() {
  const { session } = useAuth();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const firstName = session?.user?.name?.split(" ")[0] || "Admin";

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersResult, overviewResult] = await Promise.allSettled([
          getAllUsers(),
          getDashboardOverview(),
        ]);
        if (usersResult.status === "fulfilled") {
          setUsers(
            (usersResult.value as DashboardUser[]).filter(
              (u: DashboardUser) => u.role === "parent"
            )
          );
        }
        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      label: overview?.stats[0]?.label || "Total Students",
      value: isLoading ? "..." : overview?.stats[0]?.value || users.length.toString(),
      change: "Live",
      icon: <Users size={24} />,
      color: "#FF7F50",
      href: "/dashboard/users",
    },
    {
      label: overview?.stats[1]?.label || "Active Staff",
      value: isLoading ? "..." : overview?.stats[1]?.value || "0",
      change: "Live",
      icon: <UserSquare size={24} />,
      color: "#4f46e5",
      href: "/dashboard/staff",
    },
    {
      label: overview?.stats[3]?.label || "Unread Notifications",
      value: isLoading ? "..." : overview?.stats[3]?.value || "0",
      change: "Live",
      icon: <Bell size={24} />,
      color: "#10b981",
      href: "/dashboard/notifications",
    },
    {
      label: "New This Week",
      value: isLoading ? "..." : overview?.newUsersThisWeek?.toString() || "0",
      change: "Live",
      icon: <Sparkle size={24} />,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-[2rem] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FF7F50 0%, #e05e35 60%, #b84930 100%)",
        }}
      >
        {/* subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative px-8 py-9 sm:px-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} weight="fill" className="text-white/75" />
              <span className="text-white/75 text-[11px] font-bold uppercase tracking-[0.18em]">
                Admin Control Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Hello, {firstName}! 👋
            </h1>
            <p className="text-white/65 mt-2 text-sm font-medium">
              Here&apos;s a real-time snapshot of SNS Academy&apos;s operations.
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-3 sm:justify-end">
            {[
              { label: "New this week", value: isLoading ? "…" : (overview?.newUsersThisWeek ?? 0).toString() },
              { label: "Registrations", value: isLoading ? "…" : (overview?.recentRegistrations?.length ?? 0).toString() },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3"
              >
                <span className="text-2xl font-black text-white">{item.value}</span>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <AdminStatCard {...stat} />
          </motion.div>
        ))}
      </section>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-2 mb-7">
              <ListChecks size={20} className="text-[#FF7F50]" />
              <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} href={action.href}>
                    <motion.div
                      whileHover={{ y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.08)" }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-100 transition-all cursor-pointer text-center group"
                      style={{ background: `${action.color}06` }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
                        style={{ background: `${action.color}18`, color: action.color }}
                      >
                        <Icon size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{action.label}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">
                          {action.desc}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* All System Modules */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-2 mb-7">
              <CheckCircle size={20} className="text-[#FF7F50]" />
              <h3 className="text-lg font-bold text-slate-900">System Modules</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {ALL_MODULES.map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <Link key={i} href={mod.href}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF7F50]/30 hover:bg-white hover:shadow-lg transition-all text-center group cursor-pointer"
                    >
                      <div className="text-slate-400 group-hover:text-[#FF7F50] transition-colors">
                        <Icon size={26} weight="duotone" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
                        {mod.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Student Roster */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between mb-7">
              <h3 className="text-lg font-semibold text-slate-900">Student Roster</h3>
              <div className="flex gap-3">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-[#FF7F50] outline-none transition-colors w-44"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 font-bold">Student Name</th>
                    <th className="pb-4 font-bold">Email</th>
                    <th className="pb-4 font-bold">Department</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                        Loading records from database…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                        {searchQuery
                          ? "No students match your search."
                          : 'No students found. Use "Admission" to add one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((student, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="py-4 font-semibold text-slate-900">{student.name}</td>
                        <td className="py-4 text-slate-500">{student.email}</td>
                        <td className="py-4 text-slate-500">{student.department}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              student.status?.toLowerCase() === "active"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-4 text-slate-300 text-right group-hover:text-[#FF7F50] transition-colors cursor-pointer">
                          <DotsThreeVertical size={20} className="inline-block" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Enrollment Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Enrollment Trends{" "}
                <span className="text-xs font-normal text-slate-400">(current year)</span>
              </h3>
            </div>
            <div className="flex items-center gap-6 mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF7F50]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Boys</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Girls</span>
              </div>
            </div>
            <div className="h-56 w-full flex items-end gap-2 px-2">
              {(
                overview?.monthlyChart ??
                Array.from({ length: 12 }, (_, i) => ({
                  month: i + 1,
                  boys: 0,
                  girls: 0,
                  boysCount: 0,
                  girlsCount: 0,
                }))
              ).map((data: MonthlyChartEntry, i: number) => (
                <div key={i} className="flex-1 flex items-end gap-0.5 h-full group relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${data.boys || 0}%` }}
                    transition={{ duration: 0.9, delay: i * 0.05, ease: "easeOut" }}
                    className="flex-1 rounded-t-md bg-[#FF7F50]"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${data.girls || 0}%` }}
                    transition={{ duration: 0.9, delay: i * 0.05 + 0.1, ease: "easeOut" }}
                    className="flex-1 rounded-t-md bg-slate-200"
                  />
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-2 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                    <span className="font-bold block mb-1">Month {data.month}</span>
                    <div className="flex justify-between gap-3">
                      <span>Boys</span>
                      <span className="text-[#FF7F50] font-bold">{data.boysCount}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Girls</span>
                      <span className="text-slate-300 font-bold">{data.girlsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-400 uppercase tracking-widest font-bold px-2">
              <span>Jan</span>
              <span>Mar</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Dec</span>
            </div>
          </motion.div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* Recent Registrations */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
              {overview?.newUsersThisWeek != null && overview.newUsersThisWeek > 0 && (
                <span className="text-[10px] bg-[#FF7F50]/10 text-[#FF7F50] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  {overview.newUsersThisWeek} this week
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {isLoading ? (
                <p className="text-sm text-slate-400 text-center py-4">Loading…</p>
              ) : overview?.recentRegistrations?.length ? (
                overview.recentRegistrations.map((item: RecentRegistration, i: number) => (
                  <RegistrationItem key={i} name={item.name} type={item.type} date={item.date} />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No recent registrations.</p>
              )}
            </div>

            <Link href="/dashboard/users">
              <button className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                View All Users
                <ArrowUpRight size={14} />
              </button>
            </Link>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-[2rem] border border-[var(--border)] bg-white/95 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.05)] flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#FF7F50]" />
              <h3 className="text-base font-bold text-slate-900">Pending Approvals</h3>
            </div>
            <PendingItem label="3 Leave Requests"  type="Teachers"   color="#f59e0b" href="/dashboard/attendance" />
            <PendingItem label="5 New Admissions"  type="Students"   color="#FF7F50" href="/dashboard/admission" />
            <PendingItem label="2 Staff Changes"   type="Management" color="#4f46e5" href="/dashboard/staff" />
          </motion.div>

          {/* System Pulse */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 }}
            className="rounded-[2rem] border border-[#FF7F50]/20 bg-gradient-to-br from-[#FF7F50]/5 via-white to-white p-7 shadow-[0_24px_60px_rgba(255,127,80,0.07)]"
          >
            <div className="flex items-center gap-3 mb-5">
              <TrendUp size={22} className="text-[#FF7F50]" />
              <h3 className="text-base font-bold text-slate-900">System Pulse</h3>
            </div>
            <div className="flex flex-col gap-4">
              <PulseItem label="Database Sync"    status="Operational" />
              <PulseItem label="Staff Portal"     status="Active"      />
              <PulseItem label="Notification Hub" status="Healthy"     />
              <PulseItem label="Parent Portal"    status="Online"      />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function RegistrationItem({ name, type, date }: { name: string; type: string; date: string }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FF7F50]/10 text-[#FF7F50] flex items-center justify-center text-xs font-black">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF7F50] transition-colors leading-none">
            {name}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{type}</p>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{date}</span>
    </div>
  );
}

function PendingItem({
  label,
  type,
  color,
  href,
}: {
  label: string;
  type: string;
  color: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
        <div>
          <p className="text-sm font-bold text-slate-900 group-hover:text-slate-700">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{type}</p>
        </div>
        <span
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{ background: `${color}18`, color }}
        >
          Review
        </span>
      </div>
    </Link>
  );
}

function PulseItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7F50] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7F50]" />
        </span>
        <span className="text-xs font-bold text-slate-900">{status}</span>
      </div>
    </div>
  );
}
