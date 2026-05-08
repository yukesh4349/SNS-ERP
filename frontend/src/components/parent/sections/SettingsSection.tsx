"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gear, PencilSimple, Moon, Sun, Lock, Globe, CheckCircle, XCircle, SpinnerGap, GraduationCap, ClockCounterClockwise } from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";
import { apiRequest } from "../../../services/api-client";
import { useAuth } from "../../../hooks/use-auth";

type ToastType = { message: string; type: "success" | "error" } | null;

interface ProfileRequest {
  id: string;
  changes: Record<string, string>;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function SettingsSection({ theme, isDarkMode, setIsDarkMode }: { theme: DashboardTheme; isDarkMode: boolean; setIsDarkMode: (v: boolean) => void }) {
  const { session } = useAuth();
  const [language, setLanguage] = useState("English");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastType>(null);
  const [requestHistory, setRequestHistory] = useState<ProfileRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [linkData, setLinkData] = useState({ studentId: "", password: "" });
  const [linking, setLinking] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<{ id: string; name: string; studentId: string; class?: string; section?: string }[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("sns-linked-students") || "[]"); } catch { return []; }
  });

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    city: "",
    fatherMobile: "",
    motherMobile: "",
    guardianMobile: "",
    address: ""
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // Pre-fill profile from session
  useEffect(() => {
    if (!session?.user) return;
    const sp = session.user.studentProfile;
    setProfileData({
      fullName: session.user.name || "",
      email: session.user.email || "",
      mobile: sp?.fatherContact || "",
      city: "",
      fatherMobile: sp?.fatherContact || "",
      motherMobile: sp?.motherContact || "",
      guardianMobile: "",
      address: sp?.fatherOfficeAddress || ""
    });
  }, [session]);

  // Load request history
  useEffect(() => {
    if (!session?.accessToken) return;
    setHistoryLoading(true);
    apiRequest<ProfileRequest[]>("/auth/profile-requests/mine", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(setRequestHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [session?.accessToken]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendApproval = async () => {
    if (!session?.accessToken) {
      showToast("You are not logged in.", "error");
      return;
    }
    const changes: Record<string, string> = {};
    if (profileData.fullName && profileData.fullName !== session.user.name) changes.name = profileData.fullName;
    if (profileData.email && profileData.email !== session.user.email) changes.email = profileData.email;
    if (profileData.mobile) changes.mobile = profileData.mobile;
    if (profileData.city) changes.city = profileData.city;
    if (profileData.fatherMobile) changes.fatherMobile = profileData.fatherMobile;
    if (profileData.motherMobile) changes.motherMobile = profileData.motherMobile;
    if (profileData.address) changes.address = profileData.address;

    if (Object.keys(changes).length === 0) {
      showToast("No changes detected.", "error");
      return;
    }

    setSaving(true);
    try {
      await apiRequest<{ message: string }>("/auth/profile-request", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify(changes),
      });
      showToast("Approval request sent to admin!", "success");
      // Refresh history
      const updated = await apiRequest<ProfileRequest[]>("/auth/profile-requests/mine", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setRequestHistory(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send request.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current) { showToast("Please enter your current password.", "error"); return; }
    if (!passwordData.new) { showToast("Please enter a new password.", "error"); return; }
    if (passwordData.new.length < 6) { showToast("New password must be at least 6 characters.", "error"); return; }
    if (passwordData.new !== passwordData.confirm) { showToast("New passwords do not match!", "error"); return; }
    if (!session?.accessToken) { showToast("You are not logged in.", "error"); return; }

    setSaving(true);
    try {
      await apiRequest<{ message: string }>("/auth/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.new }),
      });
      showToast("Password changed successfully!", "success");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkStudent = async () => {
    if (!linkData.studentId.trim()) { showToast("Please enter the Student ID.", "error"); return; }
    if (!linkData.password) { showToast("Please enter the student password.", "error"); return; }
    if (!session?.accessToken) { showToast("You are not logged in.", "error"); return; }
    if (linkedStudents.some((s) => s.studentId === linkData.studentId.trim())) {
      showToast("This student is already linked.", "error"); return;
    }

    setLinking(true);
    try {
      const result = await apiRequest<{ id: string; name: string; studentProfile: { studentId: string; class?: string; section?: string } | null }>(
        "/auth/verify-student",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify({ studentId: linkData.studentId.trim(), password: linkData.password }),
        }
      );
      const updated = [
        ...linkedStudents,
        {
          id: result.id,
          name: result.name,
          studentId: result.studentProfile?.studentId || linkData.studentId.trim(),
          class: result.studentProfile?.class,
          section: result.studentProfile?.section,
        },
      ];
      setLinkedStudents(updated);
      localStorage.setItem("sns-linked-students", JSON.stringify(updated));
      setLinkData({ studentId: "", password: "" });
      showToast(`${result.name} linked successfully!`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      showToast(message, "error");
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveLinked = (id: string) => {
    const updated = linkedStudents.filter((s) => s.id !== id);
    setLinkedStudents(updated);
    localStorage.setItem("sns-linked-students", JSON.stringify(updated));
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 0", borderBottom: `1px solid ${theme.border}`,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6,
    textTransform: "uppercase" as const, letterSpacing: "0.04em",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${theme.border}`, fontSize: 14, outline: "none",
    fontFamily: "var(--font-inter,'Inter',sans-serif)", color: theme.text,
    background: theme.isDark ? "rgba(255,255,255,0.03)" : "#fafafa", transition: "all 0.3s",
  };

  const statusColor = (s: string) =>
    s === "approved" ? "#10B981" : s === "rejected" ? "#EF4444" : "#F59E0B";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 12, background: toast.type === "success" ? "#10B981" : "#EF4444", color: "white", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        >
          {toast.type === "success" ? <CheckCircle size={20} weight="fill" /> : <XCircle size={20} weight="fill" />}
          {toast.message}
        </motion.div>
      )}

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Gear size={26} weight="duotone" color="#FF7F50" />
          <h1 style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontSize: 24, fontWeight: 700, color: theme.text }}>Settings</h1>
        </div>
        <p style={{ color: theme.textMuted, fontSize: 14 }}>Manage your account preferences</p>
      </div>

      {/* Edit Profile */}
      <div className="premium-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <PencilSimple size={18} color="#FF7F50" weight="duotone" />
          <p style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontWeight: 700, fontSize: 15, color: theme.text }}>Edit Profile</p>
        </div>
        <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
          Changes will be submitted to admin for approval before taking effect.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { label: "Full Name", key: "fullName", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Mobile", key: "mobile", type: "tel" },
            { label: "City", key: "city", type: "text" },
            { label: "Father's Mobile", key: "fatherMobile", type: "tel" },
            { label: "Mother's Mobile", key: "motherMobile", type: "tel" },
            { label: "Guardian Mobile (Optional)", key: "guardianMobile", type: "tel" },
          ].map((f, i) => (
            <div key={i}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type={f.type}
                value={profileData[f.key as keyof typeof profileData]}
                onChange={(e) => setProfileData({ ...profileData, [f.key]: e.target.value })}
                style={inputStyle}
              />
            </div>
          ))}
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Current Address</label>
            <textarea
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              placeholder="Enter your full address..."
              rows={3}
              style={{ ...inputStyle, resize: "none" } as React.CSSProperties}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
          <button
            onClick={handleSendApproval}
            disabled={saving}
            style={{ padding: "14px 40px", borderRadius: 14, background: "linear-gradient(90deg,#FF7F50,#e66a3e)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1, transition: "background 0.3s", boxShadow: "0 6px 20px rgba(255,127,80,0.3)", fontFamily: "var(--font-poppins,'Poppins',sans-serif)", display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving && <SpinnerGap size={16} className="animate-spin" />}
            {saving ? "Sending..." : "Send Approval to Admin"}
          </button>
        </div>
      </div>

      {/* Request History */}
      {(requestHistory.length > 0 || historyLoading) && (
        <div className="premium-card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <ClockCounterClockwise size={18} color="#FF7F50" weight="duotone" />
            <p style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontWeight: 700, fontSize: 15, color: theme.text }}>Approval Request History</p>
          </div>
          {historyLoading ? (
            <p style={{ color: theme.textMuted, fontSize: 13 }}>Loading...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {requestHistory.map((r) => (
                <div key={r.id} style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: statusColor(r.status), textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.status}</span>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.text }}>
                    {Object.entries(r.changes).map(([k, v]) => (
                      <span key={k} style={{ marginRight: 12 }}><b>{k}:</b> {v}</span>
                    ))}
                  </div>
                  {r.adminNote && (
                    <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, fontStyle: "italic" }}>Admin note: {r.adminNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences */}
      <div className="premium-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sun size={18} color="#FF7F50" weight="duotone" />
          <p style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontWeight: 700, fontSize: 15, color: theme.text }}>Preferences</p>
        </div>
        <div style={rowStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isDarkMode ? <Moon size={18} color="#6C63FF" /> : <Sun size={18} color="#F59E0B" />}
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Dark Mode</p>
              <p style={{ fontSize: 12, color: theme.textMuted }}>Switch between light and dark theme</p>
            </div>
          </div>
          <Toggle on={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Globe size={18} color="#10B981" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Language</p>
              <p style={{ fontSize: 12, color: theme.textMuted }}>Choose your preferred language</p>
            </div>
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, color: theme.text, background: theme.cardBg, outline: "none", cursor: "pointer", fontFamily: "var(--font-inter,'Inter',sans-serif)" }}>
            {["English", "Tamil", "Hindi"].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Change Password */}
      <div className="premium-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="#FF7F50" weight="duotone" />
            <p style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontWeight: 700, fontSize: 15, color: theme.text }}>Change Password</p>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving || !passwordData.current || !passwordData.new}
            style={{ padding: "8px 20px", borderRadius: 10, background: (!passwordData.current || !passwordData.new) ? (theme.isDark ? "#333" : "#ddd") : "linear-gradient(90deg,#FF7F50,#e66a3e)", color: (!passwordData.current || !passwordData.new) ? theme.textMuted : "white", border: "none", cursor: (!passwordData.current || !passwordData.new || saving) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1, transition: "all 0.3s", fontFamily: "var(--font-poppins,'Poppins',sans-serif)", boxShadow: (!passwordData.current || !passwordData.new) ? "none" : "0 2px 10px rgba(255,127,80,0.25)", display: "flex", alignItems: "center", gap: 6 }}
          >
            {saving && <SpinnerGap size={14} className="animate-spin" />}
            {saving ? "Changing..." : "Change Password"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { label: "Current Password", key: "current" },
            { label: "New Password", key: "new" },
            { label: "Confirm New Password", key: "confirm" }
          ].map((f, i) => (
            <div key={i}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type="password"
                value={passwordData[f.key as keyof typeof passwordData]}
                onChange={(e) => setPasswordData({ ...passwordData, [f.key]: e.target.value })}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Add Another Student */}
      <div className="premium-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <GraduationCap size={18} color="#FF7F50" weight="duotone" />
          <p style={{ fontFamily: "var(--font-poppins,'Poppins',sans-serif)", fontWeight: 700, fontSize: 15, color: theme.text }}>Add Another Student</p>
        </div>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 20 }}>Link another student profile to switch between them easily.</p>

        {/* Already linked students */}
        {linkedStudents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {linkedStudents.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#FF7F50,#e66a3e)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: theme.textMuted }}>{s.studentId}{s.class ? ` · Class ${s.class}${s.section ? `-${s.section}` : ""}` : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveLinked(s.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Student ID</label>
            <input
              type="text"
              placeholder="SNS-2026-XXXX"
              value={linkData.studentId}
              onChange={(e) => setLinkData({ ...linkData, studentId: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={linkData.password}
              onChange={(e) => setLinkData({ ...linkData, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleLinkStudent()}
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleLinkStudent}
            disabled={linking || !linkData.studentId || !linkData.password}
            style={{
              padding: "12px 24px", borderRadius: 10,
              background: (!linkData.studentId || !linkData.password) ? (theme.isDark ? "#333" : "#e2e8f0") : "linear-gradient(90deg,#FF7F50,#e66a3e)",
              color: (!linkData.studentId || !linkData.password) ? theme.textMuted : "white",
              border: "none", cursor: (!linkData.studentId || !linkData.password || linking) ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 14, opacity: linking ? 0.7 : 1,
              fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
              boxShadow: (!linkData.studentId || !linkData.password) ? "none" : "0 4px 15px rgba(255,127,80,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
            }}
          >
            {linking && <SpinnerGap size={16} className="animate-spin" />}
            {linking ? "Verifying..." : "Link Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    style={{ width: 46, height: 26, borderRadius: 13, padding: 3, border: "none", background: on ? "#FF7F50" : "#ddd", cursor: "pointer", transition: "background 0.3s", display: "flex", alignItems: "center" }}>
    <motion.div animate={{ x: on ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
  </button>
);
