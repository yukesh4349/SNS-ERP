"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import { apiRequest } from "../../services/api-client";
import {
  Layout,
  UserList,
  Calendar,
  ArrowsLeftRight,
  ChalkboardTeacher,
  FileText,
  Gear,
  Bell,
  Users,
  GraduationCap,
  Bus,
  CalendarCheck,
  UserPlus,
  Student,
  ChatCircleDots,
  UserCircle,
  Plus,
  IdentificationCard,
  ClipboardText,
  Cake,
  MagnifyingGlass,
  Command,
  Images,
} from "@phosphor-icons/react";

interface SidebarCounts {
  notifications: number;
  profileRequests: number;
  substitutions: number;
  leaves: number;
  admission: number;
}

export function SidebarNav() {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const isAdmin   = session?.user.role === "admin" || session?.user.role === "superadmin" || session?.user.role === "leader";
  const isTeacher = session?.user.role === "teacher";

  const roleLabel = session?.user.role === "admin" || session?.user.role === "superadmin"
    ? "Admin"
    : session?.user.role === "leader"
    ? "Leader"
    : session?.user.role === "teacher"
    ? "Teacher"
    : "Portal";

  const [counts, setCounts] = useState<SidebarCounts>({
    notifications: 0,
    profileRequests: 0,
    substitutions: 0,
    leaves: 0,
    admission: 0,
  });

  useEffect(() => {
    if (!session) return;
    apiRequest<SidebarCounts>("/dashboard/counts")
      .then(setCounts)
      .catch(() => {});
  }, [session]);

  const sections = [
    {
      title: "WORKSPACE",
      items: [
        { label: "Dashboard",     href: "/dashboard",               icon: <Layout            size={16} weight="duotone" />, badge: "Live" },
        { label: "Students",      href: "/dashboard/students",      icon: <Users             size={16} weight="duotone" /> },
        { label: "Attendance",    href: "/dashboard/attendance",     icon: <UserList          size={16} weight="duotone" /> },
        { label: "Timetable",     href: "/dashboard/timetable",      icon: <Calendar          size={16} weight="duotone" /> },
        { label: "Calendar",      href: "/dashboard/calendar",       icon: <CalendarCheck     size={16} weight="duotone" /> },
        { label: "Notifications", href: "/dashboard/notifications",  icon: <Bell             size={16} weight="duotone" />, count: counts.notifications || undefined },
        { label: "New Post",       href: "/dashboard/notice-post",     icon: <Plus   size={16} weight="bold"    />, highlight: true },
        { label: "Event Gallery",  href: "/dashboard/events-gallery",  icon: <Images size={16} weight="duotone" /> },
      ],
    },
    ...(isAdmin ? [{
      title: "MANAGEMENT",
      items: [
        { label: "Users",              href: "/dashboard/users",            icon: <Users              size={16} weight="duotone" /> },
        { label: "Staff",              href: "/dashboard/staff",            icon: <ChalkboardTeacher  size={16} weight="duotone" /> },
        { label: "Role Assignment",    href: "/dashboard/roles",            icon: <IdentificationCard size={16} weight="duotone" /> },
        { label: "Admission",          href: "/dashboard/admission",        icon: <UserPlus           size={16} weight="duotone" />, count: counts.admission || undefined },
        { label: "Profile Requests",   href: "/dashboard/profile-requests", icon: <UserCircle         size={16} weight="duotone" />, count: counts.profileRequests || undefined },
        { label: "Leave Applications", href: "/dashboard/leaves",           icon: <ClipboardText      size={16} weight="duotone" />, count: counts.leaves || undefined },
        { label: "Birthdays",          href: "/dashboard/birthdays",        icon: <Cake               size={16} weight="duotone" /> },
        { label: "Substitutions",      href: "/dashboard/substitutions",    icon: <ArrowsLeftRight    size={16} weight="duotone" />, count: counts.substitutions || undefined },
      ],
    }] : []),
    {
      title: "TOOLS",
      items: [
        ...(isTeacher ? [
          { label: "Teacher Portal", href: "/teacher-dashboard",      icon: <ChalkboardTeacher size={16} weight="duotone" />, highlight: true },
          { label: "My Profile",     href: "/dashboard/profile",      icon: <UserCircle        size={16} weight="duotone" /> },
          { label: "Substitution",   href: "/dashboard/substitution", icon: <ArrowsLeftRight   size={16} weight="duotone" /> },
        ] : []),
        { label: "Alumni",    href: "/dashboard/alumni",    icon: <Student        size={16} weight="duotone" /> },
        { label: "Results",   href: "/dashboard/results",   icon: <GraduationCap  size={16} weight="duotone" /> },
        { label: "Transport", href: "/dashboard/transport", icon: <Bus            size={16} weight="duotone" /> },
        { label: "Reports",   href: "/dashboard/reports",   icon: <FileText       size={16} weight="duotone" /> },
        { label: "Chat",      href: "/dashboard/chat",      icon: <ChatCircleDots size={16} weight="duotone" /> },
        { label: "Settings",  href: "/dashboard/settings",  icon: <Gear           size={16} weight="duotone" /> },
      ],
    },
  ];

  return (
    <aside className="hide-scrollbar h-screen w-full flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] z-50 overflow-hidden">

      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FF7F50] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-[#FF7F50]/30">
          S
        </div>
        <div>
          <p className="text-[13px] font-black text-[var(--text-primary)] leading-none tracking-tight">SNS Academy</p>
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] mt-0.5">ERP · {roleLabel}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 cursor-text group hover:border-[#FF7F50]/50 transition-all">
          <MagnifyingGlass size={14} className="text-[var(--text-secondary)] shrink-0" />
          <span className="flex-1 text-xs text-[var(--text-secondary)] font-medium">Search...</span>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Command size={10} className="text-[var(--text-secondary)]" />
            </span>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-1 opacity-50">K</span>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 px-3 overflow-y-auto hide-scrollbar pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {section.title}
            </p>
            <nav className="flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-all duration-150 ${
                      item.highlight
                        ? "bg-[#FF7F50] text-white shadow-md shadow-[#FF7F50]/20 my-1 hover:bg-[#e66a3e]"
                        : isActive
                        ? "bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className={`shrink-0 ${
                      item.highlight ? "text-white" :
                      isActive ? "text-[#FF7F50]" :
                      "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    }`}>
                      {item.icon}
                    </span>

                    <span className="flex-1 truncate">{item.label}</span>

                    {item.badge && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-500 border border-emerald-100">
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && (
                      <span className={`text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-md px-1 ${
                        isActive
                          ? "bg-[#FF7F50]/10 text-[#FF7F50]"
                          : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      }`}>
                        {item.count}
                      </span>
                    )}

                    {isActive && !item.highlight && !item.count && !item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7F50] shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom profile */}
      {session && (
        <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-primary)] transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#FF7F50] text-white flex items-center justify-center text-xs font-black shrink-0">
              {session.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-none">{session.user.name}</p>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate mt-0.5">{session.user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Sign out"
            >
              <Gear size={14} className="group-hover:text-[var(--text-primary)] transition-colors" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
