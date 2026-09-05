"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, MagnifyingGlass, Sun, Moon, ChatCircleDots, List, X, SidebarSimple, DownloadSimple, Plus, Command } from "@phosphor-icons/react";
import { SidebarNav } from "./sidebar-nav";
import { NotificationCenter } from "./notification-center";
import { GlobalSearchModal } from "./global-search-modal";
import { useAuth } from "../../hooks/use-auth";
import { canAccessWebDashboard } from "../../lib/role-access";
import { getProfilePhotoLocally } from "../../lib/supabase";
import { DashboardBottomNav } from "./DashboardBottomNav";

export function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isBootstrapping, logout, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(session?.user?.role === "parent");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = 
      localStorage.getItem("sns-theme") === "dark" || 
      localStorage.getItem("theme") === "dark" || 
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      const themeStr = next ? "dark" : "light";
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
      localStorage.setItem("sns-theme", themeStr);
      localStorage.setItem("theme", themeStr);
      localStorage.setItem("sns-dark-mode", JSON.stringify(next));
      return next;
    });
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      const saved = getProfilePhotoLocally(session.user.id);
      if (saved) setAvatarUrl(saved);

      import("../../services/api-client").then(({ apiRequest }) => {
        apiRequest<{ notifications?: number }>("/dashboard/counts")
          .then((res) => setUnreadCount(res.notifications || 0))
          .catch(() => {});
      });
    }
  }, [session?.user?.id]);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarWidth");
    if (saved) setSidebarWidth(parseInt(saved));
  }, []);
  
  useEffect(() => {
    if (session?.user?.role === "parent") {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [session?.user?.role]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resizeSidebar = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 450) {
        setSidebarWidth(newWidth);
        localStorage.setItem("sidebarWidth", newWidth.toString());
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resizeSidebar);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [router]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!session) {
      router.replace("/");
      return;
    }
    if (session.user.role === "parent") {
      router.replace("/parent-dashboard");
      return;
    }
    if (!canAccessWebDashboard(session.user.role)) {
      logout();
      router.replace("/");
    }
  }, [isBootstrapping, logout, router, session]);

  const [theme, setTheme] = useState("classic");

  useEffect(() => {
    const savedTheme = localStorage.getItem("sns_theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  if (isBootstrapping || !session || session.user.role === "parent" || session.user.role === "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-[var(--bg-primary)]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-5 text-sm text-[var(--text-secondary)] shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          Restoring your workspace...
        </div>
      </div>
    );
  }

  const isModern = false;

  return (
    <main className={`${isModern ? 'bg-[#FAF9F6]' : 'mesh-bg bg-[#f8fafc]'} flex h-screen relative overflow-hidden`}>
      {/* Sidebar Overlay for Mobile */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 lg:hidden ${
        isSidebarOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}>
         <div 
           className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
           onClick={() => setIsSidebarOpen(false)}
         />
         <div className={`relative h-full w-[280px] bg-white transition-transform duration-500 ${
           isSidebarOpen ? "translate-x-0" : "-translate-x-full"
         }`}>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 z-[70] p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
              aria-label="Close sidebar"
            >
              <X size={18} weight="bold" />
            </button>
            <SidebarNav onOpenSearch={() => { setIsSidebarOpen(false); setIsSearchOpen(true); }} />
         </div>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:block flex-shrink-0 ${isModern ? 'border-none' : 'border-r border-[#F1F5F9]'} relative group transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'}`}
        style={{ width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px` }}
      >
        <SidebarNav onOpenSearch={() => setIsSearchOpen(true)} />
        {/* Resize Handle */}
        {!isSidebarCollapsed && !isModern && (
          <div 
            className={`sidebar-resizer ${isResizing ? 'is-resizing' : ''}`}
            onMouseDown={startResizing}
          />
        )}
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 hide-scrollbar overflow-hidden relative z-10">
        {/* ── Modern Header ── */}
        {isModern && (
          <header className="sticky top-0 h-14 bg-white border-b border-slate-100 px-5 flex items-center justify-between z-40 flex-shrink-0">
            {/* Left: sidebar toggle + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
              >
                <SidebarSimple size={18} weight="duotone" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <List size={18} />
              </button>
              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold">
                <span className="text-slate-400">Workspace</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 capitalize">
                  {pathname === "/admin" ? "Dashboard" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "Dashboard"}
                </span>
              </nav>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5">
              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-all"
                title="Search (Ctrl+K)"
              >
                <MagnifyingGlass size={15} />
                <span className="hidden md:inline text-xs">Search...</span>
                <span className="text-[10px] font-bold px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">⌘K</span>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={17} weight="duotone" className="text-amber-400" /> : <Moon size={17} weight="duotone" />}
              </button>

              {/* Notifications */}
              <button
                onClick={() => router.push("/admin/notifications")}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative"
                title="Notifications"
              >
                <Bell size={17} weight="duotone" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF7F50] ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Chat */}
              <button
                onClick={() => router.push("/admin/chat")}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Messages"
              >
                <ChatCircleDots size={17} weight="duotone" />
              </button>

              <div className="w-px h-5 bg-slate-100 dark:bg-slate-800 mx-1" />

              {/* Export */}
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <DownloadSimple size={14} weight="bold" />
                Export
              </button>

              {/* Quick Add */}
              <button
                onClick={() => router.push("/admin/notice-post")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF7F50] text-white text-[11px] font-bold shadow-sm shadow-[#FF7F50]/30 hover:bg-[#e66a3e] transition-all active:scale-95"
              >
                <Plus size={13} weight="bold" />
                Quick Add
              </button>
            </div>
          </header>
        )}

        {/* ── Classic Header ── */}
        {!isModern && (
          <header className="sticky top-0 h-[64px] bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl border-b border-[#F1F5F9] dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between z-40 flex-shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <List size={24} />
              </button>

              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
              >
                <SidebarSimple size={22} weight={isSidebarCollapsed ? "bold" : "duotone"} className={isSidebarCollapsed ? "text-[#FF7F50]" : ""} />
              </button>

              {/* Global search trigger bar */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-[#FF7F50] text-xs font-semibold transition-all shadow-sm max-w-sm w-full"
              >
                <MagnifyingGlass size={16} className="text-slate-400" />
                <span className="truncate">Search students, staff, timetable...</span>
                <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400">Ctrl K</span>
              </button>
            </div>
            
            <div className="flex items-center gap-7">
              <div className="hidden sm:flex items-center gap-4">
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="Toggle Theme"
                  >
                    {isDarkMode ? <Sun size={24} weight="bold" className="text-amber-400" /> : <Moon size={24} weight="bold" />}
                  </button>
                  
                  <NotificationCenter />

                  <button 
                    onClick={() => router.push('/admin/chat')}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" 
                    title="Messages"
                  >
                    <ChatCircleDots size={24} />
                  </button>
              </div>

              <div className="flex items-center gap-3.5 pl-0 sm:pl-7 sm:border-l border-[#F1F5F9] dark:border-slate-800">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{session.user.name}</p>
                    <p className="text-[11px] font-bold text-[#FF7F50] mt-1.5 uppercase tracking-wider">{session.user.role}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden shrink-0">
                    <img
                      src={avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.name}`}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    className="hidden sm:inline-flex ml-4 rounded-xl border border-[#F1F5F9] dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    onClick={logout}
                  >
                    Logout
                  </button>
              </div>
            </div>
          </header>
        )}

        <section className={`flex-1 relative z-10 overflow-hidden ${pathname === '/admin/chat' ? 'p-0' : isModern ? 'p-0 overflow-y-auto hide-scrollbar' : 'p-4 sm:p-6 lg:p-10 overflow-y-auto hide-scrollbar'}`}>
          {children}
        </section>

        {/* Mobile FAB for Quick Add */}
        {!isModern && (
          <button
            onClick={() => router.push("/admin/notice-post")}
            className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#FF7F50] text-white rounded-full shadow-2xl shadow-[#FF7F50]/40 flex items-center justify-center z-40 active:scale-95 transition-transform"
          >
            <Plus size={24} weight="bold" />
          </button>
        )}

        <DashboardBottomNav />

        {/* Global Search Command Palette */}
        <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </main>
  );
}
