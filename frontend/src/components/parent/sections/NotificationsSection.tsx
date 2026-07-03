"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Megaphone, Trash, CheckCircle, ClockCounterClockwise, SpinnerGap } from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";
import { notificationService, AppNotification } from "../../../services/notification-service";
import { useAuth } from "../../../hooks/use-auth";

function timeAgo(value: string) {
  const date = new Date(value);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_COLOR: Record<string, string> = {
  message: "#4f46e5",
  alert: "#EF4444",
  info: "#FF7F50",
};

export default function NotificationsSection({ theme }: { theme: DashboardTheme }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load both on mount and mark personal notifications as read
  useEffect(() => {
    if (!session?.accessToken) return;
    const token = session.accessToken;

    setLoading(true);
    notificationService.getNotifications(token)
      .then((notifs) => {
        setNotifications(notifs);
        // Auto-mark all personal notifications as read on open
        if (notifs.some((n) => !n.isRead)) {
          notificationService.markAllAsRead(token).catch(() => {});
          setNotifications(notifs.map((n) => ({ ...n, isRead: true })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) return;
    setDeletingId(id);
    try {
      await notificationService.deleteNotification(session.accessToken, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const unreadPersonal = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 4 }}>Notifications</h3>
        <p style={{ fontSize: 14, color: theme.textMuted }}>Your alerts and school announcements.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <SpinnerGap size={36} className="animate-spin" color="#FF7F50" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Personal Notifications */}
          <div>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 16 }}>Personal Alerts</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.length === 0 ? (
                <div className="premium-card" style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <CheckCircle size={48} weight="duotone" color={theme.textMuted} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>All caught up!</p>
                  <p style={{ fontSize: 13, color: theme.textMuted }}>No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="premium-card"
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      borderLeft: `3px solid ${TYPE_COLOR[n.type] ?? "#FF7F50"}`,
                      opacity: n.isRead ? 0.75 : 1,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: `${TYPE_COLOR[n.type] ?? "#FF7F50"}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bell size={20} weight="duotone" color={TYPE_COLOR[n.type] ?? "#FF7F50"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>{n.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: theme.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                            <ClockCounterClockwise size={12} /> {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 4, lineHeight: 1.5 }}>{n.message}</p>
                      {n.attachmentUrl && (
                        <div style={{ marginTop: 10 }}>
                          <a
                            href={n.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              color: "#FF7F50",
                              background: "rgba(255,127,80,0.06)",
                              padding: "6px 12px",
                              borderRadius: 8,
                              textDecoration: "none",
                              border: "1px solid rgba(255,127,80,0.15)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            📎 {n.attachmentName || "View Attachment"}
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
