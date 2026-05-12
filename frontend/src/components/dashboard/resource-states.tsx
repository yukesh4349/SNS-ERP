import { SpinnerGap, WarningCircle, Info } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function ResourceLoading({ label }: { label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[0_18px_60px_rgba(0,0,0,0.04)]"
    >
      <div className="relative">
        <SpinnerGap size={48} className="animate-spin text-[var(--accent)] opacity-20" />
        <SpinnerGap size={48} className="animate-spin text-[var(--accent)] absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
      </div>
      <p className="mt-6 text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] italic">
        Synchronizing <span className="text-[var(--text-primary)]">{label}</span>
      </p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ResourceError({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-[2.5rem] border-2 border-rose-500/20 bg-rose-50/30 backdrop-blur-md shadow-xl shadow-rose-500/5 flex flex-col items-center text-center"
    >
      <div className="h-16 w-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 mb-6">
        <WarningCircle size={32} weight="fill" />
      </div>
      <h3 className="text-xl font-black text-rose-900 uppercase italic tracking-tight">Connectivity Interruption</h3>
      <p className="mt-2 text-sm text-rose-600 font-medium max-w-sm">
        We encountered an error while retrieving your <span className="font-bold">{label}</span> dossier: {message}
      </p>
      <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-rose-100 flex items-start gap-3 text-left">
        <Info size={20} className="text-rose-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-rose-500 font-bold leading-relaxed">
          TIP: Verify your internet connection and ensure the school backend services are operational. If the problem persists, contact technical support.
        </p>
      </div>
    </motion.div>
  );
}
