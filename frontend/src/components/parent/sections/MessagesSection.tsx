"use client";

import { motion } from "framer-motion";
import { Bell, ClockCounterClockwise, Users, UserCircle } from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";

interface Props {
  theme: DashboardTheme;
}

const messages: { id: number; title: string; content: string; date: string; type: string; audience: string }[] = [];

export default function MessagesSection({ theme }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div 
            style={{ 
              display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", 
              borderRadius: 14, background: `${theme.accent}15`, 
              border: `1px solid ${theme.accent}30`,
              boxShadow: `0 4px 12px ${theme.accent}10`
            }}
          >
            <Bell size={26} style={{ color: theme.accent }} weight="duotone" />
          </div>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: theme.text, letterSpacing: "-0.03em" }}>
              Messages
            </h2>
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>
              View all official announcements and notifications
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="premium-card"
            style={{ 
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {/* Message Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div 
                  style={{ 
                    padding: "12px", borderRadius: 14,
                    background: msg.type === "general" ? `${theme.accent}10` : "#4F46E510",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {msg.type === "general" ? (
                    <Users size={24} style={{ color: theme.accent }} weight="duotone" />
                  ) : (
                    <UserCircle size={24} style={{ color: "#4F46E5" }} weight="duotone" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 4 }}>
                    {msg.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span 
                      style={{ 
                        fontSize: 10, fontWeight: 900, textTransform: "uppercase", 
                        padding: "4px 12px", borderRadius: 8,
                        background: `${theme.accent}10`, color: theme.accent,
                        letterSpacing: "0.05em"
                      }}
                    >
                      {msg.type}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted }}>
                      • {msg.audience}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: theme.textMuted }}>
                <ClockCounterClockwise size={16} />
                <span>{msg.date}</span>
              </div>
            </div>

            {/* Message Content */}
            <div 
              style={{ 
                padding: "20px 24px", borderRadius: 18, 
                fontSize: 15, lineHeight: "1.7",
                background: theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                color: theme.text,
                border: `1px solid ${theme.border}`
              }}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State (if no messages) */}
      {messages.length === 0 && (
        <div 
          className="premium-card"
          style={{ 
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "80px 40px", textAlign: "center"
          }}
        >
          <Bell size={64} style={{ color: theme.textMuted, margin: "0 auto 20px" }} weight="duotone" />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>
            No Messages Yet
          </h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, marginTop: 8 }}>
            You'll see all school announcements here.
          </p>
        </div>
      )}
    </div>
  );
}
