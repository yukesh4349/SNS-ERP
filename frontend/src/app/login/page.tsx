"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChalkboardTeacher,
  Users,
  Eye,
  EyeSlash,
  Warning,
  ArrowRight,
  Shield,
  Sparkle,
} from "@phosphor-icons/react";
import { useAuth } from "../../hooks/use-auth";
import { getDashboardRoute } from "../../lib/role-access";

export default function LoginPage() {
  const [role, setRole] = useState<null | "admin" | "teacher" | "parent">(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const session = await login({ email: emailOrMobile, password });
      router.push(getDashboardRoute(session.user.role));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please verify your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 overflow-x-hidden">
      {/* ── Left Panel: Form ── */}
      <div className="mesh-bg w-full lg:max-w-[560px] flex flex-col justify-center items-center relative bg-white z-10 shrink-0 min-h-screen p-4 sm:p-8">
        {/* Background Decorative Glows */}
        <div className="bg-glow absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,127,80,0.08),transparent_70%)] pointer-events-none z-0" />
        <div className="bg-glow absolute bottom-[-5%] right-[-5%] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(79,70,229,0.05),transparent_70%)] pointer-events-none z-0 delay-1000" />

        {/* Logo */}
        <Link
          href="/"
          className="absolute top-6 left-6 sm:top-9 sm:left-9 flex items-center gap-3 no-underline text-slate-900 font-extrabold text-xl sm:text-2xl font-poppins z-20"
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <span>
            SNS <span className="text-[#FF7F50]">Academy</span>
          </span>
        </Link>

        {/* Card Container */}
        <motion.div
          className="w-full px-2 sm:px-4 max-w-[480px] z-10 mt-16 lg:mt-0"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-900/5 p-6 sm:p-10 w-full">
            <AnimatePresence mode="wait">
              {!role ? (
                /* ── Step 1: Role Selection ── */
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="font-poppins text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2.5 tracking-tight">
                      Welcome Back
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      Select your role to access the SNS Academy ERP portal.
                    </p>
                  </div>

                  {/* Role Cards Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        key: "admin" as const,
                        icon: <Shield className="w-8 h-8 sm:w-10 sm:h-10" weight="duotone" />,
                        label: "Admin",
                      },
                      {
                        key: "teacher" as const,
                        icon: <ChalkboardTeacher className="w-8 h-8 sm:w-10 sm:h-10" weight="duotone" />,
                        label: "Teacher",
                      },
                      {
                        key: "parent" as const,
                        icon: <Users className="w-8 h-8 sm:w-10 sm:h-10" weight="duotone" />,
                        label: "Parent",
                      },
                    ].map(({ key, icon, label }) => (
                      <RoleCard
                        key={key}
                        icon={icon}
                        label={label}
                        onClick={() => setRole(key)}
                      />
                    ))}
                  </div>

                  <div className="mt-8 p-4 rounded-2xl bg-[#FF7F50]/5 border border-[#FF7F50]/15 flex items-start gap-3">
                    <Shield size={18} className="text-[#FF7F50] shrink-0 mt-0.5" weight="fill" />
                    <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
                      Secured with end-to-end encryption. Your school credentials and academic logs are fully protected.
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ── Step 2: Login Form ── */
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => {
                      setRole(null);
                      setError("");
                      setEmailOrMobile("");
                      setPassword("");
                    }}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#FF7F50] bg-transparent border-none cursor-pointer text-xs sm:text-sm font-semibold mb-6 p-0 transition-colors duration-200"
                  >
                    <ArrowLeft size={16} weight="bold" /> Back to role selection
                  </button>

                  <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                      {role === "admin" ? (
                        <Shield size={22} className="text-[#FF7F50]" weight="duotone" />
                      ) : role === "teacher" ? (
                        <ChalkboardTeacher size={22} className="text-[#FF7F50]" weight="duotone" />
                      ) : (
                        <Users size={22} className="text-[#FF7F50]" weight="duotone" />
                      )}
                      <h2 className="font-poppins text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight capitalize">
                        {role} Login
                      </h2>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Enter your {role === "parent" ? "student ID" : "email address"} and password
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs sm:text-sm flex items-start gap-2.5"
                    >
                      <Warning size={18} weight="fill" className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email / Mobile */}
                    <div>
                      <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 font-poppins">
                        {role === "parent" ? "Student ID" : "Email Address"}
                      </label>
                      <input
                        type={role === "parent" ? "text" : "email"}
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        placeholder={
                          role === "admin"
                            ? "admin@sns-erp.local"
                            : role === "parent"
                            ? "STD-2026-0001"
                            : "teacher1@sns-erp.local"
                        }
                        required
                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 border border-slate-200/80 outline-none text-slate-900 text-sm sm:text-base transition-all duration-200 focus:border-[#FF7F50] focus:bg-white focus:ring-1 focus:ring-[#FF7F50]/20 font-medium"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 font-poppins">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-4 pr-12 py-3 sm:py-3.5 rounded-xl bg-slate-50 border border-slate-200/80 outline-none text-slate-900 text-sm sm:text-base transition-all duration-200 focus:border-[#FF7F50] focus:bg-white focus:ring-1 focus:ring-[#FF7F50]/20 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlash size={20} weight="bold" />
                          ) : (
                            <Eye size={20} weight="bold" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                      <Link
                        href="#"
                        className="text-xs font-semibold text-[#FF7F50] no-underline hover:text-[#e66a3e] transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base border-none cursor-pointer shadow-lg shadow-[#FF7F50]/25 transition-all duration-300 font-poppins active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#FF7F50]/30"
                      style={{
                        background: "linear-gradient(135deg, #FF7F50 0%, #FF6347 100%)",
                      }}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        <>
                          <span>Sign In to Dashboard</span>
                          <ArrowRight size={18} weight="bold" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="absolute bottom-6 left-0 w-full text-center text-[10px] sm:text-xs text-slate-400 px-4">
          © 2026 SNS Academy ERP · Empowering Education Through Design Thinking
        </p>
      </div>

      {/* ── Right Panel: Decorative (Hidden on mobile) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-center items-center min-h-screen">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/login-side.png')",
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/50 to-[#FF7F50]/40 z-0" />

        {/* Content over image */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF7F50] text-white text-[10px] font-extrabold uppercase tracking-widest rounded-md mb-6 shadow-md shadow-[#FF7F50]/30">
              <Sparkle size={12} weight="fill" />
              SNS Academy ERP
            </div>

            <h2 className="font-poppins text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Empowering Education
              <br />
              Through Innovation
            </h2>
            <p className="text-white/85 text-sm xl:text-base font-medium leading-relaxed mb-10 max-w-md mx-auto">
              A unified platform for parents, teachers, and administrators — bridging the gap between school and home
              seamlessly.
            </p>

            {/* Trust badges */}
            <div className="flex justify-center gap-2.5 flex-wrap">
              {["CBSE Affiliated", "ISO Certified", "Design Thinking Hub"].map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function RoleCard({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center justify-center gap-3 p-4 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-800 cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-sm hover:border-[#FF7F50] hover:bg-white hover:shadow-lg hover:shadow-[#FF7F50]/5"
    >
      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center text-[#FF7F50] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF7F50] group-hover:text-white shrink-0">
        {icon}
      </div>
      <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </motion.button>
  );
}
