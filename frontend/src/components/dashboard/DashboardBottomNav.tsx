"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Layout, 
  Bell, 
  UserList, 
  ChatCircleDots, 
  UserCircle 
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function DashboardBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Layout, href: "/dashboard" },
    { label: "Alerts", icon: Bell, href: "/dashboard/notifications" },
    { label: "Attendance", icon: UserList, href: "/dashboard/attendance" },
    { label: "Chat", icon: ChatCircleDots, href: "/dashboard/chat" },
    { label: "Profile", icon: UserCircle, href: "/dashboard/profile" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[24px] h-16 shadow-2xl flex items-center justify-around px-2 relative overflow-hidden pointer-events-auto max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center gap-1 w-14 h-14 relative"
            >
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 bg-[#FF7F50]/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon 
                size={20} 
                weight={isActive ? "fill" : "duotone"}
                className={`transition-all duration-300 ${
                  isActive ? "text-[#FF7F50] scale-110" : "text-slate-400"
                }`} 
              />
              <span className={`text-[9px] font-bold uppercase tracking-tight transition-colors ${
                isActive ? "text-[#FF7F50]" : "text-slate-400"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
