"use client";

import { motion } from "framer-motion";
import { Bell } from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";

const notifications: { msg: string; time: string; type: string }[] = [];

export default function NotificationsSection({ theme }: { theme: DashboardTheme }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {notifications.length === 0 ? (
        <div 
          className="premium-card"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}
        >
          <Bell size={64} weight="thin" style={{ color: theme.textMuted, marginBottom: 20 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>No Notifications</h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, marginTop: 8 }}>You're all caught up! New alerts will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {notifications.map((n, i) => (
            <motion.div
              key={`notif-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card"
              style={{ padding: "24px", display: "flex", alignItems: "flex-start", gap: 20 }}
            >
              <div style={{ 
                width: 52, height: 52, borderRadius: 16, 
                background: n.type === "alert" ? "rgba(239,68,68,0.1)" : "rgba(255,127,80,0.08)", 
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Bell size={28} color={n.type === "alert" ? "#ef4444" : "#FF7F50"} weight="duotone" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>{n.msg}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, whiteSpace: "nowrap" }}>{n.time}</span>
                </div>
                <span style={{ 
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  color: n.type === "alert" ? "#ef4444" : "#FF7F50",
                  background: n.type === "alert" ? "rgba(239,68,68,0.05)" : "rgba(255,127,80,0.05)",
                  padding: "4px 10px", borderRadius: 6
                }}>{n.type}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
