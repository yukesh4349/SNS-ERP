"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ClockCounterClockwise, Megaphone } from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";
import { Announcement, getAnnouncements } from "../../../services/announcements-service";

function formatAnnouncementDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotificationsSection({ theme }: { theme: DashboardTheme }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        setIsLoading(true);
        const data = await getAnnouncements(0, 30);
        if (!isMounted) return;
        setAnnouncements(data.filter((item) => item.target === "all" || item.target === "parents"));
        setError("");
      } catch (err) {
        console.error("Failed to load announcements", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load announcements.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 4 }}>
          Announcements
        </h3>
        <p style={{ fontSize: 14, color: theme.textMuted }}>
          Official updates posted from the admin panel.
        </p>
      </div>

      {isLoading && (
        <div className="premium-card" style={{ padding: 32, color: theme.textMuted, fontWeight: 700 }}>
          Loading announcements...
        </div>
      )}

      {error && (
        <div className="premium-card" style={{ padding: 32, color: theme.danger, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {!isLoading && !error && announcements.length === 0 && (
        <div
          className="premium-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 32px",
            textAlign: "center",
          }}
        >
          <Bell size={56} style={{ color: theme.textMuted, marginBottom: 18 }} weight="duotone" />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>No Announcements Yet</h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, marginTop: 8 }}>
            New admin posts will appear here.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="premium-card"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(255,127,80,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Megaphone size={28} color="#FF7F50" weight="duotone" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: theme.text, lineHeight: 1.4 }}>
                    {announcement.title}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginTop: 4 }}>
                    Posted by {announcement.author?.name ?? "Admin"}
                  </p>
                </div>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: theme.textMuted,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ClockCounterClockwise size={16} />
                  {formatAnnouncementDate(announcement.createdAt)}
                </span>
              </div>

              <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: theme.text }}>
                {announcement.content}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#FF7F50",
                    background: "rgba(255,127,80,0.05)",
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {announcement.target}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
