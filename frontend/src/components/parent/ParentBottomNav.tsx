"use client";

import React from "react";
import { 
  House, 
  Bell, 
  BookOpen, 
  GraduationCap, 
  User 
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { MenuKey } from "../../types/dashboard";

interface Props {
  activeMenu: MenuKey;
  setActiveMenu: (m: MenuKey) => void;
  theme: any;
}

export default function ParentBottomNav({ activeMenu, setActiveMenu, theme }: Props) {
  const navItems = [
    { key: "dashboard", label: "Home", icon: House },
    { key: "notifications", label: "Alerts", icon: Bell },
    { key: "diary", label: "Diary", icon: BookOpen },
    { key: "academic", label: "Academics", icon: GraduationCap },
    { key: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div 
        style={{ 
          background: theme.cardBg, 
          borderColor: theme.border,
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)"
        }}
        className="backdrop-blur-xl border rounded-[24px] h-16 flex items-center justify-around px-2 relative overflow-hidden pointer-events-auto max-w-lg mx-auto"
      >
        {navItems.map((item) => {
          const isActive = activeMenu === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setActiveMenu(item.key as MenuKey)}
              className="flex flex-col items-center justify-center gap-1 w-14 h-14 relative"
            >
              {isActive && (
                <motion.div 
                  layoutId="parent-nav-active"
                  style={{ background: `${theme.accent}15` }}
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                size={20} 
                weight={isActive ? "bold" : "bold"}
                style={{ color: isActive ? theme.accent : theme.textMuted }}
                className={`transition-all duration-300 ${isActive ? "scale-110" : ""}`} 
              />
              <span 
                style={{ color: isActive ? theme.accent : theme.textMuted }}
                className="text-[9px] font-bold uppercase tracking-tight"
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
