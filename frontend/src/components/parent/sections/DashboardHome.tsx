"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  ChartBar,
  ArrowRight,
  PaperPlaneTilt,
  Bell,
  Info,
  Clock,
} from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";
import { AcademicTab, MenuKey } from "../../../types/dashboard";
import { notificationService } from "../../../services/notification-service";
import { useAuth } from "../../../hooks/use-auth";
import { getParentDashboardOverview, ParentDashboardOverview } from "../../../services/dashboard-service";
import { apiRequest } from "../../../services/api-client";

interface Props {
  theme: DashboardTheme;
  onNavigate: (tab: AcademicTab) => void;
  onNavigateMenu?: (menu: MenuKey) => void;
}

export default function DashboardHome({ theme, onNavigate, onNavigateMenu }: Props) {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [parentStats, setParentStats] = useState<ParentDashboardOverview | null>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [gridCols, setGridCols] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sns_dashboard_cols");
      return saved ? parseInt(saved) : 3; // Default to 3 (Grid)
    }
    return 3;
  });

  const saveCols = (cols: number) => {
    setGridCols(cols);
    localStorage.setItem("sns_dashboard_cols", cols.toString());
  };

  useEffect(() => {
    if (!session?.accessToken) return;
    notificationService
      .getNotifications(session.accessToken)
      .then((list) => {
        setUnreadCount(list.filter((n) => !n.isRead).length);
        setNotificationsList(list);
      })
      .catch(() => setUnreadCount(0));

    // Also fetch parent stats (attendance/exam)
    if (session.user?.studentProfile?.id) {
      getParentDashboardOverview(session.user.studentProfile.id)
        .then(setParentStats)
        .catch(() => {});
    }

    // Announcements fetch removed in favor of notifications

    // Fetch Today's Timetable
    if (session.user?.studentProfile?.class && session.user?.studentProfile?.section && session.user.studentProfile.class !== "N/A" && session.user.studentProfile.section !== "N/A") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = days[new Date().getDay()];
      apiRequest<any[]>(`/timetable/student?class=${session.user.studentProfile.class}&section=${session.user.studentProfile.section}`)
        .then(list => {
          setTodaySchedule(list.filter(e => e.day === today).sort((a,b) => a.period - b.period));
        })
        .catch(() => {});
    }
  }, [session]);

  const latestAnnouncement = notificationsList[0];
  const nextHoliday = notificationsList.find(a => a.title?.toLowerCase().includes('holiday'));

  const quickCards = [
    {
      label: "Attendance",
      value: parentStats?.attendance.value || "…",
      sub: parentStats?.attendance.sub || "Calculating…",
      icon: Users,
      color: "#FF7F50",
      onClick: () => onNavigate("attendance" as AcademicTab),
    },
    {
      label: "Exam Reports",
      value: parentStats?.exam.value || "…",
      sub: parentStats?.exam.sub || "No results yet",
      icon: ChartBar,
      color: "#4f46e5",
      onClick: () => onNavigate("exam" as AcademicTab),
    },
    {
      label: "Leave Application",
      value: "Apply Now",
      sub: "Quick Request",
      icon: PaperPlaneTilt,
      color: "#10b981",
      onClick: () => onNavigate("leave" as AcademicTab),
    },
    {
      label: "Notifications",
      value: unreadCount !== null ? unreadCount.toString() : "…",
      sub: unreadCount === 1 ? "1 unread message" : `${unreadCount ?? "…"} unread`,
      icon: Bell,
      color: "#e11d48",
      onClick: () => onNavigateMenu?.("notifications"),
    },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">

      {/* ── Quick Action Cards Header ── */}
      <div className="flex justify-between items-center">
        <h3 style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Actions</h3>
        <div className="h-8"></div>
      </div>

      {/* ── Quick Action Cards ── */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {quickCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
              }}
              onClick={card.onClick}
              className="premium-card p-5 relative overflow-hidden cursor-pointer"
            >
              {/* Background circle */}
              <div
                style={{
                  position: "absolute",
                  top: -24,
                  right: -24,
                  width: 100,
                  height: 100,
                  background: `${card.color}10`,
                  borderRadius: "50%",
                }}
              />
              {/* Top accent bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: card.color,
                  borderRadius: "14px 14px 0 0",
                }}
              />

              <div className="flex justify-between items-start mb-5">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${card.color}18`,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 6px 16px ${card.color}18`,
                  }}
                >
                  <Icon size={24} weight="bold" />
                </div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: theme.isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.textMuted,
                  }}
                >
                  <ArrowRight size={14} weight="bold" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>
                  {card.label}
                </p>
                <h3 className="text-2xl font-black tracking-tight mb-1" style={{ color: theme.text }}>
                  {card.value}
                </h3>
                <p className="text-[11px] font-bold" style={{ color: card.color }}>{card.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Schedule + Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 sm:gap-6">

        {/* Today's Schedule */}
        <div className="premium-card p-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2.5">
              <CalendarCheck size={20} weight="bold" color={theme.primary} />
              <h4 className="text-lg font-black" style={{ color: theme.primary }}>
                Today&apos;s Schedule
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ color: theme.textMuted, background: theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9" }}>
              April 20, 2026
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {todaySchedule.length > 0 ? todaySchedule.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl flex items-center justify-between transition-all"
                style={{
                  background: i === 0 ? `${theme.primary}0a` : "transparent",
                  border: `1px solid ${i === 0 ? `${theme.primary}30` : theme.border}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: i === 0 ? theme.primary : (theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"),
                      color: i === 0 ? "#fff" : theme.textMuted,
                    }}
                  >
                    <Clock size={16} weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: theme.text }}>{item.subject}</p>
                    <p className="text-[11px] font-bold" style={{ color: theme.textMuted }}>{item.startTime} - {item.endTime}</p>
                  </div>
                </div>
                {i === 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: theme.primary, background: `${theme.primary}12` }}>
                    Now
                  </span>
                )}
              </div>
            )) : (
              <div className="py-10 text-center" style={{ color: theme.textMuted }}>
                <p className="text-sm font-bold opacity-50">No classes scheduled today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcement + Holiday */}
        <div className="premium-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}15`, color: theme.primary }}>
              <Info size={18} weight="bold" />
            </span>
            <h4 className="text-lg font-black" style={{ color: theme.primary }}>School Note</h4>
          </div>

          <div className="p-5 rounded-2xl mb-5" style={{ background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", border: `1px solid ${theme.border}` }}>
            <p className="text-[13px] leading-relaxed font-bold mb-4" style={{ color: theme.text }}>
              {latestAnnouncement ? (
                <>
                  <span className="block font-black mb-1">{latestAnnouncement.title}</span>
                  {latestAnnouncement.message}
                </>
              ) : "No recent announcements."}
            </p>
            <div className="flex items-center gap-2 cursor-pointer" style={{ color: theme.primary }} onClick={() => onNavigateMenu?.("notifications")}>
              <span className="text-[11px] font-black uppercase tracking-wider">Read Full Notice</span>
              <ArrowRight size={12} weight="bold" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: theme.textMuted }}>
              Upcoming Holiday
            </p>
            <div className="flex justify-between items-center p-4 rounded-xl" style={{ background: theme.isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9" }}>
              <span className="text-sm font-bold" style={{ color: theme.text }}>{nextHoliday ? nextHoliday.title : "No holidays scheduled"}</span>
              <span className="text-[11px] font-black" style={{ color: theme.primary }}>{nextHoliday ? new Date(nextHoliday.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
