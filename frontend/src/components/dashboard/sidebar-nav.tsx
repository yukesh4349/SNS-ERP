"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import {
  Layout,
  UserList,
  Calendar,
  ArrowsLeftRight,
  ChalkboardTeacher,
  FileText,
  Gear,
  SignOut,
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
  Megaphone,
} from "@phosphor-icons/react";

export function SidebarNav() {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const isAdmin    = session?.user.role === "admin" || session?.user.role === "superadmin" || session?.user.role === "leader";
  const isTeacher  = session?.user.role === "teacher";
  const portalLabel = isAdmin ? "Admin Panel" : isTeacher ? "Teacher Portal" : "User Portal";

  const sections = [
    {
      title: "MENU",
      items: [
        { label: "Dashboard",    href: "/dashboard",               icon: <Layout         size={18} weight="duotone" /> },
        { label: "Notifications",href: "/dashboard/notifications",  icon: <Bell           size={18} weight="duotone" /> },
        { label: "Attendance",   href: "/dashboard/attendance",     icon: <UserList       size={18} weight="duotone" /> },
        { label: "Timetable",    href: "/dashboard/timetable",      icon: <Calendar       size={18} weight="duotone" /> },
        { label: "Calendar",     href: "/dashboard/calendar",       icon: <CalendarCheck  size={18} weight="duotone" /> },
        {
          label: "New Post",
          href: "/dashboard/notice-post",
          icon: <Plus size={18} weight="bold" />,
          highlight: true,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "MANAGEMENT",
            items: [
              { label: "Users",           href: "/dashboard/users",   icon: <Users           size={18} weight="duotone" /> },
              { label: "Staff",           href: "/dashboard/staff",   icon: <ChalkboardTeacher size={18} weight="duotone" /> },
              { label: "Role Assignment",     href: "/dashboard/roles",            icon: <IdentificationCard size={18} weight="duotone" /> },
              { label: "Admission",           href: "/dashboard/admission",        icon: <UserPlus           size={18} weight="duotone" /> },
              { label: "Profile Requests",    href: "/dashboard/profile-requests", icon: <UserCircle         size={18} weight="duotone" /> },
            ],
          },
        ]
      : []),
    {
      title: "TOOLS",
      items: [
        ...(isTeacher
          ? [
              { label: "My Profile",  href: "/dashboard/profile",      icon: <UserCircle    size={18} weight="duotone" /> },
              { label: "Substitution",href: "/dashboard/substitution",  icon: <ArrowsLeftRight size={18} weight="duotone" /> },
            ]
          : []),
        { label: "Alumni",    href: "/dashboard/alumni",    icon: <Student       size={18} weight="duotone" /> },
        { label: "Results",   href: "/dashboard/results",   icon: <GraduationCap size={18} weight="duotone" /> },
        { label: "Transport", href: "/dashboard/transport", icon: <Bus           size={18} weight="duotone" /> },
        { label: "Reports",   href: "/dashboard/reports",   icon: <FileText      size={18} weight="duotone" /> },
        { label: "Chat",      href: "/dashboard/chat",      icon: <ChatCircleDots size={18} weight="duotone" /> },
        { label: "Settings",  href: "/dashboard/settings",  icon: <Gear          size={18} weight="duotone" /> },
      ],
    },
  ];

  return (
    <aside className="hide-scrollbar h-screen w-full flex flex-col bg-white border-r border-[#F1F5F9] z-50 overflow-hidden">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-black/5 p-1.5 shrink-0">
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="w-full h-auto object-contain" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
            SNS Academy
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FF7F50] mt-1.5">
            {portalLabel}
          </p>
        </div>
      </div>

      {/* User pill */}
      {session && (
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-[#FF7F50]/15 bg-[#FF7F50]/[0.04] px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#e66a3e] text-white flex items-center justify-center text-xs font-black shrink-0">
            {session.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-none">{session.user.name}</p>
            <p className="text-[10px] font-semibold text-[#FF7F50] capitalize mt-0.5">{session.user.role}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 px-3 py-5 overflow-y-auto hide-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-3 mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
              {section.title}
            </p>
            <nav className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`group flex w-full items-center gap-3 rounded-xl font-semibold text-[13.5px] transition-all duration-200 ${
                      item.highlight
                        ? "bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/25 px-4 py-3 my-1.5 hover:bg-[#e66a3e] active:scale-[0.98]"
                        : isActive
                        ? "bg-[#FF7F50]/[0.09] text-[#FF7F50] px-4 py-2.5"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 px-4 py-2.5"
                    }`}
                  >
                    <span
                      className={`shrink-0 transition-colors ${
                        item.highlight || isActive
                          ? "text-inherit"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && !item.highlight && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF7F50] shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-[#F1F5F9]">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl p-3 text-slate-500 font-bold text-sm transition-all hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
        >
          <SignOut size={18} weight="duotone" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
