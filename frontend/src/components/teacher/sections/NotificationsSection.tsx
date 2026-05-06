"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Info, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Welcome to SNS ERP",
    message: "Administrative updates and portal notifications will appear here in real-time.",
    time: "Just now",
    type: "info",
    icon: Bell,
    color: "#3B82F6",
  },
];

export default function NotificationsSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-4">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[32px] bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group relative overflow-hidden"
          >
            <div className="flex gap-6 items-start">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${notif.color}15`, color: notif.color }}
              >
                <notif.icon size={24} strokeWidth={2.5} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{notif.title}</h3>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    {notif.time}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed max-w-2xl">
                  {notif.message}
                </p>
              </div>

              {notif.type === 'urgent' && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
