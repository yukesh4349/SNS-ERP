"use client";

import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirectPage() {
  const { session, isBootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    const role = session.user.role;
    if (role === "parent") {
      router.replace("/parent-dashboard");
    } else if (role === "teacher") {
      router.replace("/teacher-dashboard");
    } else if (role === "admin" || role === "superadmin" || role === "leader") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [session, isBootstrapping, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-slate-500 font-semibold text-sm">Loading workspace...</div>
    </div>
  );
}
