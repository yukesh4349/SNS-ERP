"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  X,
  SquaresFour,
  UserPlus,
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardText,
  ChartBar,
  Bus,
  Megaphone,
  Bell,
  CalendarBlank,
  BookOpen,
  ShieldCheck,
  Gear,
  ChatCircleDots,
  PaperPlaneTilt,
  ArrowRight
} from "@phosphor-icons/react";

interface SearchItem {
  id: string;
  title: string;
  category: "Navigation" | "Academics" | "Administration" | "Communication";
  href: string;
  icon: React.ReactNode;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: "dashboard", title: "Dashboard Overview", category: "Navigation", href: "/admin", icon: <SquaresFour size={18} />, keywords: ["home", "main", "stats", "overview"] },
  { id: "admission", title: "Student Enrollment / Admission", category: "Academics", href: "/admin/admission", icon: <UserPlus size={18} />, keywords: ["enroll", "admission", "register", "new student", "kg"] },
  { id: "students", title: "Student Directory", category: "Academics", href: "/admin/students", icon: <GraduationCap size={18} />, keywords: ["students", "pupils", "roll", "directory"] },
  { id: "staff", title: "Staff & Faculty Directory", category: "Administration", href: "/admin/staff", icon: <Users size={18} />, keywords: ["staff", "teachers", "faculty", "employees", "add staff"] },
  { id: "timetable", title: "Timetable & Schedules", category: "Academics", href: "/admin/timetable", icon: <ClipboardText size={18} />, keywords: ["timetable", "schedule", "classes", "periods", "routine"] },
  { id: "attendance", title: "Attendance Tracker", category: "Academics", href: "/admin/attendance", icon: <CalendarCheck size={18} />, keywords: ["attendance", "present", "absent", "leave"] },
  { id: "results", title: "Results & Report Cards", category: "Academics", href: "/admin/results", icon: <ChartBar size={18} />, keywords: ["results", "marks", "grades", "report card", "exam"] },
  { id: "transport", title: "Transport & Bus Routes", category: "Administration", href: "/admin/transport", icon: <Bus size={18} />, keywords: ["transport", "bus", "route", "stops", "driver", "vehicle"] },
  { id: "notice-post", title: "New Notice / Post", category: "Communication", href: "/admin/notice-post", icon: <Megaphone size={18} />, keywords: ["post", "notice", "announcement", "image", "upload"] },
  { id: "notifications", title: "Notification Broadcast", category: "Communication", href: "/admin/notifications", icon: <Bell size={18} />, keywords: ["notification", "broadcast", "alert", "message", "parents"] },
  { id: "calendar", title: "Academic Calendar", category: "Academics", href: "/admin/calendar", icon: <CalendarBlank size={18} />, keywords: ["calendar", "events", "holidays", "dates"] },
  { id: "homework", title: "Homework & Assignments", category: "Academics", href: "/admin/homework", icon: <BookOpen size={18} />, keywords: ["homework", "assignment", "tasks", "submission"] },
  { id: "leaves", title: "Leave Applications", category: "Administration", href: "/admin/leave-applications", icon: <PaperPlaneTilt size={18} />, keywords: ["leave", "parent leave", "approval", "applications"] },
  { id: "roles", title: "Role & Permission Management", category: "Administration", href: "/admin/roles", icon: <ShieldCheck size={18} />, keywords: ["roles", "permissions", "access", "rbac", "security"] },
  { id: "chat", title: "Chat & Communication", category: "Communication", href: "/admin/chat", icon: <ChatCircleDots size={18} />, keywords: ["chat", "messages", "inbox", "conversation"] },
  { id: "settings", title: "School Settings", category: "Administration", href: "/admin/settings", icon: <Gear size={18} />, keywords: ["settings", "config", "profile", "preferences"] },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS;
    const lower = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        item.keywords.some((k) => k.toLowerCase().includes(lower))
      );
    });
  }, [query]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#111827] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <MagnifyingGlass size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, modules, actions... (e.g. Admission, Timetable)"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          )}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-slate-800/50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FF7F50]/10 text-[#FF7F50] dark:bg-[#FF7F50]/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-[#FF7F50] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{item.title}</p>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className={`transition-transform ${
                      isSelected ? "translate-x-1 opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Navigate with ↑ / ↓ and Enter</span>
          <span>SNS Academy ERP</span>
        </div>
      </div>
    </div>
  );
}
