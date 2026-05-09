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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    notificationService
      .getNotifications(session.accessToken)
      .then((list) => setUnreadCount(list.filter((n) => !n.isRead).length))
      .catch(() => setUnreadCount(0));

    // Also fetch parent stats (attendance/exam)
    if (session.user?.studentProfile?.id) {
      getParentDashboardOverview(session.user.studentProfile.id)
        .then(setParentStats)
        .catch(() => {});
    }

    // Fetch announcements
    apiRequest<any[]>('/announcements')
      .then(setAnnouncements)
      .catch(() => {});

    // Fetch Today's Timetable
    if (session.user?.studentProfile?.class && session.user?.studentProfile?.section) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = days[new Date().getDay()];
      apiRequest<any[]>(`/timetable/student?class=${session.user.studentProfile.class}&section=${session.user.studentProfile.section}`)
        .then(list => {
          setTodaySchedule(list.filter(e => e.day === today).sort((a,b) => a.period - b.period));
        })
        .catch(() => {});
    }
  }, [session]);

  const latestAnnouncement = announcements[0];
  const nextHoliday = announcements.find(a => a.title.toLowerCase().includes('holiday'));

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
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* ── Quick Action Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 20,
        }}
      >
        {quickCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -5, boxShadow: "0 24px 48px rgba(0,0,0,0.10)" }}
              onClick={card.onClick}
              className="premium-card"
              style={{
                padding: "24px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: `${card.color}18`,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 6px 16px ${card.color}18`,
                  }}
                >
                  <Icon size={28} weight="bold" />
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: theme.isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.textMuted,
                  }}
                >
                  <ArrowRight size={16} weight="bold" />
                </div>
              </div>

              <div>
                <p
                  style={{
                    color: theme.textMuted,
                    fontWeight: 700,
                    fontSize: 11,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {card.label}
                </p>
                <h3
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: theme.text,
                    letterSpacing: "-0.02em",
                    marginBottom: 2,
                  }}
                >
                  {card.value}
                </h3>
                <p style={{ fontSize: 11, color: card.color, fontWeight: 700 }}>{card.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Schedule + Info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 28 }}>

        {/* Today's Schedule */}
        <div className="premium-card" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarCheck size={20} weight="bold" color={theme.primary} />
              <h4 style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>
                Today&apos;s Schedule
              </h4>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: theme.textMuted,
                background: theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              April 20, 2026
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {todaySchedule.length > 0 ? todaySchedule.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 20px",
                  borderRadius: 18,
                  background:
                    i === 0 ? `${theme.primary}0a` : "transparent",
                  border: `1px solid ${
                    i === 0
                      ? `${theme.primary}30`
                      : theme.border
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background:
                        i === 0
                          ? theme.primary
                          : theme.isDark
                          ? "rgba(255,255,255,0.05)"
                          : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: i === 0 ? "#fff" : theme.textMuted,
                    }}
                  >
                    <Clock size={18} weight="bold" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{item.subject}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }}>{item.startTime} - {item.endTime}</p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color:
                      i === 0 ? theme.primary : theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background:
                      i === 0
                        ? `${theme.primary}12`
                        : "transparent",
                    padding:
                      i === 0 ? "4px 10px" : "0",
                    borderRadius: 6,
                  }}
                >
                  {i === 0 ? "Current" : "Upcoming"}
                </span>
              </div>
            )) : (
              <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcement + Holiday */}
        <div className="premium-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(79, 70, 229, 0.1)",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={20} weight="bold" />
            </span>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>Important Note</h4>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: 18,
              background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
              border: `1px solid ${theme.border}`,
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 14, lineHeight: "1.65", color: theme.text, fontWeight: 600, marginBottom: 14 }}>
              {latestAnnouncement ? latestAnnouncement.content : "No new announcements at this time. Stay tuned for school updates."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.primary, cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>Read More</span>
              <ArrowRight size={14} weight="bold" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Upcoming Holiday
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: 14,
                background: theme.isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{nextHoliday ? nextHoliday.title : "No upcoming holidays"}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>{nextHoliday ? new Date(nextHoliday.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
